# Ember Company bug audit

Audit date: October 31, 2026. Scope: local HTML/CSS/JavaScript game only. No source upload or deployment was performed during this audit.

## Folder correction

The entry point is now `ember-company/index.html`. The runtime files (`app.js`, `art.js`, `engine.js`, `persistence.js`, and `style.css`) are alongside it. The former `dist/` folder has been removed. Tests, npm start, and the README use this root layout.

## Confirmed issues and fixes

| Issue | Trigger / previous behavior | Correction |
| --- | --- | --- |
| Impassable terrain was a finite movement cost | A movement budget of 99 or more could cross cliffs or deep water. Earlier long-budget connectivity tests could therefore report false success. Ordinary heroes have much smaller movement budgets, but the underlying rule was wrong. | Pathfinding explicitly excludes blocked terrain regardless of movement budget. Independent flood-fill tests exclude water and cliffs without calling the game's pathfinder. |
| Enemy AI could become stuck near walls | Greedily minimizing Manhattan distance could leave an enemy waiting beside a long wall instead of walking away from the target to reach an opening. | Weighted reverse paths guide enemies toward reachable attack positions. A regression scenario requires an enemy to take an initial detour away from its target and eventually attack. |
| Malformed saves could break startup | Checking only the version, encounter number, and roster length allowed missing heroes, invalid stats, duplicate IDs, and other invalid data into combat and rendering. | A separate persistence module validates numeric bounds, roster identity, vitals, promotion state, and data size. It reconstructs display information from the canonical roster and ignores saved tactical objects and arbitrary display strings. Unreadable saves fail safely to a playable new campaign. |
| Tonic loss on reload | Reloading restored the company's starting HP while retaining the reduced tonic count from the interrupted fight. | Battle saves retain starting supplies alongside the starting roster. Mid-battle tonics become permanent expenditure when the encounter is won and camp is saved. |
| Retry depended on writable browser storage | With storage denied or full, restarting could rebuild the field using already-spent resources instead of restoring its beginning. | The current session retains an in-memory encounter checkpoint. Retry does not require localStorage. Saving failures are labeled as session-only play. |
| Incorrect targeting forecasts | Hover feedback showed normal attack damage even with a spell selected, and could show damage for targets outside legal range. | Target validation and effect preview share the actual resolution values, including upgraded healing, armor bypass, and remaining HP. Invalid targets have no damage forecast. |
| Invalid action names could resolve as skills | The action handler's fallback treated an unrecognized action as a skill after applying normal attack targeting rules. | The rules accept only explicit attack, skill, guard, and tonic actions, reject dead actors, and reject noninteger movement coordinates before mutation. |
| Full-health healing could waste MP and earn XP | Repeated Mend on an uninjured ally consumed mana and granted healing XP. | Full-health allies are not valid Mend targets. |
| Rest could waste gold | Rest remained available when every hero already had full HP and MP. | Both the camp control and rules reject unnecessary rest without charging gold. |
| Keyboard control depended on focus | Battlefield shortcuts were ignored whenever any button had focus. | Shortcuts remain available from command controls, while native Enter/Space button activation, text inputs, and browser modifier shortcuts retain normal behavior. Selecting a targeting command returns focus to the board. |
| Very large seeds lost numerical precision | Seed arithmetic accumulated values beyond safe integer precision during long expeditions. | Seed hashing and generator updates use bounded 32-bit arithmetic. Large encounter seeds retain deterministic variation. |
| Later warlords could be weaker than escorts | A fixed boss formula overwrote the normal scaled enemy stats, eventually falling behind regular enemies. | Boss bonuses apply on top of the encounter's scaled base stats. Checks cover warlords through encounter 200. |
| Paused enemy scheduling rewrote saves repeatedly | While a dialog paused enemy turns, the timer restarted rendering and saving every 650 ms. | A paused callback reschedules itself without redrawing or saving; hidden tabs also pause enemy processing. |

Additional feedback corrections: undo reports that movement was undone, the keyboard cursor follows the active unit, upgraded Mend strength appears in its descriptions, expired notices clear their accessible text, and an inline local favicon avoids a missing-file request.

## Verification completed

Run from this folder:

```sh
node tests.mjs
```

**36 checks passed after the animation update.** Coverage includes:

- Legal deployment and movement, blocked terrain, occupancy, and movement limits.
- Resource rejection without turn mutation, spell effects, armor and terrain bonuses, healing forecasts, guard duration, dead-unit initiative skipping, and once-per-round turns.
- Enemy pathfinding around a wall that requires moving away from the target.
- Camp costs, weapon caps, promotion eligibility, no-op rest, victory rewards, and revival.
- Progression-only save round-trips, starting-supply recovery, legacy save migration, exactly-once camp recovery, malformed data, and unavailable or full storage.
- Independent reachability and unique deployment checks across **2,000 procedural encounters**, plus repeated-biome variation and large-seed determinism.
- A deterministic simulated player completed **24 consecutive encounters**, including camp recovery and equipment investment, using the normal public rules.

Syntax checks passed for the four runtime JavaScript modules. The game was served directly from the project root in a fresh loopback-only browser preview. Manual checks verified root loading, keyboard movement, undo, command selection, guarding and turn advancement, encounter retry, pausing enemy processing with the field guide, and resuming after closing it. The browser reported no errors or warnings in the inspected console; the inspected desktop viewport had no horizontal overflow.

## Limits and intentional rules

- This is a focused audit, not proof that no bugs remain. Automated campaign success does not establish difficulty balance for every future encounter or human strategy.
- Browser checks used the available in-app browser. Safari, Firefox, mobile hardware, and browser-specific fullscreen/audio behavior were not exhaustively tested.
- Blocked/full storage behavior was exercised with test storage implementations; session retry was also reviewed in code. Private-browsing and quota behavior can vary by browser.
- Range is Manhattan distance. Ranged attacks do not require line of sight; cliffs block movement rather than ranged targeting. Units block movement, including friendly units.
- Exact battle positions are intentionally not saved. Reload restarts the current encounter with its starting roster and supplies. The legacy localStorage key is retained so existing valid saves can migrate.
- The later animation update converted runtime scripts to ordered classic scripts so `index.html` can also load directly from disk. No build, application server, database, or network API is required. Browser automation cannot open file URLs under its URL policy, so automated browser verification uses a loopback static preview.


## Animation update

Movement now traverses the actual weighted route one tile at a time. Enemy decision-making is split into a nonmutating plan and a single resolution step, allowing the same legal moves to be presented before attacks resolve. Each action has a wind-up, visible impact, and recovery interval. Damage and resource changes occur once at impact, and commands remain locked until the action settles. Presentation pauses in dialogs and hidden tabs, and restart/new-expedition controls are disabled during an active animation.

The Deliberate default uses 220 ms per tile, a 1.4 second attack, a 650 ms recovery hold, and an 850 ms enemy decision pause. Standard and Quick scale these durations. Sword slashes/lunges, arrows, magic bolts, fire bursts, healing, rally, and guard have distinct effects. Reduced-motion preferences remove walking bounce, lunges, and hit shake.

New automated checks cover route legality, interpolation without diagonal shortcuts, pause-aware time progression, pace settings, nonmutating enemy plans, action effect selection, and loading the dependencies as classic scripts. Browser checks verified animated walking, input locks, guarded actions, handoff to the next hero, and enemy walking without console errors. Direct file navigation is blocked by the browser automation policy, so disk loading was checked through classic-script execution and dependency ordering rather than a browser file-URL visit.
