// RU mechanics layer for lesson plan v4 (2026-09-11, third cut). The model:
// materials and machines. Some materials are raw. A recipe, at a machine,
// turns one or more input materials into one or more output materials. A
// lesson is one recipe or one raw. Prices are made of materials. That is
// all. dev/tech-tree-v4-build.js derives the rest and renders
// docs/tech-tree-v4-ru.html. Ids only; naming comes later.
//
// One recipe makes one material. An automated recipe refuses hand work, so
// automation is what retires a lesson; nothing is ever remade another way.
// Satisfactory's shape: 13 raws, about 80 made materials, 11 machines.
'use strict';

module.exports = {
  // the thirteen raws (Satisfactory's count): a mine every other column
  // from C3 on, letters and marks alike, so a new raw keeps arriving all
  // game; every other introduction is a recipe on the newest raw and the
  // previous column's newest material, so new keys need the lesson before
  // them: the gate is always the inputs
  mines: ['I-01', 'I-02', 'I-03', 'I-05', 'I-07', 'I-09', 'I-11', 'I-13', 'I-15', 'I-17', 'I-19', 'I-21', 'I-23'],

  // one recipe, one material: nothing is ever reused. Automation is the
  // only thing that retires a lesson.
  pools: null,

  // machines have shapes: so many belts and pipes in, so many out, from
  // this roster (Satisfactory's, near enough). A recipe goes to the open
  // machine of the smallest shape that fits it, rotating among those with
  // room; when none has room, a machine of that shape opens at that column.
  // Machines do not gate lessons; their cost is a purchase, the inputs are
  // the gate.
  shapes: [
    { bi: 1, pi: 0, bo: 1, po: 0 },   // 1 belt in, 1 belt out
    { bi: 1, pi: 0, bo: 2, po: 0 },   // 1 belt in, 2 out
    { bi: 2, pi: 0, bo: 1, po: 0 },   // 2 belts in, 1 out
    { bi: 3, pi: 0, bo: 1, po: 0 },   // 3 belts in, 1 out
    { bi: 2, pi: 0, bo: 2, po: 0 },   // 2 belts in, 2 out
    { bi: 2, pi: 0, bo: 3, po: 0 },   // 2 belts in, 3 out
    { bi: 3, pi: 0, bo: 2, po: 0 },   // 3 belts in, 2 out
    { bi: 1, pi: 1, bo: 1, po: 1 },   // a belt and a pipe in, a belt and a pipe out
    { bi: 2, pi: 1, bo: 1, po: 1 },   // 2 belts and a pipe in, a belt and a pipe out
  ],
  machinesCap: 11,
  // three raws travel by pipe (which three is a naming choice); a syllable
  // recipe fed by a fluid makes a fluid
  fluids: ['R5', 'R9', 'R12'],
  // the raws drawn from a pool rather than a seam: a map lays each one as a
  // small authored pool that takes exactly one four-by-four extractor, so
  // supply stays countable the way a vein's is (user ruling 2026-09-16).
  // Not `pools` above: that key is how many recipes may share a material,
  // and a second `pools` here once silently replaced it, folding 84
  // materials into 28 (2026-09-16).
  poolRaws: ['R5', 'R9'],
  // byproducts come out beside a lesson's material: one from three of the
  // gathers (2:2) and from five key-group recipes (1:2), two from the other
  // three gathers (2:3). Pages are printed on them and machines are built
  // with them, in turn, so every one has takers.
  byproducts: { 'E-11': 1, 'E-18': 2, 'E-26': 1, 'E-33': 2, 'E-40': 1, 'E-47': 2, 'I-04': 1, 'I-08': 1, 'I-12': 1, 'I-16': 1, 'I-20': 1 },

  // quantities: a run of a recipe consumes so many of each input (belts
  // first, then pipes, in the recipe's order) and yields so many of each
  // output (the material first, then its byproducts). Defaults by machine
  // shape, overrides by lesson id. A syllable material going into a words
  // lesson counts double on top of these.
  quantities: {
    byShape: {
      '1b0p>1b0p': { in: [1], out: [1] },
      '1b0p>2b0p': { in: [1], out: [2, 1] },
      '2b0p>1b0p': { in: [1, 1], out: [1] },
      '3b0p>1b0p': { in: [1, 1, 1], out: [1] },
      '2b0p>2b0p': { in: [1, 1], out: [1, 1] },
      '2b0p>3b0p': { in: [3, 2], out: [1, 3, 4] },
      '3b0p>2b0p': { in: [2, 1, 1], out: [2, 1] },
      '1b1p>1b1p': { in: [1, 2], out: [1, 1] },
      '2b1p>1b1p': { in: [1, 1, 2], out: [1, 1] },
    },
    byLesson: {},
  },
  ratioRules: { syllablesIntoWords: 2 },

  // budgets: minutes of hand typing per purchase, counted through every
  // un-automated input; quantities are derived from them
  pricing: {
    pace: 1.2,
    mine: { newest: 9, review: 5, raw: 3 },   // a new mine: the previous column's materials, an older one, and some of the previous raw
    build: { newest: 8, raw: 4 },          // a machine: the newest material and the newest raw
    automation: { later: 8 },              // a recipe's or a mine's automation: two materials from two columns later
    pageRun: 6,                            // a page column's print run: this many of each page material made there
    firstFree: ['I-01'],                   // the first mine is there at the start
  },

  sim: {
    charsPerItem: { streams: 4, syllables: 3, words: 6.5, phrases: 12, sentences: 26, full: 38, pages: 200 },
    cpm: 150,   // a flat 30 words a minute: a scale for the workloads, not a prediction; a real player speeds up
    digitShare: 0.25, capsShare: 3.0,
  },
};
