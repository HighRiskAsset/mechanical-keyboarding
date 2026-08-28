# mechanical-keyboarding

## Testing: keep the game silent

Both audio switches stay off during testing, unless the change under test is
one of them. The development machine has its speakers on, and a verification
pass should not be audible.

The two player switches are the header buttons `#btn-sfx` and `#btn-music`
(index.html:113). Clicking them is the same act as setting their keys, since
`setSfx` and `setMusic` write straight to localStorage. To come up silent
without clicking anything, set the keys before the first load, then reload:

```js
localStorage.setItem('mk.sound', 'off');    // sfx: clicks, thuds, dings
localStorage.setItem('mk.music', 'off');    // the typing rhythm and js/music.js
localStorage.setItem('mk.weather', 'off');  // sky ambience; no header button
location.reload();
```

Weather has no button of its own, being a developer switch while the bed is
still being judged, but it makes noise, so it goes off with the other two.

js/audio.js reads all three keys once at startup, so they have to be in place
before the page loads. `AUDIO.setMuted(true)` silences everything as well, but
it does not persist and is gone on the next reload.

localStorage is per origin, and serve.ps1 takes the next free port when 8123 is
busy. A new port is a new origin with empty storage, so set the keys again on
the first load of each session rather than assuming last session's silence
carried over.

The exception is audio work itself. When the change is to js/audio.js,
js/music.js or the weather bed, turn on the one bus under test and leave the
other two off.
