# Ember Company

A standalone, client-side pixel-art tactical RPG. Six heroes fight through an endless sequence of deterministic procedural battlefields across eight biomes, with varied routes, obstacles, crossings, and enemy formations. Between encounters, a camp offers rest, tonics, weapon upgrades, and level-gated promotions. No town exploration or story gates.

## Play locally

Open `index.html` directly in your browser. All scripts and assets are local. You can also serve this folder with a static server:

```sh
python3 -m http.server 8018 --bind 127.0.0.1
```

Open http://127.0.0.1:8018. No installation, compilation, backend, or API is required. The game uses HTML, CSS, JavaScript, Canvas, optional synthesized audio, and localStorage. Fonts have system fallbacks; gameplay requires no external resources. Scripts load in dependency order without ES modules, so file URLs do not require a build or server. Save availability on file URLs depends on browser storage policy.

## Controls and rules

- Units take individual turns in speed order, once per round. The current unit is outlined in gold.
- Click/tap a blue tile to move, then choose an attack or skill and select a highlighted target. You can act without moving. Movement can be undone before acting.
- Actions animate before the next unit acts. Use **Pace** above the battlefield to choose Deliberate (default), Standard, or Quick. Opening the field guide or hiding the tab pauses animations.
- Guard ends the turn, grants +3 armor until the unit's next turn, and restores 1 MP. Tonics restore 22 HP.
- Woods and high ground grant +2 defense and cost 2 movement; deep water and cliffs are impassable. Units block passage.
- Defeat every enemy to earn gold and XP. Fallen heroes return to at least half HP at camp. Rest restores everyone's HP and MP. Weapons support five upgrades. Level 3 unlocks promotion.
- Arrow keys move a tile cursor; Enter selects. M move, A attack, S skill, G guard, P tonic, U undo. Escape cancels targeting.
- Company stats, equipment, gold, supplies, and encounter number automatically save in this browser; reloading restarts the current encounter. Exact tactical positions are not persisted. Reloading restores both starting health and starting tonics, so a field restart cannot consume supplies permanently. Restart restores the start-of-encounter checkpoint. New expedition asks before replacing the save. Clearing browser storage removes progress.

## Files

- `engine.js`: deterministic combat, pathfinding, maps, AI, progression, camp economy.
- `art.js`: original procedural pixel tiles, sprites, projectiles, and spell effects.
- `animations.js`: pace settings, route interpolation, and the pause-aware visual clock.
- `app.js`: input, UI, save state, audio, dialogs, turn scheduling.
- `style.css`, `index.html`: responsive interface.
- `persistence.js`: validated company saves, legacy migration, and safe storage fallback.
- `tests.mjs`: combat, economy, map accessibility, and automated campaign checks.

Run `node tests.mjs` for the rules checks. This game is independent of the shared game-kit and does not modify its generated catalogs.

See [BUG_AUDIT.md](BUG_AUDIT.md) for the bug fixes, regression coverage, and verification limits.
