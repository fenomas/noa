
# Notes on positions


Like all entity data, the position of an entity in `noa` lives in a
component state object - specifically, the state of the 
[position](../src/components/position.js) component. 
There are several accessors on `noa.entities` for working with positions:

```js
var id = noa.entities.createEntity()
noa.ents.addComponent(id, noa.ents.names.position, {
    position: [1, 2, 3],
    width: 1,
    height: 2, 
})

noa.ents.hasPosition(id)  // true
noa.ents.getPosition(id)  // [1, 2, 3]
noa.ents.setPosition(id, [4.5, 5, 6])
```

And such. There is also a state accessor:

```js
var posState = noa.ents.getPositionData(id)
posState.position // [4.5, 5, 6]
posState.width    // 1
posState.height   // 2
```

If you then add the `physics` and `mesh` components, the related positions 
will get managed automatically. That is, the physics engine will manage 
the entity's position, which will in turn manage the attached mesh's position
in the 3D scene.

----

## Advanced

Behind the scenes things are a little more complicated. 
Game worlds tend to be large, so to avoid precision bugs `noa` 
runs all its logic in a *local frame of reference*, offset from global coordinates.
This affects physics, rendering, raycasts, and entity/entity collision tests.

This affects you the game programmer in two ways:

 * If you directly manipulate mesh or physics body positions, 
   you'll need to do so in local coords
 * When entities are very far away from the world origin,
   regular position APIs may be imprecise

If you run afoul of such issues, here's all you need to know:

## Converting between local and global coords

```js
// noa has two functions to precisely convert between global and local coords.
// In both cases the "global" argument is treated as integer values, 
// and the "precisePos" is fractional offsets to the global position
noa.localToGlobal(local, global, precisePos)
noa.globalToLocal(global, precisePos, local)

// e.g.
var local = []
noa.globalToLocal([1, 2, 3], [0.1, 0.1, 0.1], local)
console.log(local)    // [1.1, 2.1, 3.1], converted to local coords

var pos = []
var frac = []
noa.localToGlobal(local, pos, frac)
console.log(pos)      // [1, 2, 3]
console.log(frac)     // [0.1, 0.1, 0.1]

// In both cases the "precise" argument can be omitted, 
// so the "global" array will be treated as full (int+fraction) values. 
// This may cause precision issues in very large game worlds.
var pos = [1.1, 2.1, 3.1]
noa.globalToLocal(pos, null, local)
noa.localToGlobal(local, pos)
console.log(pos)      // approx. [1.1, 2.1, 3.1]
```

## Using local coord APIs

In general, all position related APIs in `noa` have a counterpart that 
works in local coordinates, prefixed with `_local`. 
These are generally for internal use, but it's safe to use them 
whenever you need high precision, or you need to 
manually mess with positions in the rendering or physics engine. 

```js
// do a raycast from an entity's position, the normal way
var dir = noa.camera.getDirection()
var pos = noa.ents.getPosition(id)
var res = noa.pick(pos, dir)

// same thing but higher precision
var pos = noa.ents._localGetPosition(id)
var res = noa._localPick(pos, dir)

// full list of _local APIs
noa._localPick
noa.ents._localGetPosition
noa.ents._localSetPosition
noa.camera._localGetPosition
noa.camera._localGetTargetPosition
```

----

## Extra gory details

Hopefully you won't need to know anything below here, 
but here are internal details for anyone hacking on the engine:

 * `noa.worldOriginOffset` is the offset between local and global coords

The position component keeps the following internal properties (all in *local coordinates*).

 * `_localPosition` - the "game logic" position
 * `_renderPosition` - the "render" position in the 3D scene
 * `_extents` - an array like: `[lox, loy, loz, hix, hiy, hiz]`

`_localPosition` is the entity's "real" single-source-of-truth position.
All other properties are derived from it. The reason for `_renderPosition` 
being a separate value is that it can change every render, 
while `_localPosition` only changes once per tick.
