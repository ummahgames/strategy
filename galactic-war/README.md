# Galactic War

Client-side, single-player WebGL planet conquest. Open `index.html` or serve this directory with a static server. All scripts and assets are local; no installation, account, network game service or backend is required.

## Infinite levels and difficulty

Choose Easy, Medium, Hard or Expert and a positive level number. Level numbers use decimal strings and BigInt advancement, with no final level. Generation version 3 creates reproducible, spread-out mirrored maps and connected travel networks. Level codes from earlier versions still open their numbered levels, which use the updated layouts. Levels vary layout and board size rather than increasing enemy statistics without limit. Difficulty changes AI reaction intervals, reserves, attack commitment, reinforcement planning and defensive decisions. Expert also invests in production upgrades. Easy makes at most one decision about every 60 seconds, choosing a reachable target mostly at random with an occasional simple preference for weak or nearby planets. Medium makes at most one decision about every 12 seconds and prefers weak, nearby targets. On these two difficulties, the opponent sends one fleet per decision even in Flow Network. Hard decides about every 2 seconds with up to 3 orders; Expert decides about every 0.8 seconds with no fixed order limit. Early guided levels provide additional time before the AI starts, especially on lower difficulties. In a standard start, the enemy begins with 20, 28, 35 or 40 ships on Easy through Expert, respectively, and produces ships at 55%, 75%, 90% or 100% of the normal rate. The player starts with 40 ships. Custom scenario starting fleets are scaled by the same difficulty factors.

Victory enables Next level. Retry reconstructs the same starting board and rules. Highest unlocked levels are recorded separately per difficulty where browser storage is available. Any level can also be entered directly.

## Rules and controls

Choose the Classic Fleets or Flow Network preset. Customize production, open/range/hyperlane travel, immediate or sustained combat, planets, economies, information and capacities. Every match uses total conquest, including challenge setups. Rule changes apply to the next match.

Click a friendly planet to select it; click another friendly planet to switch sources without sending ships. Click the selected planet, click empty space, or press Escape to deselect. Drag from a source to a destination to send. To reinforce by tapping, enable Choose reinforcement target and then tap the destination. Enemy or neutral clicks issue orders when a friendly source is selected. In Flow Network, dragging from a friendly planet to a destination creates a visible persistent arrow. Drag the same route again to remove it. A dashed arrow appears while dragging. Ships above the selected reserve launch automatically, and the command panel shows whether the route is dispatching or waiting. Routes support reserves, new-production-only dispatch and waves. Circular reinforcement orders are rejected. Percentage or exact-count dispatch and multi-source commands are available. The keyboard-accessible selectors support commanding without dragging.

Colony, industrial, fortress, relay and capital planets have distinct roles. Upgrade production, construct ships, fortify planets, activate shields, research engines, or scan the map. Standard, fast, heavy and siege fleets have movement or combat differences. Opposing fleets that collide during travel cancel ship for ship; friendly fleets pass through each other. Optional features include asteroid losses, relay wormholes, redirection, shared energy, local energy with supply connectivity, hidden counts and exploration fog. Instant travel has no transit in which fleets can collide. Challenge setups provide frontier, fortified-start and limited-force battles.

Use the level code to record or share the level number, difficulty, preset and guided/custom choice. Paste the code into setup to start that level fresh; in-progress armies, routes and custom rule selections are not included. Graphics detail, reduced motion and fullscreen controls are provided. No telemetry or remote assets are used.

## Code verification

Run `node tests.cjs`. Coverage includes 480 generated maps across four difficulties, 144 rule combinations, large level IDs, deterministic generation, connectivity, production and queues, route sharing, mid-flight collisions, combat, difficulty handicaps, objectives, level code validation, next-level/retry behavior, DOM wiring and rendering execution with a WebGL API double. This is code-based verification; it does not establish GPU shader compilation, physical-device performance, visual quality or human difficulty. No screen or browser access is used by the tests.

The implementation uses aggregate fleets and sustained per-troop attrition rather than independently positioned units. It provides the single-player mechanics listed above; the reference genre taxonomy includes additional concepts that are not included, such as moving planets, destructible bridges, heroes and rebellions.


## Guided learning and visual identities

Guided campaign is the default. Levels 1–3 contain colonies only, starting with 6, 8 and 10 planets. Production upgrades unlock at 3, industrial planets at 4, fortresses and siege selection at 6, shields at 7, relays at 8 and research at 9. Fleet tools and group commands become available later. Early AI command delays give players time to learn, while the selected difficulty still controls decision behavior. Custom setup exposes all mechanics and keeps selected rules. Guided mode explicitly uses simple conquest rules; advanced economy and movement choices apply in Custom mode.

Ordinary planets use globe symbols, industrial planets hexagonal factory symbols, fortresses square bastions, relays tilted orbital rings and capitals crowns. Ownership still uses faction color, so type and faction can be identified independently. Map labels show symbols and counts; the legend and accessible SVG names explain the types. Planet size and hit areas adapt to spacing to reduce ambiguous selection on compact boards.
