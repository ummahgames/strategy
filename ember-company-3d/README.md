# Saffron Vanguard 3D

A separate, local WebGL edition of Saffron Vanguard. Open `index.html` directly, or run `npm start` and visit http://127.0.0.1:8021. No package installation, compilation, CDN, downloaded models, server API, or account is needed.

The battlefield uses actual WebGL triangle geometry: smooth lit terrain, rounded rock formations, sandstone arches, wooden bridges, organic trees, rounded humanoid character models with role-specific weapons, projectiles, spell particles, and loot chests. The portrait-free interface and illustrated unit icons are shared with the 2D edition. Use the controls at the bottom right to rotate the camera or zoom. Click a tile or unit to select it; the same arrow-key controls work from every camera angle.

New companies start with Amira and Ayesha. Zuri, Kwame, Arjun, and Tariq join after encounters 2, 4, 6, and 8, or can be hired earlier at camp. Drops include immediate healing, mana, temporary attack/defense buffs, tonics, special weapons, and relics. Finish movement on a drop to claim it. Equip rare gear at camp. Unclaimed rare gear is recovered after victory.

This edition uses the independent `ember-company-3d-v1` browser save. It does not replace the 2D edition's company. Reloading restarts the encounter with starting stats and supplies. Existing 2D saves retain their full party; use a new expedition there for the new two-hero opening.

A browser with WebGL and hardware or software acceleration is required. If WebGL is unavailable, the game shows an explanatory message and uses the illustrated 2D renderer when possible. Direct-file storage behavior depends on browser policy. Exact frame rate depends on hardware, browser, and scene complexity.

## Verification and maintenance

Run `node tests.mjs` here for projection, picking, dependency, source-parity, and save-isolation checks. Run `node tests.mjs` in `../ember-company` for campaign, recruitment, loot, equipment, persistence, and simulation checks. The source folders remain independent standalone games. Run `node sync-3d.mjs` in the illustrated 2D folder to synchronize common local source after future gameplay edits; `webgl.js`, `webgl.css`, and this README remain specific to 3D.

All work is local only. Do not publish or upload this project unless explicitly requested.

## The Amber Road

Saffron Vanguard takes place in a fictional trade-route world inspired by the Middle East, Africa, and South Asia: caravanserais, acacia savannahs, baobab groves, cedar highlands, and monsoon deltas. The roster is Amira, Kwame, Zuri, Arjun, Ayesha, and Tariq. Opponents include Dune Reavers, Acacia Archers, Cinder Adepts, Brass Guardians, and the Ash Regent. Brass, lapis, saffron cloth, woven rugs, curved blades, and original geometric motifs carry the theme into the artwork.

Legacy folder names, internal character IDs, item keys, and local save keys are intentionally stable. Existing saves load with the new display names and equipment labels.

## Smooth diorama rendering

The old block figures and tile columns have been replaced with rounded limbs, tapered coats and robes, sculpted head wraps, curved sabres, round metal shields, layered tree canopies, date-palm fronds, cedar boughs, sandstone arches, and brass caravan standards. Geometry uses smooth normals and warm directional lighting. A local 1024 × 1024 shadow map provides filtered cast shadows; water receives a subtle animated shader. Static scenery and character pose meshes stay in GPU buffers. The grid is off by default and can be enabled from the battlefield controls.

`assets/caravan-camp.png` is the bundled camp illustration. Its exact built-in image generation prompt is in [assets/ART_NOTES.md](assets/ART_NOTES.md). No portrait assets are used.
