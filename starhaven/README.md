# Starhaven

A complete client-side, real-time zero-gravity biodome game inspired by Insaniquarium. Original Canvas artwork, synthesized audio, no runtime dependencies, no backend, and no network requests.

## Play

Open `index.html` directly, serve this folder with `python3 -m http.server 8000`, or run the workspace preview (`python3 ummahgames.github.io/scripts/preview.py`) and visit `/strategy/starhaven/`.

Click empty habitat space to feed. Click or sweep across treasures to collect. Hold an invader to fire. Purchase three beacon components to finish a campaign mission. Pause, Guide, Flight deck, crew selection, inspection, and upgrades are available from the interface. The game pauses while dialogs are open and when its tab is hidden.

Keyboard: focus the habitat and use arrows + Enter/Space to aim and interact. C collects; F feeds the hungriest basic-food creature; X fires at a threat; P pauses. All interface buttons support Tab/Enter. Sound is optional and defaults off. Reduced motion and full-screen controls are provided. Phones and tablets use the same pointer controls.

## Included

- 21 campaign missions across four sectors and a final Ark encounter. The finale requires both three components and defeating the flagship.
- Six species, juvenile/adult/radiant growth, hunger, autonomous food seeking, and linked resource chains.
- Amoebas eat star-matter and produce minerals plus solar motes when mature. Jellyfish consume solar motes and produce crystals. Polyps eat star-matter and make plankton. Whales eat plankton and produce dark matter. Rays refine minerals into alloy. Leviathans turn crystals into singularity cores.
- Pirates, parasites, asteroids, hull leeches, and a pirate flagship. Upgradeable cannons, hull repairs, and one emergency rescue per mission.
- Eight unlockable companions, up to three active slots, and research-funded enhancements. Enhancements apply next expedition.
- Time Run (five-minute income challenge), Escalation (rising prices), and persistent peaceful Sanctuary.
- Completion records and medals for no creature losses, strong hull, and fast finishes.
- Local device saves and validated JSON save export/import. Campaign progression, crew, enhancements, settings, and Sanctuary residents persist. Active campaign missions restart on reload. Sanctuary upgrades reset when re-entered; resident growth and credits persist. Nothing happens while away.
- Original procedural vector creatures and backgrounds; no downloaded images, external fonts, or audio files.

## Code and checks

`data.js` defines balancing and content. `engine.js` is a pure simulation shared by browser and Node tests. `renderer.js` draws the world. `app.js` handles UI, pointer/keyboard controls, saves, and sound. `styles.css` handles desktop, mobile, and landscape layouts. This standalone game is not overwritten by the toolkit build.

Run `node --test strategy/starhaven/tests/engine.test.cjs` from the workspace root. The suite covers every food chain, combat, upgrades, save validation, companions, recovery, mode rules, and actual simulated paid-care completion of all 21 missions. `node game-kit/test.cjs` includes this suite automatically.

`tests/browser.html` runs isolated interface smoke checks in an iframe. Run in a clean browser profile; the fixture intentionally imports synthetic campaign progress in its own origin. It tests actual menus, pointer feeding, crew enhancements, save import/export, mode switching, and numeric layout bounds at desktop and phone sizes. It never inspects the user's screen or captures images. Browser checks supplement human playtesting; visual polish and difficulty should be assessed in play.
