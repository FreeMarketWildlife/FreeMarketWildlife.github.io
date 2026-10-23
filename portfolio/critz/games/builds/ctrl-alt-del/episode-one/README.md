# Active drawn-cel migration · September 24, 2026

The approved cel-walk look is now the active art direction. Jane and Jessie use
the shared drawn action library in Episode I. [Animation studio](../drawn-art/review/) · [Migration details](../drawn-art/README.md).
Earlier complete builds are preserved under `archive/pre-drawn-2026-09-24/`.
World/NPC/vehicle/enemy replacement work remains; earlier notes below describe
the compatible prototype and must not override the new art standard.

---

# Episode I — playable campaign and desktop level workshop

**Enemy revision:** [Director-aligned security robots and gun drones](../mini-review/ENEMY-REVISION.md) updates all six native mini archetypes, weapon handling, muzzle origins, game/editor integration and review comparisons. Names and variant details remain proposals. This supersedes earlier statements below that enemy artwork is unchanged.

**Twelve editable maps cover all ten chapters of the supplied Episode I outline.**
Play the story, jump directly to a chapter, or open the same mission in the workshop.
This is a compact prototype campaign, with new dialogue and supporting art clearly
identified as proposals. Existing playable folders, approved hero/enemy art, the
Recyke kit and original backups remain unchanged.

From the workspace root, run `python3 -m http.server 8056 --bind 127.0.0.1`, then open:

- **Campaign:** <http://127.0.0.1:8056/episode-one/>
- **Workshop:** <http://127.0.0.1:8056/episode-one/?mode=edit&level=03a-secondary>
- [All chapter scene views](review/chapter-board.png)
- [New environment/equipment catalog](review/new-kit-catalog.png)
- [Desktop workshop capture](review/workshop-dpr1.png)

No install or build step is needed to play. Serve the **whole workspace**: approved
character art and the Recyke kit are referenced by stable relative paths.

## The playable campaign

| Chapter / map | Play and staging |
| --- | --- |
| 1 — Intro | Scripted paired street/alley walk, provisional banter, explicitly missing password slot, lock opening, entrance, skyline camera rise and title. |
| 2 — The Moral Code | Elevator descent, comfort dialogue, walk to the leader, exact supplied oath and two replies, practice console, jump route, safe training unit, shield pickup and exact welcome. |
| 3A — First Strike / Jessie | Two secondary cooling controls, several security encounters, optional high pickup route, cycling cooling leak, checkpoint and security head encounter. 70-second timer. |
| 3B — First Strike / Janey | Fight toward the module, security arrival and forced retreat, two locked doors and the one unlocked service door. The module cannot be recovered. 65-second timer. |
| 3C — First Strike / wrecking yard | Shared escape staging, machinery, pulsing hazards, upper salvage walk, repair checkpoint, cruiser departure, explosion cutaway and Skyview dialogue. 45-second timer. |
| 4 — Breaking news in sky view | Party conversation, guest/news broadcast, module-to-attack causal reveal, peaceful run over the terrace to Janey’s cruiser. |
| 5 — Reaching Out | Side-view rescue flight. Steer around drones and projectiles; fly through propaganda holograms to boost; collect a spread cannon and repair kits. |
| 6 — Untitled | Workstation/missile cutscene, stealth search patrols, crouch cover and upper maintenance walks, exposed-wall rendezvous, fixed fatal story outcome and Janey’s departure. Detection is a separate retry failure. |
| 7 — Ctrl Alt Del | Longer, denser regional-server flight with paired drone arrangements and its own boost/weapon route. |
| 8 — Aquire this! | Climbable perimeter fence, required rear bat strike, mixed ground/aerial encounters, optional elevated supplies, checkpoint and server-access console. |
| 9 — Server escape *(catalog label only)* | Upload starts the 75-second escape timer. Finite robot-gun ammunition, E-based scavenging, discard, fallback melee, cooling leaks, repair checkpoint and evacuation lock. |
| 10 — Never say Die | Rooftop panorama, provisional vow in Jessie’s memory, title and explicit pending final-credit/music placeholders. |

The ordinary-input simulation route takes about 3½ minutes with cinematic skips
and foreknowledge. The complete authored sequence-card durations add several
minutes; first-time exploration and retries add more. This is a short campaign
prototype, not a claim of final episode length or completed difficulty balancing.

## Controls and combat

| Action | Keyboard |
| --- | --- |
| Move / steer | A D or Left / Right; W S or Up / Down also steer flight |
| Jump / climb | W or Up; hold at the marked fence to climb |
| Ground crouch | Hold S or Down; combine with movement or fire |
| Fire | Space; Jessie releases three successive rounds per trigger burst |
| Strike / prototype bat | F; the perimeter guard requires a rear strike |
| Interact / take fallen robot gun | E; the nearby action is shown on screen |
| Pulse grenade | Q; two initial charges, four damage in a forward blast area with wall occlusion |
| Watch power | C; Janey doubles damage, Jessie stuns nearby enemies, for 30 seconds; four kills recharge |
| Discard finite weapon | G during the server escape |
| Pause / retry | Escape / R; separate toolbar buttons support checkpoint retry or full restart |
| Advance / skip cinematic | Enter / Tab; skipping applies required story/object states |

Movement preserves the Recyke mini profile: 90 px/s, acceleration 900, gravity 600,
jump speed 245, maximum fall speed 400, 10×30 standing and 10×16 crouch collision.
Crouch movement remains 25 px/s, with feet fixed and solid headroom checked. Art
remains 48×48 cells, 32px standing height, feet anchor (20,40). Standing/crouch fire
uses approved action frames and timings. Whole scenes zoom by integer device pixels.

New prototype tuning: four-kill watch recharge, two starting grenades, six-second
shield battery, 12-round stolen guns, flight speed 100/112, 1.7× hologram boost and
spread cannon. These values are documented proposals. Deep inventory/progression,
Jessie’s hoverboard, manual blocking, and final action-specific climb/death animation
are not implemented. Climbing uses the existing locomotion presentation with the
new fence behavior; Jessie’s story death uses a cutaway, not an invented approved
sprite pose. Melee remains available with empty ammunition to avoid a softlock.

## Editing a mission

1. Open **Level workshop**, choose a map, or click **Blank map**. A new map starts
   with safe ground, a player start and an exit, so it is immediately testable.
2. Search the asset library. Click an asset and click the canvas to stamp it, or
   drag it onto the canvas. Artwork keeps its native size. Gameplay objects are
   also available under **Gameplay objects**; their inspector exposes behavior.
3. Paint 24px terrain cells with **B**. Recyke terrain chooses its four-neighbor
   edges automatically; steel and pale stone repeat their native deck modules.
   A brush stroke is one undo operation. **X** erases painted terrain or a placed
   non-floor object. Select a large solid floor rectangle to resize/delete it.
4. Use **V** to select and drag. Shift adds selections; drag empty canvas for a
   selection box. Alt-drag duplicates. Arrow keys nudge one pixel; Shift nudges
   the snap distance. Ctrl/Cmd D duplicates; C/V copies and pastes; Z and Shift Z
   undo/redo. Copying related objects remaps internal flag/death references.
5. Pan with **H**, middle-drag or the wheel. Shift-wheel pans horizontally;
   Ctrl/Cmd-wheel or +/− changes whole-device-pixel zoom. **Frame start** finds
   the player. Snapping supports 1, 8 or 24 native pixels, aligned to the authored floor. Selecting art adopts its suggested grid; Paint selects the 24px terrain grid.
6. Layer checkboxes and locks affect the editing view. Layer order is saved in
   the document. Select multiple objects to group them. **Save assembly** stores
   a local, shallow template; placements expand to unique editable children with
   source/revision metadata. No hidden live link changes existing instances.
7. The **Object** tab edits collision rectangles, patrol endpoints, health,
   activation conditions, pickups, hazards, terminals, checkpoint markers,
   trigger volumes, fence height, door/exit requirements and sequence references.
   Geometry overlays distinguish solid, one-way and interaction areas. Machinery
   art itself does not cause damage: a separate hazard behavior does.
8. The **Mission** tab edits bounds, hero/start, next map, timer/start condition,
   objectives and flight route settings. Conditions are comma-separated flag IDs
   or `dead:object-id`; validation names missing producers. A terminal produces
   its authored flag. Sequences can also produce flags. This deliberately small
   condition vocabulary stays inspectable instead of accepting arbitrary scripts.
9. The **Scenes** tab edits ordered cinematic cards. Add dialogue, title, move,
   camera, flag, object-state, visibility, visual-spawn, flash or completion cards.
   Reorder them, edit durations and preview. Editing supplied-source dialogue
   marks that line provisional automatically. The original story file is unchanged.
10. **Playtest** compiles a fresh runtime. Right-click a location, then **Here**,
    to test from that position with fresh mission conditions. Starts in solids
    are rejected. Flight Here uses a route-distance start. **Return to editor**
    restores the exact draft, selection and camera; runtime health, bullets and
    collected objects never overwrite authored data.

Ground and flight share assets, placement, layers, conditions, cutscenes, export,
validation and playtest. Ground uses feet/colliders, gravity, support surfaces,
patrols and climbing. Flight uses route distance, vertical steering, cruiser hitbox,
drone waves, boosts and gun volumes. Each flight enemy/pickup has an editable X
position on that distance axis. The runtime checks crossings while boosting.

### Saving and recovery

- Campaign Continue saves include the current mission and its latest checkpoint
  recovery state. Retry after a reload returns to that checkpoint, including
  health and mission flags. Older version 1 saves without a checkpoint payload
  still resume their current state; their unsaved checkpoint history is unavailable.
- Changes autosave to IndexedDB after a short idle period. The latest 20 revisions
  per level are retained. **Recovery** restores one as an undoable edit, including
  after closing/reloading the page. A failed storage write leaves the draft in
  memory and displays an export warning. Another editing window’s autosave raises
  a conflict notice; it never replaces your open draft.
- **Export level** downloads a JSON snapshot. **Export campaign** downloads all
  current level documents and the campaign manifest. These are explicit downloads,
  not a claim that the browser overwrote source files on disk. Ctrl/Cmd S exports
  the level; Shift with that shortcut exports the campaign.
- **Open JSON** imports either form. Invalid drafts can retain missing asset IDs
  for repair; playtest is blocked by required-reference/geometry errors. Future
  schema versions are rejected without modifying the current draft.
- To apply a reviewed export to project files, use the optional disk bridge:

  ```sh
  cd episode-one
  node src/import-bundle.cjs /path/to/export.json
  node src/import-bundle.cjs /path/to/export.json --write
  ```

  The first command only validates. The second saves levels and keeps replaced
  files under `episode-one/recovery/import-<timestamp>/`. It never writes into
  approved art or original-backup folders. A campaign bundle also updates the
  manifest in its authored order, regardless of document-array order. Invalid
  campaign versions, entries and duplicate references are rejected before writes;
  individual exports retain the existing campaign order.

## Architecture and asset contract

- `levels/campaign.json` orders the chapters; twelve separate JSON files contain
  stable IDs, native positions, explicit geometry, objectives, sequences and links.
- `src/schema.js` validates references and native geometry, compiles collision and
  remaps copied internal identities. Schema version 1 is independent of asset
  revisions and runtime checkpoint version 1.
- `src/ground.js` is an **isolated adaptation** of the Recyke pure simulation.
  Original files remain unchanged. New hooks support stable enemy IDs, dormant
  encounters, finite ammo, Jessie bursts, runtime restoration and the rear strike.
  Legacy hardcoded gate/pickup/checkpoint completion is replaced by mission logic.
- `src/mission.js` owns disposable state, conditions, checkpoints, triggers,
  timers, stealth, ladders, equipment, cutscene execution and the new flight mode.
  Sequence order is deterministic. Pause/dialogue stop escape timers; valid exit
  interaction wins before same-tick expiry.
- `src/render.js` draws both editor and game from the same registry. Camera X/Y,
  native frames, layer order and collision overlays share one interpretation.
- `src/editor.js` owns selection/camera/locks/history/recovery independently of
  authored JSON. The browser host creates only one active simulation and clears
  held inputs on mode changes, blur and hidden-tab transitions.
- `assets/registry.json` references **47 existing Recyke mini assets**, **33 new
  native mini definitions**, and **8 unchanged approved actor sheets**. Each new
  definition has stable ID/revision, source recipe, native size/origin, sockets,
  selection/visible bounds, collision defaults, properties, layer, animation holds,
  tags, thumbnail and no-scale placement rules. PNG SHA-256 hashes are pinned.
  Sprite dimensions and explicit collision/interaction rectangles remain separate.
- New art recipes are in `src/build-assets.cjs`. Rebuilding art is deliberate.
  `src/build-levels.cjs` records the initial authored layouts; **do not run it over
  designer-edited levels unless resetting those files is intentional**.

## Review status and known limits

The story’s causal sequence, both First Strike roles, exact oath, fatal rescue
outcome, regional-server upload and final rooftop are implemented. Newly written
banter, father/news conversation, guidance and vow remain provisional. The password,
Moral Code emblem, album recording/lyrics/cues, source-exact album conversations,
chapter 6/9 titles and final credits remain unresolved. The symbol is not invented.
The security heads use the existing Bastion as a named prototype stand-in; new
leader/party/operative/cruiser artwork is review material, not an approval claim.

The editor is a useful prototype, not every later feature in the planning document:
no nested/live-updating prefabs, animation timeline scrubbing, slope/conveyor/moving
platform physics, general navigation mesh, multiplayer editing, desktop file-handle
persistence, deep inventory/progression or mobile authoring. Terrain is 24px cells
with four-neighbor Recyke edges; it has no diagonal material blending. Patrols are
horizontal authored intervals. Advanced JSON exposes the entire data model when a
field has no dedicated control. A level file references the shared workspace art;
it is not a standalone copy of those assets.

Fun/difficulty still needs human playtesting. The current route provides safe
opening instruction, optional supplies, readable telegraphs, short retries, two
flight variations and distinct story mechanics. Automated completion verifies
reachability and required outcomes; it does not prove that every encounter is fun.

## Verification

With Node 20+:

```sh
cd episode-one
npm install
# Or: corepack pnpm install --frozen-lockfile (pnpm-lock.yaml is included)
npm run test:all
# Or run individual groups:
npm test
npm run test:assets
npm run test:render
npm run test:build
npm run test:animation
# Browser checks create and close their own localhost server on a free port.
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run test:browser
```

Browser checks use a locally installed Chrome. On another OS, set `CHROME_PATH` to
its executable. Runtime code has no third-party dependency; dev dependencies are
only for raster generation/checks and browser automation.

[Core checks](review/core-checks.json) cover all documents, source fidelity,
checkpoint restoration, pause/timer boundaries, short combat systems, stealth,
copy remapping and protected source hashes. [Playthroughs](review/playthrough.json)
complete all twelve maps with ordinary movement/combat/interaction inputs, skipping
cutscene waits. [Browser checks](review/browser-checks.json) cover real keyboard
input, painting/undo, dialogue changes, export/open, recovery after reload,
playtest isolation, errors and DPR 1/2 backing-store and logical pointer alignment.
[Asset checks](review/asset-checks.json) verify PNG dimensions/hashes, binary alpha,
native palette, frame ranges/timing and approved actor-cell references.

The animation checks use the pinned dev dependencies in this package. `test:build`
rebuilds the compatibility-world recipes in a disposable directory and checks PNG
hashes plus registry preservation; it does not overwrite campaign art or maps.
`build:assets` preserves the current character registry and art-migration metadata.
Use `EP1_BASE_URL` to point browser checks at an explicitly chosen existing server.
The renderer profiles are available as `profile:render` (with `EP1_BASE_URL` set)
and `profile:background`; timings are local diagnostics, not refresh-rate guarantees.

World checks validate all twelve authored maps, asset files, checkpoint support,
exit interaction positions, campaign links and both directions across coplanar
collision seams. Serialization checks cover fresh-instance recovery and atomic
rejection; normal-input playthroughs also round-trip transient gameplay snapshots.
These checks do not establish difficulty balance or general pathfinding.
