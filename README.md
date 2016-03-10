
# noa-engine

An experimental voxel game engine.

[Live demo of testbed here!](http://andyhall.github.io/noa-testbed/)

For content examples see the [hello-world app](https://github.com/andyhall/noa-hello-world)
or [testbed app](https://github.com/andyhall/noa-testbed).

----

## API reference:

<!-- Start index.js -->

## noa
Main engine object.  
Emits: *tick, beforeRender, afterRender*

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

* **getTargetBlock()**  - Returns value of currently targeted block (or null if none)

* **getTargetBlockPosition()**  - Returns location of currently targeted block

* **getTargetBlockAdjacent()**  - Returns location adjactent to target (e.g. for block placement)

* **getPlayerPosition()** 

* **getPlayerMesh()** 

* **getPlayerEyePosition()** 

* **getCameraVector()** 

* **pick (pos, vec, dist)**  - Determine which block if any is targeted and within range

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

* **isTerrainBlocked (x,y,z)** 

* **add (position, width, height..)** 

  Helper to set up a general entity, and populate with some common components depending on arguments.
  
  Parameters: position, width, height, mesh, meshOffset, doPhysics, shadow

<!-- End lib/entities.js -->

----

<!-- Start lib/world.js -->

## noa.world
Module for managing the world, and its chunks

* **getBlockID (x,y,z)** 

* **getBlockSolidity (x,y,z)** 

* **getBlockOpacity (x,y,z)** 

* **getBlockTransparency (x,y,z)** 

* **getBlockFluidity (x,y,z)** 

* **getBlockProperties (x,y,z)** 

* **setBlockID (x,y,z)** 

* **isBoxUnobstructed (x,y,z)** 

* **setChunkData (id, array)**  - client should call this after creating a chunk's worth of data (as an ndarray) 

<!-- End lib/world.js -->

----

