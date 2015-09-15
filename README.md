
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

* **cameraTarget**  - entity to track camera target position

* **setPaused (paused)**  - Pausing the engine will also stop render/tick events, etc.

* **getBlock (x,y,z)** 

* **setBlock (x,y,z)** 

* **addBlock (id,x,y,z)**  - Adds a block unless obstructed by entities 

* **getTargetBlock()**  - Returns location of currently targeted block

* **getTargetBlockAdjacent()**  - Returns location adjactent to target (e.g. for block placement)

* **getPlayerPosition()** 

* **getPlayerMesh()** 

* **getPlayerEyePosition()** 

* **getCameraVector()** 

<!-- End index.js -->

----

<!-- Start lib/entities.js -->

## noa.entities
Wrangles entities. 
Encapsulates an ECS. Exposes helpers for adding entities, components, 
and getting component data for entities. 

Expects entity definitions in a specific format - see source `components` folder for examples.

* **components**  - Collection of known components

* **createComponent (comp)**  - Creates a new component from a definiton object

* **deleteComponent (comp)** 

* **createEntity (compList)**  - Takes an array of components to add (per `addComponent`)

* **removeEntity (id)**  - deletes an entity, after removing all its components

* **addComponent (id, comp, state)**  - Add component to an entity. Optional `state` param can be only partially populated.

* **getDataList (comp)**  - Get array of state objects for all entities having a given component 

* **isPlayer (id)**  - test if entity is the player

* **getAABB (id)**  - get an entity's bounding box

* **getPosition (id)**  - get an entity's position (bottom center of aabb)

* **getPhysicsBody (id)**  - get reference to an entity's physics body

* **getMeshData (id)**  - returns `{mesh, offset}`

* **isTerrainBlocked (x,y,z)** 

* **add (position, width, height..)** 

  Helper to set up a general entity
  
    Parameters: position, width, height, mesh, meshOffset, doPhysics, shadow

* **remove()**  - Queues an entity to be removed next tick

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

* **setChunkData (id, array)**  - client should call this after creating a chunk's worth of data (as an ndarray) 

<!-- End lib/world.js -->

----

