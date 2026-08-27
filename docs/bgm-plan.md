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

## The set — 13 tracks

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

## Superseded

The four tracks generated 2026-08-27 (`MK 01 Basin`, `MK 02 The Works`,
`MK 03 Crystal Canyon`, `MK 04 Coal Bog`, in the **Mechanical Keyboarding
BGM** Suno workspace, two v4.5 takes each) were made to the *first* brief and
are ambient by construction. `MK 02` is the nearest to the new direction and
may be worth hearing; the rest are a record of the wrong turn. Previous plan
kept at `docs/.bgm-plan.v1.bak`.
