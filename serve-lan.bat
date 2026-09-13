@echo off
rem Serve mechanical-keyboarding on every network interface for local testing.
rem Usage: double-click, or  serve-lan.bat [port]
rem The port starts at 8124 (serve.ps1 keeps 8123) and walks up to the next free one.
rem Static files only: serve.ps1's /upload endpoint stays localhost-only on purpose.
rem Needs Node. The server code is the JavaScript below the :JS marker in this file.

where node >nul 2>nul || (echo Node.js was not found on PATH. & pause & exit /b 1)
cd /d "%~dp0"
node -e "eval(require('fs').readFileSync(process.argv[1],'utf8').split(/^:JS\r?$/m)[1])" "%~f0" %*
pause
exit /b

:JS
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const root = process.cwd();
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch { res.writeHead(400); return res.end(); }
  if (rel.endsWith('/')) rel += 'index.html';
  const full = path.resolve(root, '.' + rel);
  if (full !== root && !full.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.stat(full, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {
      'Content-Type': mime[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-store',
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(full).pipe(res);
  });
});

let port = parseInt(process.argv[2], 10) || 8124;
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE' && port < 65535) { port++; server.listen(port, '0.0.0.0'); }
  else { console.error(e.message); process.exit(1); }
});
server.on('listening', () => {
  console.log('Serving ' + root + ' on all interfaces, port ' + port);
  console.log('  http://localhost:' + port + '/');
  for (const list of Object.values(os.networkInterfaces()))
    for (const a of list) if (a.family === 'IPv4' && !a.internal) console.log('  http://' + a.address + ':' + port + '/');
  console.log('Press Ctrl+C to stop.');
});
server.listen(port, '0.0.0.0');
