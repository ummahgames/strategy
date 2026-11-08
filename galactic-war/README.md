# Galactic War

Client-side, single-player WebGL planet conquest. Open `index.html` or serve this directory with a static server. All scripts and assets are local; no installation, account, network game service or backend is required.

## Infinite levels and difficulty

Choose Easy, Medium, Hard or Expert and a positive level number. Level numbers use decimal strings and BigInt advancement, with no final level. Generation version 1 creates reproducible mirrored maps, equal opening opportunities and connected travel networks. Levels vary layout and board size rather than increasing enemy statistics without limit. Difficulty changes AI reaction intervals, reserves, attack commitment, reinforcement planning and defensive decisions. Expert also invests in production upgrades. Difficulty does not change production behind the player's back.

Victory enables Next level. Retry reconstructs the same starting board and rules. Highest unlocked levels are recorded separately per difficulty where browser storage is available. Any level can also be entered directly.

## Rules and controls

One game supports Classic Fleets, Flow Network, Build & Launch, Hybrid Command, Hyperlane Strategy and Economic Expansion presets. Customize automatic or queued production, manual or persistent deployment, open/range/hyperlane travel, immediate or sustained combat, planets, economies, information, objectives and capacities. Rule changes apply to the next match.

Select a friendly planet and then a destination, or drag between them. In hybrid play, tap launches a fleet and drag toggles a persistent route. Routes support reserves, new-production-only dispatch and waves. Circular reinforcement orders are rejected. Percentage or exact-count dispatch and multi-source commands are available. The keyboard-accessible selectors support commanding without dragging.

Colony, industrial, fortress, relay and capital planets have distinct roles. Upgrade production, construct ships, fortify planets, activate shields, research engines, or scan the map. Standard, fast, heavy and siege fleets have movement or combat differences. Optional features include asteroid losses, relay wormholes, fleet interception, redirection, shared energy, local energy with supply connectivity, hidden counts, exploration fog, survival and headquarters objectives, timed domination and conquest. Challenge setups provide frontier, capital defense and limited-force battles.

Save/load uses browser-local storage. Export/import supports portable JSON checkpoints; imports are validated before replacing the match. Graphics detail, reduced motion, saved setup preferences and fullscreen controls are provided. No telemetry or remote assets are used.

## Code verification

Run `node tests.cjs`. Coverage includes 480 generated maps across four difficulties, 216 rule combinations, large level IDs, deterministic generation, connectivity, production and queues, route sharing, combat, objectives, save validation, next-level/retry behavior, DOM wiring and rendering execution with a WebGL API double. This is code-based verification; it does not establish GPU shader compilation, physical-device performance, visual quality or human difficulty. No screen or browser access is used by the tests.

The implementation uses aggregate fleets and sustained per-troop attrition rather than independently positioned units. It provides the single-player mechanics listed above; the reference genre taxonomy includes additional concepts that are not included, such as moving planets, destructible bridges, heroes and rebellions.
