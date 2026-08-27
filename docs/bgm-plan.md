# BGM — the soundtrack plan (drafted 2026-08-27, redirected same day)

## The correction that matters

The first draft of this plan aimed at *calm ambient texture* and used Factorio
as the reference. **That was wrong** (user ruling 2026-08-27): it is the
Minecraft failure mode — music that avoids being distracting by avoiding being
anything. It buys inoffensiveness with blandness, and blandness is its own
kind of fatigue.

The error was collapsing two separate axes:

- **Arousal** — tempo, drum intensity, dynamic swells, tension. This must stay
  low. The five invariants say *no timers, no time pressure ever*, and music
  that pushes is time pressure by another route.
- **Musical interest** — a walking bassline, two voices in counterpoint, a
  chord progression that goes somewhere, an A/B structure, an actual tune.
  This has **no reason to be low**, and the first draft killed it anyway.

What makes a Pokémon battle theme survive a thousand plays is not its tempo.
It is a bass part interesting on its own, a countermelody you can follow
instead of the tune, a surprise chord in bar six, and a structure that answers
itself. Take the adrenaline off and all of that craft remains.

## References (user rulings 2026-08-27)

- **Tycoon / management soundtracks** — Transport Tycoon, RollerCoaster
  Tycoon, SimCity 2000, Theme Hospital. These games have this exact problem
  (hundreds of hours, one screen, low urgency) and solved it with character,
  not absence. People still hum RCT.
- **StarCraft 1 Terran themes** — the model for the industrial half, and
  **SC1 over SC2**: the first is retro and atmospheric, the second leans into
  overt country-western twang. Take from it: reverbed tremolo guitar, a lot of
  room in the mix, laid-back attitude rather than a march, and above all
  **machine noise used as the percussion** — clanks, metal hits, hydraulic
  knocks. That last point is technical as well as thematic: industrial hits
  sit low-mid, so they groove hard without putting anything in the 2–5 kHz
  band where the key clicks live. A hi-hat fights the typing; an anvil does
  not. Same use case, too — it runs for hours while you build a base.
  **Take the grim with it** (user ruling 2026-08-27, reversing an earlier call
  in this document to lift SC1 into major — that was wrong). See *Tone* below.
- **SNES RPG town and field themes**, not the ambient overworld beds —
  Goldenrod City, not a wind loop. This is where the timbre palette comes from.
- **Explicitly not**: Factorio, Minecraft, ambient wallpaper.

Style stays where the art is: the land is FF3-USA, the machines are FF6.
**FF6's voice, doing Transport Tycoon's job, with StarCraft's percussion.**

## Tone — mist, not butterflies (user ruling 2026-08-27)

The world should read **slightly less bright than it does now**: less
butterflies, more mist and mystery, **a hint of lurking danger**. There is a
mystery to solve here.

This is already in the premise and the soundtrack was ignoring it: *you land
on a resource frontier dotted with dormant machines.* Someone built them.
Someone left. **The dormant machines are the mystery**, and the player should
feel that before anything tells them.

The needle to thread is **dread without urgency** — the five invariants still
forbid timers and time pressure, so danger must be implied and must *never
arrive*. Tension that resolves is a battle theme; tension that never resolves
is atmosphere. Concretely:

- **Do not resolve to major.** Dorian and aeolian; a raised fourth or a flat
  second where unease is wanted. The bright-major arrangements described
  earlier in this document are re-tuned accordingly.
- **Leave phrases leaning.** End on the dominant, or on an unresolved
  suspension. The ear stays tilted forward without being pushed.
- **A pedal drone under a moving tune.** The friction between a bass that will
  not move and harmony that does is most of the effect, and it costs one note.
- **Space is the mist.** Long reverb tails, distant placement, a low-passed
  far layer. Mist is literally reverb and a filter.
- **One unexplained motif.** A three-note figure that recurs in every track and
  is never resolved or accounted for. That *is* the mystery, rendered in sound,
  and it plugs straight into the one-theme-per-place structure below — except
  the theme is now **a question, not a tune**.
- **Never a sting.** No stabs, no risers, no jump-scare punctuation. The danger
  is weather, not an event.

**This does not fight the dopamine goal — it sharpens it.** The juice lives in
the SFX layer (keystroke, streak, delivery); the mystery lives in the BGM
layer. Bright, escalating feedback over a darker bed is a standard and very
effective pairing — Hollow Knight, Hades, Subnautica — and the contrast makes
the juice hit *harder*: a bright ping reads brighter over mist than it does
over cheer.

**Open question for DESIGN.md:** its opening line describes the game as
"bright anime-flavored pixel art", and the ENVIRONMENT PLAN specifies distinct
bright per-region palettes. This ruling moves that. The art direction needs the
same re-tune, and DESIGN.md is the source of truth — this document should not
be the only place the change is recorded.

## Timbre — sequenced, not recorded (user ruling 2026-08-27)

The v5.5 take on MK 00 landed tonally, but **sounds too realistic**: a real
violin and a real flute clash against true pixel graphics. The music has to be
as sampled as the art is.

Push every prompt toward **sequenced, not recorded**: short looped 32 kHz
SPC700-style samples, a GM MIDI soundfont character, slightly grainy and
quantized — the way a Super Nintendo *sequences* a flute rather than a
recording of one. **Not square-wave chiptune** — the ask is a tinge, not a
genre change. The working clause, which goes near the front of the prompt where
it carries weight:

> Sampled and synthetic, NOT a real orchestra: short looped 32kHz SPC700
> samples, GM MIDI soundfont character, slightly grainy and quantized. Not
> square-wave chiptune, but clearly sequenced.

**Model: v5.5 only** (Pro, from 2026-08-27). The v4.5 takes are not used —
ignore them in the workspace and do not download them.

## Mode balance — the melody carries the hope (user concern 2026-08-27)

Worry raised: the mist direction may be **too much minor key for a
dopamine-spiking game**. The worry is right, and the fix is not a retreat to
major. It is placement:

- **Dorian is not sad.** Its major sixth is why it reads as *adventure* rather
  than *grief*, and it is the mode most beloved exploration music sits in.
  Keep it as the default bed.
- **Aeolian is where the sadness actually lives.** Keep natural minor out of
  the high-traffic spaces. The bog can have it; the basin cannot.
- **Mixolydian is the reward mode** — major with a flat seventh, heroic
  without turning sweet. The Works and anything that plays after an
  achievement belong here.
- **Split the layers: harmony carries the mystery, melody carries the hope.**
  A wistful modal bed under a rising, singable tune is the whole trick. You do
  not have to choose between dopamine and mystery — they go in different
  voices.

**Reference: Bravely Default's Norende village-rebuilding theme** (user, same
day). The music box is not the ask — *the melody* is: a clear singable line
with a rising, hopeful contour over a gentle accompaniment, wistful underneath
because it is about rebuilding something that was lost. That is this game's
premise exactly — a frontier of machines somebody built and abandoned — and it
is the target for every place loop.

**The hard consequence, and the strongest argument here.** If the SFX are
key-locked to the BGM (see *Key-locked SFX*, the headline idea of this plan),
then a relentlessly minor soundtrack **makes the reward sounds sad too**. A
pickup run resolving in natural minor reads as a loss, not a win — the juice
inverts. Keeping the high-traffic tracks dorian or mixolydian is therefore not
a taste call; it is what lets the reward layer work at all.

## The rules

1. **No lyrics, ever.** The one rule with no exception. Words compete directly
   with the language processing typing *is*. Generated instrumental-only,
   never "vocals mixed low".
2. **Write a real tune.** A section, contrasting B section, back to A. Two or
   three voices in counterpoint so the ear has somewhere else to go on the
   fortieth listen. A bassline worth hearing alone.
3. **Harmony moves.** Secondary dominants, modal mixture, a chord that is not
   the expected one. The first draft's "long held chords, very slow harmonic
   rhythm" is struck.
4. **Low arousal, not low interest.** Moderate tempo, relaxed groove, never
   rushed. No tension, no danger, no dramatic build, no swells. Busy is fine;
   *urgent* is not.
5. **Percussion is industrial, not kit.** Anvils, metal hits, woodblock,
   hydraulic knocks, brushed low toms — the StarCraft trick. No bright
   hi-hats, no crash cymbals, no snare rimshots. Keep 2–5 kHz clear for the
   key clicks in `js/audio.js`.
6. **Fatigue is fought with rotation and length, not blandness.** A 4-minute
   A/B track in a pool of three is heard far less often than a 90-second loop.
   That, not absence of melody, is the anti-earworm mechanism.

## The Frontier Theme, arranged per place

The structural idea, and the thing that turns 13 tracks into a soundtrack
rather than a playlist: **one 8-bar theme, re-arranged for every place.** This
is the FF/Pokémon trick. It buys coherence and interest at once, and it means
a player who has been in the basin for five hours hears something *familiar
but re-voiced* when the quarry opens, instead of an unrelated cue.

| Place | The theme, arranged as |
|---|---|
| **Basin** | flute and clarinet trade the figure, walking pizzicato bass, light guitar — dorian, warm but not sunny; the least misty in the set, because it is home |
| **Quarry Hills** | muted trumpet over dusty low guitar, hammer-on-stone percussion — dorian, dry, the wind carrying it |
| **Crystal Canyon** | celesta and glockenspiel, harp, high strings over a low drone — lydian-minor, the figure stretched slow and made strange |
| **Coal Bog** | bassoon lead, low strings, tremolo marimba — aeolian with a flat second; the most openly uneasy place |
| **Oil Flats** | reverbed tremolo guitar and bowed swells over a pedal — wide, hot, empty; the most SC1 of the set |
| **Snow Peaks** | high strings and horn, celesta, long tails — aeolian opening to major only at the very end, because it is the finish site |
| **The Works** | the figure inverted into a low brass ostinato over a walking-beam groove — the mystery *as machinery*, and the one place it sounds under control |
| **Launch** | full orchestra; the figure finally resolves. **The only resolution in the game.** |

**Practical route:** Suno's **Cover / Remix** re-arranges an existing song in a
new style. Generate the Frontier Theme once, get it right, then Cover it per
biome. Far better than describing the same melody nine times in prose — and
Remix is available on the free plan.

## The set — CUT TO 7 (user ruling 2026-08-28)

The 13-track set below was over-specified. Judged critically, it was finer
grained than the games it cites: FF3 does not give every area a theme, and
Pokémon covers dozens of routes with a couple of route themes. The cut:

**FINAL — in `assets/bgm/`, 7 tracks, 15:02, 16.8 MB.** Every take is
kept in `assets/bgm-takes/` (33 files) in case a pick is rejected on listening.

| # | File | Covers | Mode · length |
|---|---|---|---|
| 1 | `assets/bgm/01-basin-a.mp3` | home, T0–T1 | C dorian · 2:03 *(fade trimmed)* |
| 2 | `02-basin-b.mp3` | home rotation | C dorian · 1:42 |
| 3 | `03-far-frontier.mp3` | quarry + canyon + flats | C dorian · 2:43 *(fade trimmed)* |
| 4 | `04-coal-bog.mp3` | the uneasy outlier | G aeolian (conf 0.94) · 3:01 |
| 5 | `05-snow-peaks.mp3` | finish site | G mixolydian · 2:09 *(fade trimmed)* |
| 6 | `06-the-works.mp3` | any automated place | D mixolydian · 1:27 |
| 7 | `07-launch.mp3` | the finish | **C major** (conf 0.90) · 1:57 |

No track in the set is aeolian except the bog, which is the one place the
*Mode balance* ruling allows it. The mode worry is answered.

**16.8 MB at 112–190 kbps.** Re-encoding the set uniformly at 112 kbps would
bring it near 12 MB, comfortably inside the deploy budget.

### Two techniques that worked

- **Lead the prompt with the mode.** Three attempts at a bright Works with the
  key buried mid-prompt gave 2 bright takes out of 6. Moving `BRIGHT MAJOR KEY
  victory theme in C major. Major third, major sixth, major seventh
  throughout. Absolutely NO minor chords...` to the *first sentence* gave
  **2 out of 2** on Launch. Position beats emphasis.
- **Suno's fade-out is consistently ~3 seconds.** A blanket 3 s trim with a
  30 ms guard fade removes it; verified by re-measuring the tail against the
  track mean (`+0.3`, `−3.0`, `+1.3` dB after trimming, from `−21.9`, `−6.6`,
  `−15.2` before).

**What was cut and why.** Quarry, canyon and flats are one emotional place —
dry, working, away from home — so they share a track. Basin ×3 → ×2: two
tracks of 2–3 minutes is real rotation. The Works ×2 → ×1. **Landing** is
heard once for ninety seconds and "First Light" already carries arrival.
**The Passport** is cut on *design* grounds, not cost: changing music when an
overlay opens draws attention to the overlay — duck the current track instead.

The real cost of a big set was never generation, which is cheap on Pro. It was
**auditioning** — 13 tracks × 2 takes is 26 listens, and that is the user's
time. Nothing here is irreversible; more can always be made.

## The set as originally specified — 13 tracks (superseded by the cut above)

Sized to where the hours go (T0–T1 ≈ 5–6 h in the basin alone; T5–T6 ≈ 9 h in
a world already running).

**Place loops (8).** Basin gets **three** — the theme arrangement plus two
*different tunes*, because one melody for five straight hours is the problem
rotation is meant to solve. Quarry, Canyon, Bog, Flats, Peaks get one each,
rotating with the basin pool while the player stands in them.

**The works (2).** Once a place's machines are mostly automated, its place
loop gives way to a works track. The world already transforms from empty
frontier to running factory — the strongest musical arc available, and free:
no new action, no new decision, no walking time, so it costs nothing against
the 80%-is-typing yardstick. **This is where real drive belongs.** A walking
bassline over industrial percussion is thematically exact when the on-screen
world is pumping, and it is the reward for having built the thing. This is the
most StarCraft-Terran corner of the soundtrack.

**Moments (3).** Landing (once, at the pad), The Passport (under the summary
overlay), Launch (the finish). **Launch is the one track that may build and
may have an ending** — the only moment in 32 hours where a climax is right,
and it lands harder for being the only one.

## The dopamine loop is not the BGM's job (user goal 2026-08-27)

Goal: make this addictive and dopamine-spiking the way a mobile game is, *if
possible*. It is possible, but the lever is not the soundtrack. **Music is the
floor; the spike is the juice.** Candy Crush's soundtrack is forgettable and
the game is still compulsive, because every swap detonates.

**The atomic action here is a keystroke** — 30–60 a minute, for 32 hours. That
is the unit the loop has to pay off, and the game already has the mechanism:
`AUDIO.pickup` *climbs a semitone per good while they keep coming*. That is a
combo sound. Extend that pattern downward onto the key, rather than inventing
anything.

### What the BGM contributes

- **Tempo locks to typing cadence.** At 30–40 WPM the player produces 2.5–3.3
  characters per second; at **90–100 BPM** that is about two characters per
  beat, so typing sits on the grid instead of floating over it. Every track in
  the set should land in that window unless it has a reason not to.
- **A clear backbeat** to lock to — another reason ambient was the wrong call.
- **A published root note.** Every track ships its key in metadata (see below).

### Key-locked SFX — the highest-leverage idea in this document

Ship each track's root note alongside the file; have `js/audio.js` transpose
the click ladder and the pickup run into that key. Then **typing plays along
with the music**: the player is an instrument, not someone typing over a
soundtrack. It is what makes rhythm games feel expensive, it costs almost
nothing, and a typing game is already a rhythm instrument.

This only works because the soundtrack has a key. A texture bed has nothing to
lock to — a second reason the ambient direction had to go.

### The juice list, in leverage order

1. **Pitch climbs within a word.** Each correct character clicks a step up the
   scale; resets at the word boundary or on an error. Turns every word into a
   small rising phrase. Highest leverage in the game — it fires more than
   anything else.
2. **Word completion resolves.** A short consonant chord or bell landing on
   the beat.
3. **Streak escalation as texture.** Every N correct characters, add a
   harmonic or an octave to the click layer. The reward *grows*.
4. **The music opens up on a streak.** Sweep a low-pass filter open on the BGM
   bus as the streak climbs, closed when it breaks. One WebAudio node, reads
   as the world responding. **Note:** this is the workaround for having no
   stems — stem separation is Pro/Premier only, so a real layered-stem mix is
   off the table on the free plan. The filter gets 80% of the effect for none
   of the cost.
5. **Visual, in the same order:** number pop on delivery, a scale-punch (never
   a screen shake) when a machine completes, the bag icon bouncing as it
   receives, particles at streak milestones. These want their own pass with
   `js/pixels.js`; this document does not own them.

### The guardrail

Mobile-game dopamine usually leans on urgency and punishment, and **that half
is forbidden here.** The five invariants say accuracy and repetition are the
point, with *no timers and no time pressure ever*, and that accuracy is never
a lock. So: **all carrot, no stick.** A streak that builds and quietly resets
is fine. A streak that flashes red, a countdown bar, a fail state, a combo
timer — each of those is the invariant broken, whatever it does for
engagement. Cookie Clicker and Balatro are proof the carrot half works alone.

## What is NOT Suno

**Stingers stay in `js/audio.js`.** Tier bar met, machine built, crossing
repaired, pair bought — 1–3 second events needing sample-accurate timing, in
the same sonic family as `AUDIO.pickup`, `AUDIO.poof` and the arrival whistle.
Suno cannot cut that short or that clean, and a generated fanfare would be the
one sound in the game that came from somewhere else.

## Playback (`js/music.js`, not yet built)

- **Crossfade-loop, never a hard loop.** At `duration - 3s`, restart the buffer
  with a 3-second equal-power crossfade. Hides whatever intro and ending Suno
  wrote.
- **Shuffle inside a pool**, never repeat one file back to back. Each context
  is a pool (basin = 3, a biome = its own + the basin pool, works = 2).
- **Crossfade on region change**, ~2 s, off `CHAIN.regionAt()`. Require the new
  region to hold for a beat first — the meadow-to-biome boundary is
  deliberately a ragged band, not a line, and must not retrigger per step.
- **Its own preference and volume.** `mk.music`, separate from `mk.sound`.
  Wanting clicks without music is a normal thing to want in a typing game, and
  so is the reverse.
- **Start on the first keystroke**, not on load — browsers block audio without
  a gesture; `ensureCtx()` already handles this pattern.
- **Duck, don't stop**, under the arrival whistle.

### Budget

13 tracks × ~3.5 min at 128 kbps ≈ 45 MB — too much to push over SFTP on every
deploy. Encode at **96–112 kbps**, ship the basin pool eagerly and fetch the
rest per region on first entry.

## The Suno recipe

Free plan: **v4.5-all**, Instrumental ON, one generation at a time (shared
queue), ~10 credits each, 50/day. Shared skeleton, one paragraph swapped:

> 16-bit SNES JRPG soundtrack, SPC700 sampled orchestra, instrumental only.
> **‹the place and its instruments›**. **‹tempo, key, and where the harmony
> goes›**. A real tune: an A section and a contrasting B section, a
> countermelody in a second voice, and a walking bassline interesting on its
> own. Modal and unresolved — a low drone the harmony moves against, phrases
> that end leaning rather than landing. Misty, spacious, faintly uneasy;
> curious rather than threatening. Relaxed and never rushed, no dramatic
> build, no stabs or risers, steady dynamics. Percussion is industrial — anvil, metal
> hits, woodblock, brushed low toms — no bright hi-hats, no crash cymbals, no
> snare rimshots. Loopable, no long intro, no fade ending. Warm plate reverb,
> slight tape warble, lo-fi 32kHz sample character.

Sentences three, four and five are load-bearing and never change.

### First to generate

**MK 00 The Frontier Theme** — `A wide frontier under low mist, scattered with
machines that someone built and abandoned. A three-note figure on solo flute,
answered by clarinet, over a walking pizzicato bass and a low drone that never
moves; muted horns far back, a distant anvil on the backbeat, long reverb
tails. 96 BPM, 4/4, dorian; the phrase ends unresolved on the dominant instead
of landing. Curious and slightly wary, an unanswered question, never
threatening and never sweet.`

**MK 09 The Works (Iron)** — the StarCraft-Terran corner, and the best test of
the whole direction: `A steampunk works running by itself in the half-dark —
cast-iron boilers, walking beams, brass flywheels. Reverbed tremolo electric
guitar and low muted brass trade a bluesy line over a walking upright bass;
percussion is the machinery itself, anvils and hydraulic knocks and metal
hits, spacious with a lot of room in the mix. 88 BPM, 4/4, dorian with a flat
seventh, grimy and confident. The one place on the frontier that sounds like
it is under control.`

Get these two right first. Everything else is a Cover of the theme.

Both are the tonal test: if they come back cheerful, the prompt is not carrying
*Tone* above and the mist words need to move to the front.

## Measured results — the v5.5 batch (2026-08-27)

15 v5.5 takes in `assets/bgm/`, measured with ffmpeg + a Goertzel chroma
analyser (`scratchpad/keyscan.ps1`). Mode is read from actual scale-degree
strength (flat vs natural third, sixth, seventh) relative to the detected
tonic, not from a major/minor guess.

| Track | Dur | Mode | Click band | LRA | Tail |
|---|---|---|---|---|---|
| mk00b-frontier-theme-snes-**a** | 0:49 | **A dorian** ✓brief | −14.4 | 3.1 | ok |
| mk00b-frontier-theme-snes-b | 1:50 | G mixolydian | −13.0 | 3.6 | ok |
| mk00-frontier-theme-orig-a | 2:14 | G aeolian | −16.3 | 4.1 | ok |
| mk01-basin-first-light-**a** | 0:43 | **G ionian** (conf 0.86, best in set) | −13.5 | 3.6 | ok |
| mk01-basin-first-light-b | 0:45 | B aeolian ✗ wrong for home | −14.3 | 3.3 | ok |
| mk05-quarry-hills-**a** | 2:46 | **C dorian** ✓brief | −13.8 | 2.9 | FADES |
| mk05-quarry-hills-b | 2:47 | C ionian | −11.4 | 5.4 | FADES |
| mk06-coal-bog-a | 1:42 | C dorian | −16.3 | 4.9 | FADES |
| mk06-coal-bog-**b** | 1:02 | **G aeolian** ✓brief (bog is the one place) | −14.8 | 4.1 | FADES |
| mk07-oil-flats-**a** | 1:09 | **D mixolydian** ✓brief | −17.8 | 6.9 | ok |
| mk07-oil-flats-b | 1:18 | A# mixolydian ✓brief | −17.0 | 6.1 | ok |
| mk08-snow-peaks-**a** | 2:12 | **G mixolydian** ✓brief | −13.8 | 5.2 | FADES |
| mk08-snow-peaks-b | 1:57 | G aeolian | −14.2 | 6.1 | FADES |
| mk09-the-works-iron-a | 1:52 | C aeolian ✗ darkest in set | −12.8 | 3.7 | ok |
| mk09-the-works-iron-**b** | 0:35 | **C dorian** (best available) | −11.3 | 1.8 | ok |

*Click band = 2–5 kHz RMS relative to overall RMS, in dB. More negative is
better — it is headroom for the key clicks. LRA = loudness range in LU.*

### What the numbers say

- **The minor-key worry is smaller than feared.** Six takes are mixolydian or
  ionian, four dorian, five aeolian. Two thirds sit at dorian or brighter, and
  three of the five aeolians are B-variants that simply do not get used.
- **Almost every track has a brighter take and a darker take.** That is the
  useful finding: the mode can be *chosen per place from what exists* rather
  than regenerated. The bolded row in each group is the pick.
- **The Works is the one real miss.** It is the reward-state track and it came
  back the darkest thing in the set (take a has the strongest flat third of
  any track, 0.185 against 0.045 natural). Per *Mode balance* it should be
  mixolydian; neither take is. **Regenerate it** — and because the SFX are
  key-locked, an aeolian works theme would make the payoff sound like a loss.
- **Duration is the actual problem.** Seven of fifteen are under 1:20, four
  under 0:50. At 0:43 the basin track repeats roughly 84 times an hour. Suno
  v5.5 defaults short; the fix is **Extend**, not acceptance.
- **The "no fade ending" instruction held about 60% of the time.** Six takes
  fade out, bog-b by 15.8 dB. Fades must be trimmed before the crossfade-loop
  can work.
- **Click-band headroom is good everywhere** — 11 to 18 dB below overall RMS.
  The two most percussive takes (works-b, quarry-b) crowd it most, exactly as
  expected from industrial percussion, and are still 11 dB down.
- **No track swells.** LRA 1.8–6.9 LU across the set; the steady-dynamics rule
  worked without exception.

## Round two — the mixolydian Works, and what Extend actually does (2026-08-28)

**The Works, regenerated.** Take **b is the fix**: `mk09b-works-mixolydian-b`,
1:10, **D# ionian/major** (natural third 0.131 against flat 0.028). Not
strictly mixolydian — it has a natural seventh where a flat one was asked for —
but it solves the real problem: the reward track is no longer minor, so the
key-locked SFX will resolve upward. **This is the new Works pick.**

Take a ignored the instruction completely and came back *more* minor than the
original (G aeolian, confidence 0.90). Which is the practical lesson:

> **Suno's mode adherence is roughly a coin flip, even with the mode in
> capitals and an explicit "NOT minor, no flat third anywhere".** Generate two,
> measure both, keep the one that landed. The chroma scan is the QA step, not a
> nicety — without it you cannot tell which take you got.

Confirmed across three attempts at a bright Works (six takes): aeolian, dorian
· aeolian, ionian · mixolydian, aeolian. **Two of six landed bright.** Budget
three attempts for any track whose mode actually matters, and measure every
one. Duration behaves the same way — a 3:00 request returned 1:27, 1:42, 2:06
and 2:59, so it is a strong hint, not a setting.

**Extend does not lengthen a track.** It returns only the *continuation
segment* (0:44 original → 0:47 and 0:32 continuations), and the merged track
requires a separate **"Get Full Song"** step on the extended clip. That merge
had not propagated to the CDN at time of writing, so the long basin track is
still pending.

**The better lever is `Duration: Custom`** — under *More Options*, next to
Weirdness and Style Influence, defaulted to Auto. It sets the target length at
generation time, producing one coherent long track instead of a chain needing
merges. **Use it for every future generation**; it is the actual fix for the
short-track problem and it was there the whole time.

Two cautions learned the hard way: the Remix menu is *Cover / Extend / Reuse
Prompt / Reverse / Adjust Speed* and mis-clicking one row down yields a
reversed track (`(Reversed)` in the workspace is that mistake, not a keeper);
and **the Instrumental toggle silently resets to "Write"** whenever the create
form clears, so re-check it before every generation.

## Mix note — SFX is too soft against weather (user, 2026-08-27)

Playtest observation: **the SFX read as soft, especially next to the weather
bed.** This contradicts the stated design in `js/audio.js`, whose header says
the weather bus is "quiet by construction" and that "weather is ducked by
typing, never the reverse" — so this is a mix bug, not a taste call. Three
candidates, in order of likelihood:

1. the typing duck on `wxDuck` is not firing, or its depth is too shallow;
2. the weather bus sits too hot relative to the sfx bus at rest;
3. the sfx bus is simply low and the click ladder needs gain.

Not fixed here — `js/audio.js` is owned by another session in flight. Flagging
only. It matters more than a normal mix nit: the click ladder at 1.6 and
5.2 kHz **is** the atomic reward of the game, and per *The dopamine loop*
above, anything that buries it is burying the dopamine.

## Superseded

The four tracks generated 2026-08-27 (`MK 01 Basin`, `MK 02 The Works`,
`MK 03 Crystal Canyon`, `MK 04 Coal Bog`, in the **Mechanical Keyboarding
BGM** Suno workspace, two v4.5 takes each) were made to the *first* brief and
are ambient by construction. `MK 02` is the nearest to the new direction and
may be worth hearing; the rest are a record of the wrong turn. Previous plan
kept at `docs/.bgm-plan.v1.bak`.
