# Constellation Switchyard

Set rail switches and advance star trains one step at a time to their platforms.

Eight campaign levels plus a repeatable generated-level mode with no final level, undo for the 100 most recent gameplay steps, gentle retries, and portable progress codes. Open index.html directly, or host this folder unchanged on any static host. No install, build step, dependencies, tracking, accounts, or backend is required for players. All runtime assets are local.

## Generated play

Open Generated levels on the level menu, choose a positive level number and a challenge setting, then play one finite stage. Another level starts the next number only when you choose it. The same number and challenge reproduce the same board. Restart replays it; save codes preserve partial progress and the number, without changing campaign completion. Level numbers support up to 60 decimal digits. See [generated-level coverage](../../PROCEDURAL_LEVELS.md) for coverage and save-version details.

## Rules and controls

Set the junctions before advancing your star train.

The first switch chooses the left or right branch. The next two switches choose between the platforms on each branch. Advance one step at a time; switch before the train reaches a junction. Undo a wrong arrival.

Tap or click the labeled board and action controls. Tab and Enter/Space work throughout. Movement games display arrow controls; consult Help for keyboard shortcuts.

## Display and devices

Use the full-screen icon in the header to enter or exit fullscreen. A separate exit stays visible during fullscreen play. Browsers that do not allow native fullscreen use an expanded page view while keeping their browser bars. Desktop, tablet, and phone layouts support mouse, touch, and keyboard controls; rotate the device as you prefer.

## Saving

The Save code button exports a versioned code containing completed levels, current level, and a bounded state checkpoint. The URL hash updates after actions. Paste a code into the same game to resume. No local storage is used. Codes are checksummed and validated against per-game state schemas. Older replay codes continue using their original rules.

## Development

Canonical source lives in ../../game-kit/. Run node game-kit/build.cjs from the workspace root after changing it. This copies the browser files into each independent game folder. Run node game-kit/test.cjs for all game suites, including all 392 toolkit level solutions.
