# Saffron Vanguard

A standalone, client-side illustrated tactical RPG. Begin with Amira and Ayesha, then build a six-hero company through an endless sequence of deterministic procedural battlefields across eight biomes, with varied routes, obstacles, crossings, and enemy formations. Between encounters, a camp offers rest, tonics, weapon upgrades, and level-gated promotions. No town exploration or story gates.

## Play locally

Open `index.html` directly in your browser. All scripts and assets are local. You can also serve this folder with a static server:

```sh
python3 -m http.server 8018 --bind 127.0.0.1
```

Open http://127.0.0.1:8018. No installation, compilation, backend, or API is required. The game uses HTML, CSS, JavaScript, Canvas, optional synthesized audio, and localStorage. Fonts have system fallbacks; gameplay requires no external resources. Scripts load in dependency order without ES modules, so file URLs do not require a build or server. Save availability on file URLs depends on browser storage policy.

## Company progression and loot

New expeditions begin with Amira (vanguard) and Ayesha (mender) against two weaker enemies. More enemies, stronger stats, and later regents raise the difficulty as the encounter level increases.

| Recruit | Joins free after encounter | Early hire available after victories | Cost |
| --- | --- | --- | --- |
| Zuri, ranger | 2 | 1 | 80 G |
| Kwame, sentinel | 4 | 2 | 120 G |
| Arjun, arcanist | 6 | 3 | 160 G |
| Tariq, wayfarer | 8 | 4 | 200 G |

Recruits catch up to the company's level. Existing version 1/2 saves retain all their original heroes; start a new expedition manually to experience the smaller opening. The new WebGL edition has its own save slot and starts fresh.

Defeated enemies sometimes leave glowing chests. **Finish movement on the drop's tile** to collect it. Neem salves restore HP, lapis shards restore MP, sun embers add attack for that encounter, brass wards add defense for that encounter, and caravan tonics add a supply. Collecting a drop commits movement, so it cannot be undone for free pickups.

Rare special armaments and relics go into the armory. Equip one special weapon and one relic per hero at camp. They add bonuses on top of normal weapon upgrades. A unique item can belong to only one hero, and equipped items cannot be sold. The armory holds 64 items; excess rare drops are salvaged for gold. Unclaimed rare equipment is recovered after victory; unclaimed common supplies are salvaged for 8 G each. Battle pickups are secured in the persistent save on victory, preventing duplication through retries.

## Controls and rules

- Units take individual turns in speed order, once per round. The current unit is outlined in gold.
- Click/tap a blue tile to move, then choose an attack or skill and select a highlighted target. You can act without moving. Movement can be undone before acting.
- Actions animate before the next unit acts. Use **Pace** above the battlefield to choose Deliberate (default), Standard, or Quick. Opening the field guide or hiding the tab pauses animations.
- Guard ends the turn, grants +3 armor until the unit's next turn, and restores 1 MP. Tonics restore 22 HP.
- Woods and high ground grant +2 defense and cost 2 movement; deep water and cliffs are impassable. Units block passage.
- Defeat every enemy to earn gold and XP. Fallen heroes return to at least half HP at camp. Rest restores everyone's HP and MP. Weapons support five upgrades. Level 3 unlocks promotion.
- Arrow keys move a tile cursor; Enter selects. M move, A attack, S skill, G guard, P tonic, U undo. Escape cancels targeting.
- Company stats, equipment, gold, supplies, and encounter number automatically save in this browser; reloading restarts the current encounter. Exact tactical positions are not persisted. Reloading restores both starting health and starting tonics, so a field restart cannot consume supplies permanently. Restart restores the start-of-encounter checkpoint. New expedition asks before replacing the save. Clearing browser storage removes progress.

## Two local editions

- Illustrated 2D: this folder's `index.html`.
- WebGL 3D: `../ember-company-3d/index.html`, with smooth shaded terrain and rounded character models, camera rotation and zoom, and an independent save.

Both are client-side and self-contained. `node sync-3d.mjs` synchronizes local common gameplay/UI files into the 3D folder after source edits; it does not upload, deploy, or require a build step to play.

## Files

- `engine.js`: deterministic combat, pathfinding, maps, AI, progression, camp economy.
- `art.js`: procedural terrain, projectiles, and spell effects.
- `characters.js`: smooth 128 × 160 canvas miniatures with layered cloth, curved weapons, equipment details, and cached rendering.
- `animations.js`: pace settings, route interpolation, and the pause-aware visual clock.
- `app.js`: input, UI, save state, audio, dialogs, turn scheduling.
- `style.css`, `ui.css`, `world.css`, `index.html`: responsive interface.
- `persistence.js`: validated company saves, legacy migration, and safe storage fallback.
- `tests.mjs`: combat, economy, map accessibility, and automated campaign checks.

Run `node tests.mjs` for the rules checks. This game is independent of the shared game-kit and does not modify its generated catalogs.

See [BUG_AUDIT.md](BUG_AUDIT.md) for the bug fixes, regression coverage, and verification limits.

## The Amber Road

Saffron Vanguard takes place in a fictional trade-route world inspired by the Middle East, Africa, and South Asia: caravanserais, acacia savannahs, baobab groves, cedar highlands, and monsoon deltas. The roster is Amira, Kwame, Zuri, Arjun, Ayesha, and Tariq. Opponents include Dune Reavers, Acacia Archers, Cinder Adepts, Brass Guardians, and the Ash Regent. Brass, lapis, saffron cloth, woven rugs, curved blades, and original geometric motifs carry the theme into the artwork.

Legacy folder names, internal character IDs, item keys, and local save keys are intentionally stable. Existing saves load with the new display names and equipment labels.

## Illustrated graphics

Pixel rendering has been replaced throughout. The 2D board uses anti-aliased canvas paths, soft ground washes, curved shorelines, layered tree canopies, sandstone arches, and smooth character miniatures. Grid lines are optional and off by default; reachable tiles and target rings remain visible when relevant. Character movement and attack timing are unchanged. The interface has no portrait panel.

The WebGL edition uses rounded anatomical forms, tapered clothing and wraps, continuous curved blades, smooth normals, warm material shading, shadow mapping with nine-sample filtering, and animated water shading. Static scenery and character meshes stay cached on the GPU.

The camp illustration is stored in `assets/caravan-camp.png`. Its exact generation prompt and production notes are in [assets/ART_NOTES.md](assets/ART_NOTES.md). A code-drawn camp remains available if the image cannot load. All assets are bundled locally in both editions.
