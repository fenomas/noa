
## Version history

This is a summary of new features and breaking changes in recent `noa` versions.

 * [0.30.0](#0290)
 * [0.29.0](#0290)
 * [0.28.0](#0280)
 * [0.27.0](#0270)
 * [0.26.0](#0260)
 * [0.25.0](#0250)
 * [0.24.0](#0240)
 * [0.23.0](#0230)
 * [0.22.0](#0220)
 * [0.21.0](#0210)
 * [0.20.0](#0200)
 * [0.16.0](#0160)


----

### 0.30.0

   * typescript
   * new `airJumps` option (defaults to `0`)


### 0.29.0

   * Maximum allowed voxel ID is now `65535`
   * New option `worldGenWhilePaused` added to `noa.world`. When true, the engine will keep doing world generation (requesting new chunks, disposing old ones, meshing, etc) even while paused.
   * New option `manuallyControlChunkLoading` added to `noa.world`. When set, the engine will not automatically add or remove chunks near the player. Instead, call `noa.world.manuallyLoadChunk` and `manuallyUnloadChunk` on the coordinates you need.
   * Voxel IDs are now stored internally as plain `Uint16Array` elements, rather packing IDs and bit flags together. Any clients that were accessing internal data arrays will probably need to be updated.
   * Fixed the `dt` parameter to `noa#render(dt)` events. Previously it could occasionally be wrong in such a way as to cause temporal aliasing when used for animations.     


### 0.28.0

   * Voxel data is no longer internally duplicated at chunk borders. This means:
     * World generation no longer necessarily needs to be deterministic. Previously, voxels on chunk borders would get tracked in several chunks, and if the data didn't match up it would cause rendering artifacts. This is no longer the case, each voxel is stored in only one place.
     * When each chunk gets meshed for the first time, it will have have some artifacts at edges where the neighboring chunk doesn't exist yet. Such chunks will later get re-meshed once all their neighbor chunks exist.
     * Set `noa.world.minNeighborsToMesh` (default `6`) to control how aggressively chunks first get meshed.
   * Can now swap between world data sets
     * Set `noa.worldName` to manage
     * Current worldName is now sent with `worldDataNeeded` events, so that 
       game client knows which worldgen data to provide
   * Removed leading `_` from several property names, since they're meant to be set by the client:
      * `noa.world.maxChunksPendingCreation` (max # of chunks to queue)
      * `noa.world.maxChunksPendingMeshing` (max # of chunks to queue)
      * `noa.world.maxProcessingPerTick` (time in ms)
      * `noa.world.maxProcessingPerRender` (time in ms)
   * Mostly rewrites `noa.world` internals (chunk create/update/dispose flow)


### 0.27.0

   * Engine now does *world origin rebasing*, to avoid precision bugs in large worlds
     * Entity positions are now handled internally relative to a local coordinate system, which is periodically rebased around the player entity
     * The following systems now internally use local coordinates:
       * rendering
       * physics
       * entity/entity collisions
       * raycasting
     * Pre-existing position properties and related APIs still work, but may be imprecise. Each such API now has a `_local` alternate
     * Engine option `originRebaseDistance` controls how often rebasing occurs
     * See [/doc/positions.md](positions.md) for more details


### 0.26.0

   * Engine now imports Babylon as a **peer dependency** 
     * Noa games must now declare their own dependency on `@babylon/core`
     * See [examples](https://github.com/andyhall/noa-examples) for sample code, weback config, etc.
   * Noa now exports Engine as an ES6 module. 
     * Clients using `require` will need to do `require('noa-engine').default`
   * Example worlds (`test` and `hello-world`) moved to a [separate repo](https://github.com/andyhall/noa-examples)
   * Internal modules all migrated to es6 import/export syntax
   * Moves several camera-related APIs from rendering to `noa.camera`
   * Removes several redundant properties/APIs (they throw depreceation messages when accessed)
   * Component systems now fire in a fixed order, see [components.md](components.md)
   * Changes order of various render logic - fixes temporal aliasing bugs
   * `noa#render` events now pass correct `dt` argument - see issue #53

### 0.25.0

   * Adds `debug` option: populates `window` with useful references, binds `Z` to BJS inspector
   * Now current with Babylon.js 4.0
   * Updates many dependencies, many small bug fixes.

### 0.24.0

   * Terrain materials can specify a renderMaterial (see `registry.registerMaterial()`)
   * Targeting and `noa.pick` can take a function for which block IDs to target - #36
   * `every` component is removed (client apps using this, please define it separately)

### 0.23.0

   * Now uses octrees for scene selection for all meshes, even moving ones
   * Option `useOctreesForDynamicMeshes` (default `true`) to disable previous
   * `noa.rendering.addDynamicMesh` changed to `addMeshToScene(mesh, isStatic)`
   * Entities can now be cylindrical w.r.t. `collideEntities` component
   * Adds pairwise entity collision handler `noa.entities.onPairwiseEntityCollision`

### 0.22.0

   * Large/complicated scenes should mesh and render much faster
   * Chunk terrain/object meshing now merges results. Block object meshes must be static!
   * Removed redundant `player` component - use `noa.playerEntity` property
   * Added `showFPS` option
   * Many internal changes that hopefully don't break compatibility

### 0.21.0

   * Support unloading/reloading new world data.  
     Sample implementation in the `docs/test` app (hit "O" to swap world data)
   * changes `noa.world#setChunkData` params: `id, array, userData`
   * changes `noa.world#chunkBeingRemoved` event params: `id, array, userData`

### 0.20.0

   * Near chunks get loaded and distant ones get unloaded faster and more sensibly
   * Greatly speeds up chunk init, meshing, and disposal (and fixes some new Chrome deopts)

### 0.19.0

   * Revise per-block callbacks:
     * `onLoad` when a block is created as part of a newly-loaded chunk  
     * `onUnload` - when the block goes away because its chunk was unloaded
     * `onSet` - when a block gets set to that particular id
     * `onUnset` - when a block that had that id gets set to something else
     * `onCustomMeshCreate` - when that block's custom mesh is instantiated (either due to load or set)

### 0.18.0

   * Simplifies block targeting. Instead of several accessor methods, now there's a persistent `noa.targetedBlock` with details on whatever block is currently targeted.
   * `noa` now emits `targetBlockChanged`
   * Built-in block highlighting can now be overridden or turned off with option `skipDefaultHighlighting`

### 0.17.0

   * Adds per-block callbacks: `onCreate`, `onDestroy`, `onCustomMeshCreate`

### 0.16.0

   * Simplifies block registration - now takes an options argument, and the same API is used for custom mesh blocks
   * Removes the idea of registration for meshes
