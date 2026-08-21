// Developer mode: the one switch that arms the game's cheats. It is off until
// somebody turns it on in Settings, and it is remembered on this device the
// same way the interface language is — a preference, not world progress, so it
// survives a reset and follows the player across every world.
//
// Everything that hands out what the game would otherwise make you earn asks
// isEnabled() first. Keep it that way: one gate, one place to read to know
// what a player with the box unticked can and cannot reach.
// Global namespace: DEV
(function () {
  'use strict';

  const STORAGE_KEY = 'mk.devmode';

  let enabled = false;
  try { enabled = localStorage.getItem(STORAGE_KEY) === 'on'; } catch { /* default off */ }

  function isEnabled() { return enabled; }

  function setEnabled(on) {
    enabled = !!on;
    try { localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off'); } catch { /* non-fatal */ }
  }

  window.DEV = { isEnabled, setEnabled };
})();
