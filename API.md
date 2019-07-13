## 

<table>
  <thead>
    <tr>
      <th>Global</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td><a href="#Noa">Noa</a></td>
    <td><p>Root class of the noa engine</p>
<p>Extends: <code>EventEmitter</code></p>
</td>
    </tr>
<tr>
    <td><a href="#CameraController">CameraController</a></td>
    <td><p>Manages the camera,
exposes settings for mouse sensitivity.</p>
</td>
    </tr>
<tr>
    <td><a href="#Container">Container</a></td>
    <td><p>Wraps <code>game-shell</code> module 
and manages HTML container, canvas, etc.</p>
</td>
    </tr>
<tr>
    <td><a href="#Entities">Entities</a></td>
    <td><p>Wrangles entities. Aliased as <code>noa.ents</code>.</p>
<p>This class is an instance of <a href="https://github.com/andyhall/ent-comp">ECS</a>, 
and as such implements the usual ECS methods.
It&#39;s also decorated with helpers and accessor functions for getting component existence/state.</p>
<p>Expects entity definitions in a specific format - see source <code>components</code> folder for examples.</p>
</td>
    </tr>
<tr>
    <td><a href="#Inputs">Inputs</a></td>
    <td><p>Abstracts key/mouse input. 
For docs see <a href="https://github.com/andyhall/game-inputs">andyhall/game-inputs</a></p>
</td>
    </tr>
<tr>
    <td><a href="#Physics">Physics</a></td>
    <td><p>Wrapper module for the 
<a href="https://github.com/andyhall/voxel-physics-engine">physics engine</a></p>
</td>
    </tr>
<tr>
    <td><a href="#Registry">Registry</a></td>
    <td><p>for registering block types, materials &amp; properties</p>
</td>
    </tr>
<tr>
    <td><a href="#Rendering">Rendering</a></td>
    <td><p>Manages all rendering.</p>
</td>
    </tr>
<tr>
    <td><a href="#World">World</a></td>
    <td><p>Manages the world and its chunks</p>
<p>Extends <code>EventEmitter</code></p>
</td>
    </tr>
</tbody>
</table>

<a name="Noa"></a>

## Noa
Root class of the noa engine

Extends: `EventEmitter`

**Emits**:  
- `tick(dt)`
- `beforeRender(dt)`
- `afterRender(dt)`
- `targetBlockChanged(blockDesc)`

* [Noa](#Noa)
    * [new Engine()](#new_Noa_new)
    * [.version](#Noa+version)
    * [.container](#Noa+container) : [<code>Container</code>](#Container)
    * [.inputs](#Noa+inputs) : [<code>Inputs</code>](#Inputs)
    * [.registry](#Noa+registry) : [<code>Registry</code>](#Registry)
    * [.world](#Noa+world) : [<code>World</code>](#World)
    * [.rendering](#Noa+rendering) : [<code>Rendering</code>](#Rendering)
    * [.entities](#Noa+entities) : [<code>Entities</code>](#Entities)
    * [.physics](#Noa+physics) : [<code>Physics</code>](#Physics)
    * [.cameraControls](#Noa+cameraControls) : [<code>CameraController</code>](#CameraController)
    * [.playerEntity](#Noa+playerEntity)
    * [.playerBody](#Noa+playerBody)
    * [.blockTargetIdCheck](#Noa+blockTargetIdCheck)
    * [.targetedBlock](#Noa+targetedBlock)
    * [.setPaused(paused)](#Noa+setPaused)
    * [.getBlock(x,y,z)](#Noa+getBlock)
    * [.setBlock(x,y,z)](#Noa+setBlock)
    * [.addBlock(id,x,y,z)](#Noa+addBlock)
    * [.getPlayerPosition()](#Noa+getPlayerPosition)
    * [.getPlayerMesh()](#Noa+getPlayerMesh)
    * [.setPlayerEyeOffset()](#Noa+setPlayerEyeOffset)
    * [.getPlayerEyePosition()](#Noa+getPlayerEyePosition)
    * [.getCameraVector()](#Noa+getCameraVector)
    * [.pick(pos, vec, dist)](#Noa+pick)


----

<a name="new_Noa_new"></a>

## new Engine()
Main engine object.
Takes a big options object full of flags and settings as a parameter.

```js
var opts = {
    debug: false,
    silent: false,
    playerHeight: 1.8,
    playerWidth: 0.6,
    playerStart: [0, 10, 0],
    playerAutoStep: false,
    tickRate: 33, // ms per tick - not ticks per second
    blockTestDistance: 10,
    stickyPointerLock: true,
    dragCameraOutsidePointerLock: true,
    skipDefaultHighlighting: false,
}
var NoaEngine = require('noa-engine')
var noa = NoaEngine(opts)
```


----

<a name="Noa+version"></a>

## noa.version
version string, e.g. `"0.25.4"`


----

<a name="Noa+container"></a>

## noa.container : [<code>Container</code>](#Container)
container (html/div) manager


----

<a name="Noa+inputs"></a>

## noa.inputs : [<code>Inputs</code>](#Inputs)
inputs manager - abstracts key/mouse input


----

<a name="Noa+registry"></a>

## noa.registry : [<code>Registry</code>](#Registry)
block/item property registry


----

<a name="Noa+world"></a>

## noa.world : [<code>World</code>](#World)
world manager


----

<a name="Noa+rendering"></a>

## noa.rendering : [<code>Rendering</code>](#Rendering)
Rendering manager


----

<a name="Noa+entities"></a>

## noa.entities : [<code>Entities</code>](#Entities)
Entity manager / Entity Component System (ECS) 
Aliased to `noa.ents` for convenience.


----

<a name="Noa+physics"></a>

## noa.physics : [<code>Physics</code>](#Physics)
physics engine - solves collisions, properties, etc.


----

<a name="Noa+cameraControls"></a>

## noa.cameraControls : [<code>CameraController</code>](#CameraController)
Manages camera, view angle, etc.


----

<a name="Noa+playerEntity"></a>

## noa.playerEntity
Entity id for the player entity


----

<a name="Noa+playerBody"></a>

## noa.playerBody
Reference to player entity's physics body
Equivalent to: `noa.ents.getPhysicsBody(noa.playerEntity)`


----

<a name="Noa+blockTargetIdCheck"></a>

## noa.blockTargetIdCheck
function for which block IDs are targetable. 
Defaults to a solidity check, but can be overridden


----

<a name="Noa+targetedBlock"></a>

## noa.targetedBlock
Dynamically updated object describing the currently targeted block


----

<a name="Noa+setPaused"></a>

## noa.setPaused(paused)
Pausing the engine will also stop render/tick events, etc.

**Params**

- paused


----

<a name="Noa+getBlock"></a>

## noa.getBlock(x,y,z)
**Params**

- x,y,z


----

<a name="Noa+setBlock"></a>

## noa.setBlock(x,y,z)
**Params**

- x,y,z


----

<a name="Noa+addBlock"></a>

## noa.addBlock(id,x,y,z)
Adds a block unless obstructed by entities

**Params**

- id,x,y,z


----

<a name="Noa+getPlayerPosition"></a>

## noa.getPlayerPosition()

----

<a name="Noa+getPlayerMesh"></a>

## noa.getPlayerMesh()

----

<a name="Noa+setPlayerEyeOffset"></a>

## noa.setPlayerEyeOffset()

----

<a name="Noa+getPlayerEyePosition"></a>

## noa.getPlayerEyePosition()

----

<a name="Noa+getCameraVector"></a>

## noa.getCameraVector()

----

<a name="Noa+pick"></a>

## noa.pick(pos, vec, dist)
Raycast through the world, returning a result object for any non-air block

**Params**

- pos
- vec
- dist


----

<a name="CameraController"></a>

## CameraController
Manages the camera,
exposes settings for mouse sensitivity.


* [CameraController](#CameraController)
    * [.rotationScaleX](#CameraController+rotationScaleX)
    * [.rotationScaleY](#CameraController+rotationScaleY)
    * [.inverseY](#CameraController+inverseY)


----

<a name="CameraController+rotationScaleX"></a>

## noa.cameraControls.rotationScaleX
Horizontal sensitivity


----

<a name="CameraController+rotationScaleY"></a>

## noa.cameraControls.rotationScaleY
Vertical sensitivity


----

<a name="CameraController+inverseY"></a>

## noa.cameraControls.inverseY
Mouse look inverse setting


----

<a name="Container"></a>

## Container
Wraps `game-shell` module 
and manages HTML container, canvas, etc.

**Emits**:  
- `event:DOMready`

----

<a name="Entities"></a>

## Entities
Wrangles entities. Aliased as `noa.ents`.

This class is an instance of [ECS](https://github.com/andyhall/ent-comp), 
and as such implements the usual ECS methods.
It's also decorated with helpers and accessor functions for getting component existence/state.

Expects entity definitions in a specific format - see source `components` folder for examples.


* [Entities](#Entities)
    * [.addComponentAgain(id,name,state)](#Entities+addComponentAgain)
    * [.isTerrainBlocked(x,y,z)](#Entities+isTerrainBlocked)
    * [.setEntitySize(x,y,z)](#Entities+setEntitySize)
    * [.getEntitiesInAABB(box)](#Entities+getEntitiesInAABB)
    * [.add(position, width, mesh)](#Entities+add)


----

<a name="Entities+addComponentAgain"></a>

## noa.ents.addComponentAgain(id,name,state)
**Params**

- id,name,state


----

<a name="Entities+isTerrainBlocked"></a>

## noa.ents.isTerrainBlocked(x,y,z)
**Params**

- x,y,z


----

<a name="Entities+setEntitySize"></a>

## noa.ents.setEntitySize(x,y,z)
**Params**

- x,y,z


----

<a name="Entities+getEntitiesInAABB"></a>

## noa.ents.getEntitiesInAABB(box)
**Params**

- box


----

<a name="Entities+add"></a>

## noa.ents.add(position, width, mesh)
Helper to set up a general entity, and populate with some common components depending on arguments.

Parameters: position, width, height [, mesh, meshOffset, doPhysics, shadow]

**Params**

- position
- width
        - .
- mesh 


----

<a name="Inputs"></a>

## Inputs
Abstracts key/mouse input. 
For docs see [andyhall/game-inputs](https://github.com/andyhall/game-inputs)


----

<a name="Physics"></a>

## Physics
Wrapper module for the 
[physics engine](https://github.com/andyhall/voxel-physics-engine)


----

<a name="Registry"></a>

## Registry
for registering block types, materials & properties


* [Registry](#Registry)
    * [.registerBlock()](#Registry+registerBlock)
    * [.registerMaterial(name, color, textureURL, texHasAlpha, renderMaterial)](#Registry+registerMaterial)
    * [.getBlockSolidity(id)](#Registry+getBlockSolidity)
    * [.getBlockOpacity(id)](#Registry+getBlockOpacity)
    * [.getBlockFluidity(id)](#Registry+getBlockFluidity)
    * [.getBlockProps(id)](#Registry+getBlockProps)


----

<a name="Registry+registerBlock"></a>

## noa.registry.registerBlock()
Register (by integer ID) a block type and its parameters.

 `id` param: integer, currently 1..255. This needs to be passed in by the 
   client because it goes into the chunk data, which someday will get serialized.

 `options` param: Recognized fields for the options object:

 * material: can be:
     * one (String) material name
     * array of 2 names: [top/bottom, sides]
     * array of 3 names: [top, bottom, sides]
     * array of 6 names: [-x, +x, -y, +y, -z, +z]
   If not specified, terrain won't be meshed for the block type
 * solid: (true) solidity for physics purposes
 * opaque: (true) fully obscures neighboring blocks
 * fluid: (false) whether nonsolid block is a fluid (buoyant, viscous..)
 * blockMeshes: (null) if specified, noa will create an instance of the mesh instead of rendering voxel terrain
 * fluidDensity: (1.0) for fluid blocks
 * viscosity: (0.5) for fluid blocks
 * onLoad(): block event handler
 * onUnload(): block event handler
 * onSet(): block event handler
 * onUnset(): block event handler
 * onCustomMeshCreate(): block event handler


----

<a name="Registry+registerMaterial"></a>

## noa.registry.registerMaterial(name, color, textureURL, texHasAlpha, renderMaterial)
Register (by name) a material and its parameters.

**Params**

- name
- color
- textureURL
- texHasAlpha
- renderMaterial - an optional BABYLON material to be used for block faces with this block material


----

<a name="Registry+getBlockSolidity"></a>

## noa.registry.getBlockSolidity(id)
block solidity (as in physics)

**Params**

- id


----

<a name="Registry+getBlockOpacity"></a>

## noa.registry.getBlockOpacity(id)
block opacity - whether it obscures the whole voxel (dirt) or 
can be partially seen through (like a fencepost, etc)

**Params**

- id


----

<a name="Registry+getBlockFluidity"></a>

## noa.registry.getBlockFluidity(id)
block is fluid or not

**Params**

- id


----

<a name="Registry+getBlockProps"></a>

## noa.registry.getBlockProps(id)
Get block property object passed in at registration

**Params**

- id


----

<a name="Rendering"></a>

## Rendering
Manages all rendering.


* [Rendering](#Rendering)
    * [.getScene](#Rendering+getScene)
    * [.getCameraVector()](#Rendering+getCameraVector)
    * [.getCameraPosition()](#Rendering+getCameraPosition)
    * [.getCameraRotation()](#Rendering+getCameraRotation)
    * [.addMeshToScene()](#Rendering+addMeshToScene)
    * [.removeMeshFromScene()](#Rendering+removeMeshFromScene)


----

<a name="Rendering+getScene"></a>

## noa.rendering.getScene
The Babylon `scene` object representing the game world.


----

<a name="Rendering+getCameraVector"></a>

## noa.rendering.getCameraVector()

----

<a name="Rendering+getCameraPosition"></a>

## noa.rendering.getCameraPosition()

----

<a name="Rendering+getCameraRotation"></a>

## noa.rendering.getCameraRotation()

----

<a name="Rendering+addMeshToScene"></a>

## noa.rendering.addMeshToScene()
add a mesh to the scene's octree setup so that it renders
pass in isStatic=true if the mesh won't move (i.e. change octree blocks)


----

<a name="Rendering+removeMeshFromScene"></a>

## noa.rendering.removeMeshFromScene()
Undoes everything `addMeshToScene` does


----

<a name="World"></a>

## World
Manages the world and its chunks

Extends `EventEmitter`

**Emits**:  
- `worldDataNeeded(id, ndarray, x, y,event: z)`
- `chunkAdded(chunk)`
- `chunkChanged(chunk)`
- `chunkBeingRemoved(id, ndarray,event: userData)`

* [World](#World)
    * [.getBlockID(x,y,z)](#World+getBlockID)
    * [.getBlockSolidity(x,y,z)](#World+getBlockSolidity)
    * [.getBlockOpacity(x,y,z)](#World+getBlockOpacity)
    * [.getBlockFluidity(x,y,z)](#World+getBlockFluidity)
    * [.getBlockProperties(x,y,z)](#World+getBlockProperties)
    * [.getBlockObjectMesh(x,y,z)](#World+getBlockObjectMesh)
    * [.setBlockID(x,y,z)](#World+setBlockID)
    * [.isBoxUnobstructed(x,y,z)](#World+isBoxUnobstructed)
    * [.setChunkData(id, array, userData)](#World+setChunkData)


----

<a name="World+getBlockID"></a>

## noa.world.getBlockID(x,y,z)
**Params**

- x,y,z


----

<a name="World+getBlockSolidity"></a>

## noa.world.getBlockSolidity(x,y,z)
**Params**

- x,y,z


----

<a name="World+getBlockOpacity"></a>

## noa.world.getBlockOpacity(x,y,z)
**Params**

- x,y,z


----

<a name="World+getBlockFluidity"></a>

## noa.world.getBlockFluidity(x,y,z)
**Params**

- x,y,z


----

<a name="World+getBlockProperties"></a>

## noa.world.getBlockProperties(x,y,z)
**Params**

- x,y,z


----

<a name="World+getBlockObjectMesh"></a>

## noa.world.getBlockObjectMesh(x,y,z)
**Params**

- x,y,z


----

<a name="World+setBlockID"></a>

## noa.world.setBlockID(x,y,z)
**Params**

- x,y,z


----

<a name="World+isBoxUnobstructed"></a>

## noa.world.isBoxUnobstructed(x,y,z)
**Params**

- x,y,z


----

<a name="World+setChunkData"></a>

## noa.world.setChunkData(id, array, userData)
client should call this after creating a chunk's worth of data (as an ndarray)  
If userData is passed in it will be attached to the chunk

**Params**

- id
- array
- userData


----

