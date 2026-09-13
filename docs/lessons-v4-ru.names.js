// Names for the v4 tree, first pass (2026-09-12). Inspiration: Satisfactory.
// The only rule is logic: every recipe should read as a sensible
// combination, ingot from ores and coal, part from ingot and part,
// machine from parts. Purely aesthetic otherwise; refine freely. Keyed by
// material id as the builder numbers them (see docs/tree-v4-ru.json) and by
// machine id. The builder folds these into js/tree-ru.js.
'use strict';

module.exports = {
  materials: {
    // raws, one per mine, in column order; R5, R9, R12 are fluids (pipes)
    R1: 'Iron Ore', R2: 'Copper Ore', R3: 'Limestone', R4: 'Coal', R5: 'Water', R6: 'Caterium Ore', R7: 'Raw Quartz',
    R8: 'Sulfur', R9: 'Crude Oil', R10: 'Bauxite', R11: 'Uranium', R12: 'Nitrogen Gas', R13: 'SAM Ore',
    // syllable lessons: smelts and refinings
    S1: 'Copper Ingot',            // copper ore + iron ore (the copper alloy ingot)
    S2: 'Iron Ingot',              // iron ore + limestone (the basic iron ingot)
    S3: 'Steel Ingot',             // coal + iron ore
    S4: 'Solid Steel Ingot',       // steel pipe + coal + iron ore, re-smelted dense
    S5: 'Iron Slurry',             // water + iron ore (fluid)
    S6: 'Caterium Ingot',          // caterium ore + iron ore + copper ore
    S7: 'Quartz Crystal',          // raw quartz + iron ore + limestone
    S8: 'Black Powder',            // sulfur + coal + iron ore
    S9: 'Pig Iron',                // compacted coal + iron ore + limestone
    S10: 'Polymer Composite',      // plastic + iron ore + limestone
    S11: 'Aluminum Ingot',         // aluminum scrap + iron ore + copper ore
    S12: 'Encased Uranium Cell',   // uranium + iron ore + limestone
    S13: 'Nitric Acid',            // nitrogen gas + coal + iron ore (fluid)
    S14: 'Magnetic Core',          // battery + coal + iron ore
    // key-group lessons: a basic part from an ingot or a raw
    K1: 'Iron Rod', K2: 'Steel Pipe', K3: 'Iron Casting', K4: 'Caterium Filament', K5: 'Silica', K6: 'Compacted Coal',
    K7: 'Plastic', K8: 'Aluminum Scrap', K9: 'Uranium Fuel Rod', K10: 'Battery', K11: 'Reanimated SAM',
    K12: 'Power Shard', K13: 'Superposition Oscillator', K14: 'Excited Photonic Matter',
    // words lessons: parts
    W1: 'Copper Sheet', W2: 'Iron Plate', W3: 'Wire', W4: 'Steel Beam', W5: 'Encased Industrial Beam', W6: 'Iron Rebar',
    W7: 'Quickwire', W8: 'Crystal Oscillator', W9: 'Nobelisk', W10: 'Iron Casing', W11: 'Circuit Board',
    W12: 'Alclad Aluminum Sheet', W13: 'Electromagnetic Control Rod', W14: 'Fused Modular Frame', W15: 'Magnetic Field Generator',
    // phrases: frames
    P1: 'Reinforced Iron Plate', P2: 'Modular Frame',
    // sentence lessons: machines and assemblies
    T1: 'Rotor', T2: 'Stator', T3: 'Motor', T4: 'Heavy Modular Frame', T5: 'Radio Control Unit', T6: 'Control Panel',
    T7: 'Nobelisk Detonator', T8: 'Turbine Housing', T9: 'Fuel Generator', T10: 'Computer', T11: 'Supercomputer',
    T12: 'Heat Sink', T13: 'Cooling System', T14: 'Reactor Assembly', T15: 'Turbo Motor', T16: 'Assembly Director System',
    T17: 'SAM Fluctuator', T18: 'Alien Power Matrix', T19: 'Ballistic Warp Drive',
    // byproducts: what comes out beside the material
    B1: 'Screw', B2: 'Steel Offcuts', B3: 'Slag', B4: 'Spare Wire', B5: 'Iron Scrap', B6: 'Quartz Dust', B7: 'Sulfuric Residue',
    B8: 'Heavy Oil Residue', B9: 'Polymer Resin', B10: 'Petroleum Coke', B11: 'Concrete', B12: 'Uranium Waste',
    B13: 'Copper Powder', B14: 'Iron Filings',
    // pages: printed matter, by category and grade
    G1: 'Gazette I', G2: 'Letter I', G3: 'Book I', G4: 'Almanac I', G5: 'Gazette II', G6: 'Book II', G7: 'Letter II', G8: 'Script I',
    G9: 'Almanac II', G10: 'Script II', G11: 'Gazette III', G12: 'Blueprint I', G13: 'Book III', G14: 'Letter III', G15: 'Script III',
    G16: 'Blueprint II', G17: 'Almanac III', G18: 'Blueprint III', G19: 'Formula Sheet', G20: 'Program Listing',
  },
  machines: {
    M1: 'Foundry', M2: 'Crusher', M3: 'Manufacturer', M4: 'Constructor', M5: 'Packager', M6: 'Refinery',
    M7: 'Fractionator', M8: 'Assembler', M9: 'Blender', M10: 'Fabricator', M11: 'Workshop', M12: 'Fitting Shop',
  },
  // a mine is named by its raw; fluids get an extractor
  mineOf: (raw, fluid) => (fluid ? raw + ' Extractor' : raw + ' Mine'),
};
