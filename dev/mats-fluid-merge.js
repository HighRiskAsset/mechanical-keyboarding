// Lays the fluids' marble frames into the live materials sheet, byte for byte.
// dev/mats-fluid.html?strip=1 draws them from the generator (FLUID_ART in
// dev/gen/pixels.js) and uploads assets/inbox/mats-fluid-strip.png + .json:
// one row per fluid, its frames left to right. This puts each row into
// assets/sprites/materials.png and points `mat.<id>` at it as a strip
// ({x, y, w, h, n, clock: 'fluid'}), which js/sprites.js reads as frames.
//
// Why not in the browser, the way dev/mats-v4.html merges: a canvas stores
// its pixels premultiplied, and the round trip nudges the grade twinkles'
// semi-transparent pixels by one. Here every pixel that is not a fluid's
// comes out exactly as it went in.
//
// A fluid that already has a strip of the right size is redrawn in place. A
// fluid still on a single cell gets a new row at the foot of the sheet, and
// its old cell is cleared, so nothing on the sheet is left pointing nowhere.
//
// usage: node dev/mats-fluid-merge.js           writes to assets/inbox
//        node dev/mats-fluid-merge.js --to=sprites   writes the live sheet
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.join(__dirname, '..');
const INBOX = path.join(ROOT, 'assets', 'inbox');
const SPRITES = path.join(ROOT, 'assets', 'sprites');
const toSprites = process.argv.includes('--to=sprites');

// ---- PNG: 8-bit RGBA, not interlaced (what the bake and a canvas write) ----
function readPng(file) {
  const b = fs.readFileSync(file);
  let o = 8, w = 0, h = 0;
  const idat = [], keep = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), type = b.toString('ascii', o + 4, o + 8);
    const data = b.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw new Error(file + ': want 8-bit RGBA, not interlaced');
    } else if (type === 'IDAT') idat.push(data);
    else if (type !== 'IEND') keep.push(b.subarray(o, o + 12 + len));   // sRGB, gAMA, pHYs ride along untouched
    o += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(w * h * 4), bpp = 4, stride = w * 4;
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? px[dst + i - bpp] : 0;
      const up = y > 0 ? px[dst - stride + i] : 0;
      const ul = y > 0 && i >= bpp ? px[dst - stride + i - bpp] : 0;
      let v = raw[src + i];
      if (f === 1) v += a;
      else if (f === 2) v += up;
      else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const p = a + up - ul, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - ul); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : ul; }
      px[dst + i] = v & 255;
    }
  }
  return { w, h, px, keep };
}
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const x of buf) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function writePng(file, { w, h, px, keep }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), ...(keep || []),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]));
}

const strip = readPng(path.join(INBOX, 'mats-fluid-strip.png'));
const spec = JSON.parse(fs.readFileSync(path.join(INBOX, 'mats-fluid-strip.json'), 'utf8'));
const sheet = readPng(path.join(SPRITES, 'materials.png'));
const man = JSON.parse(fs.readFileSync(path.join(SPRITES, 'materials.json'), 'utf8'));
const PX = spec.px, N = spec.frames;
if (strip.w !== N * PX || strip.h !== spec.ids.length * PX) throw new Error('strip is ' + strip.w + 'x' + strip.h + ', its json says ' + N + ' frames of ' + spec.ids.length);

// grow the sheet first: every fluid not yet on a strip wants a row of its own
const fresh = spec.ids.filter((id) => { const e = man.sprites['mat.' + id]; return !(e && e.n === N && e.w === PX && e.h === PX); });
const W = Math.max(sheet.w, N * PX), H = sheet.h + fresh.length * PX;
const px = Buffer.alloc(W * H * 4);
for (let y = 0; y < sheet.h; y++) sheet.px.copy(px, y * W * 4, y * sheet.w * 4, (y + 1) * sheet.w * 4);
const cleared = new Set();
const blit = (sx, sy, dx, dy, w, h, clear) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = ((dy + y) * W + dx + x) * 4;
    if (clear) { px.fill(0, d, d + 4); cleared.add(d / 4); }
    else strip.px.copy(px, d, ((sy + y) * strip.w + sx + x) * 4, ((sy + y) * strip.w + sx + x) * 4 + 4);
  }
};
let row = 0;
spec.ids.forEach((id, r) => {
  const key = 'mat.' + id;
  let e = man.sprites[key];
  if (fresh.includes(id)) {
    if (e) blit(0, 0, e.x, e.y, e.w, e.h, true);
    e = man.sprites[key] = { x: 0, y: sheet.h + row * PX, w: PX, h: PX, n: N, clock: 'fluid' };
    row++;
  }
  blit(0, r * PX, e.x, e.y, N * PX, PX);
  console.log(key + ' -> ' + e.x + ',' + e.y + ' x' + N + (fresh.includes(id) ? ' (new row)' : ' (in place)'));
});

const outDir = toSprites ? SPRITES : INBOX;
writePng(path.join(outDir, 'materials.png'), { w: W, h: H, px, keep: sheet.keep });
fs.writeFileSync(path.join(outDir, 'materials.json'), JSON.stringify(man, null, 1));
// the proof that nothing else moved: every pixel outside the fluids' cells
const back = readPng(path.join(outDir, 'materials.png'));
const owned = new Set();
for (const id of spec.ids) {
  const e = man.sprites['mat.' + id];
  for (let y = 0; y < PX; y++) for (let x = 0; x < N * PX; x++) owned.add((e.y + y) * W + e.x + x);
}
let moved = 0;
for (let y = 0; y < sheet.h; y++) for (let x = 0; x < sheet.w; x++) {
  const i = y * W + x;
  if (owned.has(i) || cleared.has(i)) continue;
  if (sheet.px.readUInt32BE((y * sheet.w + x) * 4) !== back.px.readUInt32BE(i * 4)) moved++;
}
console.log('sheet ' + sheet.w + 'x' + sheet.h + ' -> ' + W + 'x' + H + ', written to ' + path.relative(ROOT, outDir) + '; pixels moved outside the fluids: ' + moved);
