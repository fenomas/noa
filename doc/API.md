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
    <td><a href="#Camera">Camera</a></td>
    <td><p>Manages the camera, exposes camera position, direction, mouse sensitivity.</p>
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
    <td><p>Wrapper module for the physics engine. For docs see 
<a href="https://github.com/andyhall/voxel-physics-engine">andyhall/voxel-physics-engine</a></p>
</td>
    </tr>
<tr>
    <td><a href="#Registry">Registry</a></td>
    <td><p>for registering block types, materials &amp; properties</p>
</td>
    </tr>
<tr>
    <td><a href="#Rendering">Rendering</a></td>
    <td><p>Manages all rendering, and the BABYLON scene, materials, etc.</p>
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

## 

<table>
  <thead>
    <tr>
      <th>Global</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td><a href="#names">names</a></td>
    <td><p>Hash containing the component names of built-in components.</p>
</td>
    </tr>
<tr>
    <td><a href="#hasPhysics">hasPhysics</a></td>
    <td></td>
    </tr>
<tr>
    <td><a href="#cameraSmoothed">cameraSmoothed</a></td>
    <td></td>
    </tr>
<tr>
    <td><a href="#hasMesh">hasMesh</a></td>
    <td></td>
    </tr>
<tr>
    <td><a href="#hasPosition">hasPosition</a></td>
    <td></td>
    </tr>
<tr>
    <td><a href="#getPositionData">getPositionData</a></td>
    <td></td>
    </tr>
</tbody>
</table>

## 

<table>
  <thead>
    <tr>
      <th>Global</th><th>Description</th>
    </tr>
  </thead>
  <tbody>
<tr>
    <td><a href="#isPlayer">isPlayer(id)</a></td>
    <td></td>
    </tr>
<tr>
    <td><a href="#_localGetPosition">_localGetPosition(id)</a></td>
    <td></td>
    </tr>
<tr>
    <td><a href="#getPosition">getPosition(id)</a></td>
    <td></td>
    </tr>
<tr>
    <td><a href="#_localSetPosition">_localSetPosition(id)</a></td>
    <td></td>
    </tr>
<tr>
    <td><a href="#setPosition">setPosition(id,)</a></td>
    <td></td>
    </tr>
<tr>
    <td><a href="#setEntitySize">setEntitySize(id,)</a></td>
    <td></td>
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
    * [.physics](#Noa+physics) : [<code>Physics</code>](#Physics)
    * [.entities](#Noa+entities) : [<code>Entities</code>](#Entities)
    * [.playerEntity](#Noa+playerEntity)
    * [.camera](#Noa+camera) : [<code>Camera</code>](#Camera)
    * [.blockTargetIdCheck](#Noa+blockTargetIdCheck)
    * [.targetedBlock](#Noa+targetedBlock)
    * [.globalToLocal()](#Noa+globalToLocal)
    * [.localToGlobal()](#Noa+localToGlobal)
    * [.setPaused(paused)](#Noa+setPaused)
    * [.getBlock(x,y,z)](#Noa+getBlock)
    * [.setBlock(x,y,z)](#Noa+setBlock)
    * [.addBlock(id,x,y,z)](#Noa+addBlock)
    * [.pick(pos, vec, dist, blockTestFunction)](#Noa+pick)
    * [._localPick(pos, vec, dist, blockTestFunction)](#Noa+_localPick)


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
    originRebaseDistance: 25,
}
var NoaEngine = require('noa-engine')
var noa = NoaEngine(opts)
```

All option parameters are, well, optional. Note that 
the root `opts` parameter object is also passed to 
noa's child modules (rendering, camera, etc). 
See docs for each module for which options they use.


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

<a name="Noa+physics"></a>

## noa.physics : [<code>Physics</code>](#Physics)
physics engine - solves collisions, properties, etc.


----

<a name="Noa+entities"></a>

## noa.entities : [<code>Entities</code>](#Entities)
Entity manager / Entity Component System (ECS) 
Aliased to `noa.ents` for convenience.


----

<a name="Noa+playerEntity"></a>

## noa.playerEntity
Entity id for the player entity


----

<a name="Noa+camera"></a>

## noa.camera : [<code>Camera</code>](#Camera)
Manages camera, view angle, etc.


----

<a name="Noa+blockTargetIdCheck"></a>

## noa.blockTargetIdCheck
function for which block IDs are targetable. 
Defaults to a solidity check, but can be overridden


----

<a name="Noa+targetedBlock"></a>

## noa.targetedBlock
Dynamically updated object describing the currently targeted block.
Gets updated each tick, to `null` if not block is targeted, or 
to an object like:

    {
       blockID,   // voxel ID
       position,  // the (solid) block being targeted
       adjacent,  // the (non-solid) block adjacent to the targeted one
       normal,    // e.g. [0, 1, 0] when player is targting the top face of a voxel
    }


----

<a name="Noa+globalToLocal"></a>

## noa.globalToLocal()
Precisely converts a world position to the current internal 
local frame of reference.

See `/doc/positions.md` for more info.

Params: 
 * `global`: input position in global coords
 * `globalPrecise`: (optional) sub-voxel offset to the global position
 * `local`: output array which will receive the result


----

<a name="Noa+localToGlobal"></a>

## noa.localToGlobal()
Precisely converts a world position to the current internal 
local frame of reference.

See `/doc/positions.md` for more info.

Params: 
 * `local`: input array of local coords
 * `global`: output array which receives the result
 * `globalPrecise`: (optional) sub-voxel offset to the output global position

If both output arrays are passed in, `global` will get int values and 
`globalPrecise` will get fractional parts. If only one array is passed in,
`global` will get the whole output position.


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

<a name="Noa+pick"></a>

## noa.pick(pos, vec, dist, blockTestFunction)
Raycast through the world, returning a result object for any non-air block

**Params**

- pos - (default: to player eye position)
- vec - (default: to camera vector)
- dist - (default: `noa.blockTestDistance`)
- blockTestFunction - (default: voxel solidity)

Returns: `null`, or an object with array properties: `position`, 
`normal`, `_localPosition`. 

See `/doc/positions.md` for info on working with precise positions.


----

<a name="Noa+_localPick"></a>

## noa.\_localPick(pos, vec, dist, blockTestFunction)
Do a raycast in local coords. 
See `/doc/positions.md` for more info.

**Params**

- pos
- vec
- dist
- blockTestFunction


----

<a name="Camera"></a>

## Camera
Manages the camera, exposes camera position, direction, mouse sensitivity.


* [Camera](#Camera)
    * _instance_
        * [.sensitivityX](#Camera+sensitivityX)
        * [.sensitivityY](#Camera+sensitivityY)
        * [.inverseX](#Camera+inverseX)
        * [.inverseY](#Camera+inverseY)
        * [.heading](#Camera+heading)
        * [.pitch](#Camera+pitch)
        * [.cameraTarget](#Camera+cameraTarget)
        * [.zoomDistance](#Camera+zoomDistance)
        * [.zoomSpeed](#Camera+zoomSpeed)
        * [.currentZoom](#Camera+currentZoom)
        * [.getTargetPosition()](#Camera+getTargetPosition)
        * [.getPosition()](#Camera+getPosition)
        * [.getDirection()](#Camera+getDirection)
    * _inner_
        * [~opts](#Camera..opts)


----

<a name="Camera+sensitivityX"></a>

## noa.camera.sensitivityX
Horizontal mouse sensitivity. 
Same scale as Overwatch (typical values around `5..10`)


----

<a name="Camera+sensitivityY"></a>

## noa.camera.sensitivityY
Vertical mouse sensitivity.
Same scale as Overwatch (typical values around `5..10`)


----

<a name="Camera+inverseX"></a>

## noa.camera.inverseX
Mouse look inverse (horizontal)


----

<a name="Camera+inverseY"></a>

## noa.camera.inverseY
Mouse look inverse (vertical)


----

<a name="Camera+heading"></a>

## noa.camera.heading
Camera yaw angle (read only) 

Returns the camera's rotation angle around the vertical axis. Range: `0..2π`


----

<a name="Camera+pitch"></a>

## noa.camera.pitch
Camera pitch angle (read only)

Returns the camera's up/down rotation angle. Range: `-π/2..π/2`. 
(The pitch angle is clamped by a small epsilon, such that 
the camera never quite points perfectly up or down.


----

<a name="Camera+cameraTarget"></a>

## noa.camera.cameraTarget
Entity ID of a special entity that exists for the camera to point at.

By default this entity follows the player entity, so you can 
change the player's eye height by changing the `follow` component's offset:
```js
var followState = noa.ents.getState(noa.camera.cameraTarget, 'followsEntity')
followState.offset[1] = 0.9 * myPlayerHeight
```

For customized camera controls you can change the follow 
target to some other entity, or override the behavior entirely:
```js
// make cameraTarget stop following the player
noa.ents.removeComponent(noa.camera.cameraTarget, 'followsEntity')
// control cameraTarget position directly (or whatever..)
noa.ents.setPosition(noa.camera.cameraTarget, [x,y,z])
```


----

<a name="Camera+zoomDistance"></a>

## noa.camera.zoomDistance
How far back the camera is zoomed from the camera target


----

<a name="Camera+zoomSpeed"></a>

## noa.camera.zoomSpeed
How quickly the camera moves to its `zoomDistance` (0..1)


----

<a name="Camera+currentZoom"></a>

## noa.camera.currentZoom
Current actual zoom distance. This differs from `zoomDistance` when
the camera is in the process of moving towards the desired distance, 
or when it's obstructed by solid terrain behind the player.


----

<a name="Camera+getTargetPosition"></a>

## noa.camera.getTargetPosition()
Camera target position (read only)

This returns the point the camera looks at - i.e. the player's 
eye position. When the camera is zoomed 
all the way in, this is equivalent to `camera.getPosition()`.


----

<a name="Camera+getPosition"></a>

## noa.camera.getPosition()
Returns the current camera position (read only)


----

<a name="Camera+getDirection"></a>

## noa.camera.getDirection()
Returns the camera direction vector (read only)


----

<a name="Camera..opts"></a>

## Camera~opts
`noa.camera` uses the following options (from the root `noa(opts)` options):
```js
{
  inverseX: false,
  inverseY: false,
  sensitivityX: 15,
  sensitivityY: 15,
  initialZoom: 0,
  zoomSpeed: 0.2,
}
```


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
Wrapper module for the physics engine. For docs see 
[andyhall/voxel-physics-engine](https://github.com/andyhall/voxel-physics-engine)


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
Manages all rendering, and the BABYLON scene, materials, etc.


* [Rendering](#Rendering)
    * _instance_
        * [.getScene](#Rendering+getScene)
        * [.addMeshToScene(mesh:, isStatic:, position:, chunk:)](#Rendering+addMeshToScene)
        * [.removeMeshFromScene()](#Rendering+removeMeshFromScene)
    * _inner_
        * [~opts](#Rendering..opts)


----

<a name="Rendering+getScene"></a>

## noa.rendering.getScene
The Babylon `scene` object representing the game world.


----

<a name="Rendering+addMeshToScene"></a>

## noa.rendering.addMeshToScene(mesh:, isStatic:, position:, chunk:)
Add a mesh to the scene's octree setup so that it renders.

**Params**

- mesh: - the mesh to add to the scene
- isStatic: - pass in true if mesh never moves (i.e. change octree blocks)
- position: - (optional) global position where the mesh should be
- chunk: - (optional) chunk to which the mesh is statically bound


----

<a name="Rendering+removeMeshFromScene"></a>

## noa.rendering.removeMeshFromScene()
Undoes everything `addMeshToScene` does


----

<a name="Rendering..opts"></a>

## Rendering~opts
`noa.rendering` uses the following options (from the root `noa(opts)` options):
```js
{
  showFPS: false,
  antiAlias: true,
  clearColor: [0.8, 0.9, 1],
  ambientColor: [1, 1, 1],
  lightDiffuse: [1, 1, 1],
  lightSpecular: [1, 1, 1],
  groundLightColor: [0.5, 0.5, 0.5],
  useAO: true,
  AOmultipliers: [0.93, 0.8, 0.5],
  reverseAOmultiplier: 1.0,
  preserveDrawingBuffer: true,
}
```


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

<a name="names"></a>

## names
Hash containing the component names of built-in components.


----

<a name="hasPhysics"></a>

## hasPhysics
**Params**

- id


----

<a name="cameraSmoothed"></a>

## cameraSmoothed
**Params**

- id


----

<a name="hasMesh"></a>

## hasMesh
**Params**

- id


----

<a name="hasPosition"></a>

## hasPosition
**Params**

- id


----

<a name="getPositionData"></a>

## getPositionData
**Params**

- id


----

<a name="isPlayer"></a>

## isPlayer(id)
**Params**

- id


----

<a name="_localGetPosition"></a>

## \_localGetPosition(id)
**Params**

- id


----

<a name="getPosition"></a>

## getPosition(id)
**Params**

- id


----

<a name="_localSetPosition"></a>

## \_localSetPosition(id)
**Params**

- id


----

<a name="setPosition"></a>

## setPosition(id,)
**Params**

- id, - positionArr


----

<a name="setEntitySize"></a>

## setEntitySize(id,)
**Params**

- id, - xs, ys, zs


----

