
# noa-engine

An experimental voxel engine.

[Live demo of test app here!](http://andyhall.github.io/noa-testbed/)

### Usage

Under active development, best way to try it is to clone and hack on it:

```sh
(clone this repo)
cd noa
npm install
npm start       # runs /docs/hello-world
npm test        # runs /docs/test
```

Live versions of the test content: 
 * [hello-world example](http://andyhall.github.io/noa/hello-world/)
 * [test example](http://andyhall.github.io/noa/test/)

To build a new world app, use `noa` as a dependency:

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

### Status, contributing, etc.

This library attempts to be something you can build a voxel game on top of. 
It's not a fully-featured game engine; it just tries to manage the painful parts 
of using voxels (e.g. chunking, meshing), and certain things that are 
tightly coupled to voxel implementation (e.g. physics), 
and otherwise stay out of your way.

Contributions are welcome! But please open an issue before building any 
nontrivial new features. I want to keep this library lean if I can, 
so if your idea could be done as a separate module then that's probably what I'll suggest.

### Docs

The source is pretty fully commented. There is a partial API reference 
at the end of this file, but I haven't been able to find a good way of 
generating JSDocs that I can live with, so for now it's best to consult 
the source.

### Recent changes:

 * 0.22.0
   * Removed redundant `player` component - use `noa.playerEntity`
   * Changed `position` component internals, client code hopefully unaffected
   * Restructuring that hopefully wasn't breaking
 * 0.21.0
   * Support unloading/reloading new world data.  
     Sample implementation in the `docs/test` app (hit "O" to swap world data)
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

## Partial API reference:

<!-- Start index.js -->

## noa
Main engine object.  
Emits: *tick, beforeRender, afterRender, targetBlockChanged*

```js
var noaEngine = require('noa-engine')
var noa = noaEngine(opts)
```

* **playerEntity**  - Entity id for the player entity

* **playerBody**  - reference to player entity's physics body

* **setPaused (paused)**  - Pausing the engine will also stop render/tick events, etc.

* **getBlock (x,y,z)** 

* **setBlock (x,y,z)** 

* **addBlock (id,x,y,z)**  - Adds a block unless obstructed by entities 

* **getPlayerPosition()** 

* **getPlayerMesh()** 

* **setPlayerEyeOffset()** 

* **getPlayerEyePosition()** 

* **getCameraVector()** 

* **pick (pos, vec, dist)**  - Raycast through the world, returning a result object for any non-air block

<!-- End index.js -->

----

<!-- Start lib/entities.js -->

## noa.entities
Wrangles entities. 
This class is an instance of [ECS](https://github.com/andyhall/ent-comp), 
and as such implements the usual ECS methods.
It's also decorated with helpers and accessor functions for getting component existence/state.

Expects entity definitions in a specific format - see source `components` folder for examples.

* **names**  - Hash containing the component names of built-in components.

* **addComponentAgain (id,name,state)** 

* **isTerrainBlocked (x,y,z)** 

* **setEntitySize (x,y,z)** 

* **getEntitiesInAABB (box)** 

* **add (position, width, height..)** 

  Helper to set up a general entity, and populate with some common components depending on arguments.
  
  Parameters: position, width, height [, mesh, meshOffset, doPhysics, shadow]

<!-- End lib/entities.js -->

----

<!-- Start lib/world.js -->

## noa.world 
Emits:
 * worldDataNeeded  (id, ndarray, x, y, z)
 * chunkAdded (chunk)
 * chunkChanged (chunk)
 * chunkBeingRemoved (id, ndarray, userData)
Module for managing the world, and its chunks

* **getBlockID (x,y,z)** 

* **getBlockSolidity (x,y,z)** 

* **getBlockOpacity (x,y,z)** 

* **getBlockTransparency (x,y,z)** 

* **getBlockFluidity (x,y,z)** 

* **getBlockProperties (x,y,z)** 

* **getBlockObjectMesh (x,y,z)** 

* **setBlockID (x,y,z)** 

* **isBoxUnobstructed (x,y,z)** 

* **setChunkData (id, array, userData)** 

  client should call this after creating a chunk's worth of data (as an ndarray)  
  If userData is passed in it will be attached to the chunk

<!-- End lib/world.js -->

----

