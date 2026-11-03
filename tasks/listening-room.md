# Listening Room — plan

A 3D room you can walk into at **theluckystrike.co.uk/listening-room**. It holds two working
turntables and a mixer, a shelf of my Discogs records, plants and lamps. The homepage
"What's on the turntable" carousel turns into a crate you can dig through: pull a record,
drop it on a deck, ride the crossfader.

**Lighting is the hero.** Every lamp is real: switch it, dim it, warm it, and see bounce
light change across the room.

## What this showcases

| Skill | How the room shows it |
|---|---|
| Design craft | Art direction, a believable space, physical-feeling interactions, Ink & Acid UI chrome |
| Technical depth | Blender → glTF pipeline, baked GI mixed live per lamp, Web Audio DJ engine |
| Taste & interests | My actual records, my listening, my room |
| AI as force multiplier | Claude drives Blender, writes the bake scripts and shaders, curates crates, and a **build log** documents every AI handoff (what I asked, what it got wrong, what I kept) |

## Decisions

| Area | Choice | Why |
|---|---|---|
| Hosting | Separate repo `markj81/listening-room` and Vercel project, proxied at `/listening-room` | Same pattern as Sample Explorer. Keeps the portfolio static |
| Stack | Vite + React Three Fiber + drei + `@react-three/postprocessing`, TypeScript | R3F turns scene objects into components (`<Deck>`, `<Lamp>`). Vite base path `/listening-room/` for the proxy |
| Renderer | three.js `WebGLRenderer` now; spike `WebGPURenderer` + TSL in Phase 5 | WebGL is safe on every device. WebGPU unlocks better GI later. The hero shader already proves WebGPU on the site |
| 3D authoring | Blender 4.x, one `.blend` source of truth, exported to glTF (Meshopt + KTX2 via `gltf-transform`) | Small files, GPU-compressed textures |
| Lighting | **Per-lamp baked lightmaps mixed at runtime**, plus a few real-time lights for moving objects (details below) | The only way to get path-traced realism *and* live lamp control in a browser |
| Audio source | Deezer 30s previews matched by **ISRC** (reuse Sample Explorer's `/api/preview`) | Spotify removed `preview_url` (Nov 2024) and its SDK audio can't feed Web Audio, so no mixer. Deezer MP3s can |
| Audio engine | Web Audio API + one AudioWorklet for scratching | Real EQ, pitch, crossfader and spectrum, all in the browser |
| Records | Discogs collection, fetched at **build time** into a JSON manifest + cover atlas | Avoids the 60 req/min limit and slow image hotlinking. Rebuild weekly in a cron job |
| Recently played | Existing `/api/spotify`, extended to return `isrc` and track list | Already deployed and cached |

## Lighting — the core of the project

### The problem
Real-time browser lights give direct light and hard shadows only. Realism comes from **indirect
light**: the warm glow a lamp throws on the ceiling, light bouncing off the rug into the shelf.
Baking that in Blender looks real but is frozen, and frozen breaks the lamp controls.

### The approach: light is additive, so bake each lamp separately
Analogy: a mixing desk for light. Each lamp is a channel. Blender records each channel on its
own track (one lightmap per lamp). In the browser, the dimmer is the fader and the final image
is the mix.

```
finalIndirect = Σ  lightmap[lamp] × colour(kelvin[lamp]) × dimmer[lamp]
```

1. Blender: every lamp in its own **light group**. A Python script (Claude-written) turns on
   one group at a time and bakes Cycles diffuse GI into a shared UV2 atlas, in white light, HDR.
2. Encode each bake as RGBM/KTX2. Budget: ~6 groups × 2048² atlas.
3. three.js: patch `MeshStandardMaterial` (`onBeforeCompile`) to sum the lightmaps with
   per-lamp uniforms. One draw call, no extra lights.
4. Add real-time direct light on top for things that move (vinyl, tonearm, records you pull):
   2–3 shadow-casting spotlights, plus contact shadows.

Tinting a white bake is an approximation, but bounce colour from walls and rug is still
baked in, so it reads correctly.

### Lamp inventory

| Lamp | Light type | Signature detail |
|---|---|---|
| Anglepoise desk lamp over the decks | Spot + IES profile | Poseable head, so the real-time spot follows it |
| Arc floor lamp by the sofa | Spot, linen-shade diffuser | Warm pool on the rug |
| Ceiling pendant | Point + bake | Dimmer on the wall switch |
| Window daylight | Sun + sky HDRI | **Time-of-day slider**. Venetian blinds cast slatted light (gobo shadows) |
| LED strip behind the record shelf | Rect area light | RGB, can pulse to the music |
| Neon sign (wording TBD) | Emissive + rect area | Flickers on at power-up |
| Turntable target lights | Small spot, emissive | Pop up when a deck is powered |
| Amp VU meters | Emissive | Needles driven by the audio analyser |

### Realism details (the 10% that sells it)
- **Physical units**: lumens/lux in Blender carried over, AgX tone mapping, eye-adaptation exposure
- **Dim-to-warm**: incandescent bulbs get redder as they dim (2700K → 1900K). Most 3D demos miss this
- **Bulb warm-up/cool-down**: filaments take ~150ms to glow and fade, no instant snapping
- Bloom only on emissive bulbs, GTAO/SSAO for contact grounding
- Box-projected reflection probe so the glossy floor, vinyl and chrome reflect the actual room
- Dust motes in the window beam, faint volumetric light shaft
- Depth of field focus-pull when you pick up a record
- Film grain tied to the hero shader's look

### Controls
- **In-world**: click a lamp or wall switch to toggle it, drag up/down to dim
- **Light panel** (`L`): per-lamp dimmer, Kelvin slider (1800–6500K), RGB for the LED strip
- **Scenes**: `Sunday morning` (daylight, plants glowing), `Golden hour`, `Late night session`
  (Anglepoise + neon), `Party` (LED strip and target lights pulse to the beat)
- Scene changes cross-fade every light over ~1.5s

## Audio — making the decks real

```
Deck A: preview MP3 → playbackRate (pitch ±8%) → 3-band EQ → channel fader ┐
                                                                            ├→ crossfader (equal power) → master → analyser → speakers
Deck B: preview MP3 → playbackRate (pitch ±8%) → 3-band EQ → channel fader ┘
```

- Platter spins at 33⅓ rpm × playbackRate, so the visuals match the sound
- **Needle drop**: click on the record surface; groove radius maps to position in the 30s clip
- **Scratching**: drag the record. An AudioWorklet plays the buffer forwards and backwards at drag speed
- Start/stop with motor spin-up and brake (real decks take ~0.7s to reach speed)
- Analyser drives the VU meters, the LED strip and Party mode
- Honest limit: 30s previews. A loop toggle and a clear "preview" label on the record cover it

## Records — Discogs shelf

- Build script: `GET /users/{me}/collection/folders/0/releases` → `records.json`
  (title, artist, year, label, genres, styles, dominant colour, tracklist)
- Covers downloaded, resized to 256², packed into a **texture atlas** (KTX2). The shelf is one
  instanced mesh with ~300 sleeves in one draw call
- Each reload: seeded shuffle; the seed appears in the URL (`?crate=8f2a`) so a view can be shared
- Pull a sleeve out → it slides forward and flips → pick a track → place on a deck → plays its
  Deezer preview (matched by artist + title, ISRC when available)
- Attribution "Data provided by Discogs" in the UI, as their API terms require

### Featured-crate hotkeys

| Key | Crate |
|---|---|
| `0` | Random shuffle (default) |
| `1` | Recently played (Spotify), front and centre |
| `2` | **Rainbow shelf**, sorted by cover hue (best visual moment) |
| `3` | By decade, oldest left to newest right |
| `4` | Genre crates (jazz, soul, house…) with dividers |
| `5` | "Desert island" hand-picked ten, lit by a spotlight |
| `/` | AI crate digger (Phase 5) |

## The room — object list

| Zone | Objects |
|---|---|
| DJ station | 2 direct-drive turntables (original design, no brand marks), 2-channel mixer, slipmats, headphones, Anglepoise |
| Records | Cube shelving unit, floor crate, "now playing" sleeve stand |
| Sound | Amp with VU meters, bookshelf speakers on stands, visible cables |
| Lounge | Sofa or armchair, rug, side table with coffee mug, arc floor lamp |
| Plants | Monstera, snake plant, trailing pothos off the shelf, fiddle-leaf fig by the window |
| Walls | Window with blinds, framed prints, neon sign, ceiling pendant |

Sourcing: model the hero pieces (decks, mixer, shelf, lamps) myself in Blender. Use CC0 assets
(Poly Haven) for textures, HDRIs and filler props. Generate plants with Blender geometry nodes.

### Blender conventions (so code wires itself up)
- `INT_` prefix = interactive. `INT_deckA_platter`, `INT_deckA_tonearm`, `INT_mixer_xfader`
- `LAMP_` prefix = controllable light; its light group shares the name (`LAMP_anglepoise`)
- `UV2` = lightmap UVs on every static mesh; no overlaps, 4px padding
- A loader reads these names and attaches behaviours. Rename in Blender and it still works

## AI as force multiplier — where Claude does the work

| Task | How |
|---|---|
| Blender modelling | Blender MCP server: Claude writes and runs `bpy` to block out the room, place props, set up light groups |
| Bake pipeline | Claude-written script: loop light groups → bake → encode → `gltf-transform` optimise |
| Shaders | Lightmap-mixing GLSL, dim-to-warm curve, blackbody Kelvin → RGB |
| Audio engine | Web Audio graph and the scratch AudioWorklet |
| Data | Discogs/Spotify scripts, colour extraction, ISRC matching |
| **AI crate digger** | Type "something for a rainy Sunday": Claude (tool use over `records.json`) picks 5 records, pulls them from the shelf, writes a one-line liner note for each |
| **Build log** | `/listening-room/log`: one entry per milestone, prompt → output → my edit. This is the portfolio piece about *how* I work |

## Phases

### Phase 0 — Spikes (one day each; do before building anything)
- [ ] **Lighting**: a box room with 2 lamps in Blender, bake per lamp, mix in three.js with
      live dimmers. Go/no-go: does it look better than real-time lights, at 60fps on a laptop?
- [ ] **Audio**: run 20 recently played tracks through ISRC → Deezer. Target match rate ≥ 85%
- [ ] **Discogs**: fetch the collection, build the atlas, check file size (target < 4 MB)

### Phase 1 — Blockout room, live
- [ ] Scaffold Vite + R3F with `/listening-room/` base path, deploy, add portfolio rewrites
- [ ] Greybox room in Blender, first-person + orbit camera, click-to-focus on zones
- [ ] glTF loader with the `INT_`/`LAMP_` naming convention

### Phase 2 — Decks & mixer
- [ ] Model turntables and mixer
- [ ] Web Audio engine: load, play, pitch, EQ, faders, crossfader
- [ ] Load recently played onto a deck; platter, tonearm and needle drop

### Phase 3 — Lighting (the big one)
- [ ] Final lamp models and light groups, full bake pipeline script
- [ ] Lightmap mixing shader, light panel, scenes, dim-to-warm, warm-up
- [ ] Time-of-day window light with blinds; reflection probe; post-processing pass

### Phase 4 — Records & dressing
- [ ] Discogs build script, instanced shelf, pull-and-play interaction
- [ ] Featured-crate hotkeys with animated re-shelving
- [ ] Plants, sofa, rug, props; final materials

### Phase 5 — Polish & AI
- [ ] Scratching worklet, Party mode, VU meters
- [ ] AI crate digger
- [ ] Build log page, OG image, homepage link ("Step into the room →" under the carousel)
- [ ] Performance pass, mobile tier, WebGPU spike

## Budgets
- First load < 15 MB (room glTF + lightmaps + atlas), interactive in < 4s on broadband
- < 150k triangles, < 80 draw calls, 60fps on an M1 laptop, 30fps on a recent phone
- Mobile tier: half-res lightmaps, no SSAO, fewer lamps baked together

## Accessibility & fallbacks
- Keyboard controls for everything (Tab cycles interactive objects), visible focus outline in 3D
- `prefers-reduced-motion`: no camera glides, no flicker
- No WebGL: a static path-traced render of the room with the crate as a plain list

## Open questions
- Discogs username (and is the collection public?)
- Blender: how much do I model myself vs. let Claude drive via Blender MCP?
- Neon sign wording
- Desert-island ten: which records?
- Desktop-first, or must the first release work on phones?

## Risks
- **Lightmap memory**: 6 HDR atlases is the biggest cost. Fallback: merge rarely-used lamps into one group
- **UV2 quality**: bad lightmap UVs cause seams and leaks. Fix early in the Phase 0 spike
- **Preview coverage**: some records won't have a Deezer preview. Show "no preview" on the sleeve, still let it go on the deck
- **Scope**: the room can grow forever. Phases 0–3 alone are a strong piece; ship that first

## Review
_(fill in after build)_
