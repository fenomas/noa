
# noa-engine

An experimental voxel engine.

Example games:
 * [Minecraft Classic](https://classic.minecraft.net/) - made by Mojang *(!!)*
 * [noa-testbed](https://andyhall.github.io/noa-testbed/) - It's an older demo sir, but it checks out. Outdated but colorful.
 * [test example](https://andyhall.github.io/noa/test/) - sample world implementing most of the engine's features ([source](/docs/test))
 * [hello-world example](https://andyhall.github.io/noa/hello-world/) - bare minimum world, suitable as a starting point to build something out of ([source](/docs/hello-world))


## Usage

Under active development, best way to try it is to clone and hack on the `develop` branch:

```sh
(clone this repo)
cd noa
npm install
git checkout develop   # latest code is in the develop branch
npm test               # run the demo world in /docs/test
```

The `start` and `test` scripts run the minimal demo projects locally, via `webpack` and `webpack-dev-server` (which will be installed as dev dependencies). The `build` script rebuilds static bundles for both demos.

To build a new world, use `noa` as a dependency:

```sh
npm install --save noa-engine
```

```js
var engine = require('noa-engine')
var noa = engine({
    inverseY: true,
    // see source or /docs/ examples for more options and usage
})
```

## Docs

See the [API reference](API.md) for an overview of engine classes and methods.
Docs are evolving though, some details are only documented in source comments.
Doc/usage PRs welcome!


## Status, contributing, etc.

This library is under active development. 
It sets out to manage only the painful parts of making a voxel game 
(e.g. chunking, meshing), and certain things that are 
tightly coupled to voxel implementation (physics, raycasting, collisions..), 
but otherwise stay out of your way.

Contributions are welcome! If you have a nontrivial new feature in mind, 
please open an issue first so we can discuss where it should go, 
whether it should be a plugin, etc.

> Please note I do all dev work on the `develop` branch; please send any PRs against that branch!

For code style/formatting, the repo includes config files for [eslint](https://eslint.org/) and [js-beautify](https://github.com/beautify-web/js-beautify), which are both dev dependencies. If you use VSCode for editing, here are the extensions I used to run them automatically: [beautify](https://marketplace.visualstudio.com/items?itemName=HookyQR.beautify), [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).


----

## Recent changes:

 * 0.26.0
   * Moves all camera-related APIs to `noa.camera`, removes several redundant APIs
   * Component systems now fire in a fixed order, see [components.md](components.md)
   * Fixes order of various render logic, to avoid temporal aliasing bugs
   * Can now pass in a `babylon.js` reference, doesn't need to be in global
   * Render events now pass correct `dt` argument - see issue #53
 * 0.25.0
   * Adds `debug` option: populates `window` with useful references, binds `Z` to BJS inspector
   * Now current with Babylon.js 4.0
   * Updates many dependencies, many small bug fixes.
 * 0.24.0
   * Terrain materials can specify a renderMaterial (see `registry.registerMaterial()`)
   * Targeting and `noa.pick` can take a function for which block IDs to target - #36
   * `every` component is removed (client apps using this, please define it separately)
 * 0.23.0
   * Now uses octrees for scene selection for all meshes, even moving ones
   * Option `useOctreesForDynamicMeshes` (default `true`) to disable previous
   * `noa.rendering.addDynamicMesh` changed to `addMeshToScene(mesh, isStatic)`
   * Entities can now be cylindrical w.r.t. `collideEntities` component
   * Adds pairwise entity collision handler `noa.entities.onPairwiseEntityCollision`
 * 0.22.0
   * Large/complicated scenes should mesh and render much faster
   * Chunk terrain/object meshing now merges results. Block object meshes must be static!
   * Removed redundant `player` component - use `noa.playerEntity` property
   * Added `showFPS` option
   * Many internal changes that hopefully don't break compatibility
 * 0.21.0
   * Support unloading/reloading new world data.  
     Sample implementation in the `docs/test` app (hit "O" to swap world data)
   * changes `noa.world#setChunkData` params: `id, array, userData`
   * changes `noa.world#chunkBeingRemoved` event params: `id, array, userData`
 * 0.20.0
   * Near chunks get loaded and distant ones get unloaded faster and more sensibly
   * Greatly speeds up chunk init, meshing, and disposal (and fixes some new Chrome deopts)
 * 0.19.0
   * Revise per-block callbacks:
     * `onLoad` when a block is created as part of a newly-loaded chunk  
     * `onUnload` - when the block goes away because its chunk was unloaded
     * `onSet` - when a block gets set to that particular id
     * `onUnset` - when a block that had that id gets set to something else
     * `onCustomMeshCreate` - when that block's custom mesh is instantiated (either due to load or set)
 * 0.18.0
   * Simplifies block targeting. Instead of several accessor methods, now there's a persistent `noa.targetedBlock` with details on whatever block is currently targeted.
   * `noa` now emits `targetBlockChanged`
   * Built-in block highlighting can now be overridden or turned off with option `skipDefaultHighlighting`
 * 0.17.0
   * Adds per-block callbacks: `onCreate`, `onDestroy`, `onCustomMeshCreate`
 * 0.16.0
   * Simplifies block registration - now takes an options argument, and the same API is used for custom mesh blocks
   * Removes the idea of registration for meshes

----

## Credits

Made by [@fenomas](https://twitter.com/fenomas), license is MIT.


