
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

* **cameraTarget**  - entity to track camera target position

* **setPaused(paused)**  - Pausing the engine will also stop render/tick events, etc.

* **getBlock(x,y,z)** 

* **setBlock(x,y,z)** 

* **addBlock(id,x,y,z)** 

* **getTargetBlock()** 

* **getTargetBlockAdjacent()** 

* **getPlayerPosition()** 

* **getPlayerMesh()** 

* **getPlayerEyePosition()** 

* **getCameraVector()** 

<!-- End index.js -->

----

<!-- Start lib/world.js -->

## noa.world
Module for managing the world, and its chunks

* **getBlockID(x,y,z)** 

* **getBlockSolidity(x,y,z)** 

* **getBlockOpacity(x,y,z)** 

* **getBlockTransparency(x,y,z)** 

* **getBlockFluidity(x,y,z)** 

* **getBlockProperties(x,y,z)** 

* **setBlockID(x,y,z)** 

* **setChunkData(id, array)**  - client should call this after creating a chunk's worth of data (as an ndarray) 

<!-- End lib/world.js -->

----

