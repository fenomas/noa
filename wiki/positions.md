
# Note on positions

`Noa` assumes that in general game worlds will be large, and that the 
player entity may move hundreds or thousands of voxels away from `(0,0,0)`.
To avoid precision bugs when this happens, physics and rendering calculations
are done in a local frame of reference, which is rebased peridiocally to 
keep relevant numbers small.

For this reason most engine APIs that take or return positions
do so in this local frame of reference. This is generally reflected in the
API's name - e.g. `noa.entities.getLocalPosition`, `noa.camera.getTargetLocalPosition`, etc.

However all voxel getting/setting APIs - e.g. `noa.getBlock`, `noa.setBlock` - 
work strictly in world coords. This includes the parameters of `noa.targetedBlock`.

----

## Conversion between local and global coords

Many game logic operations can be done strictly in local coords - e.g. 
finding the distance from the camera to a given entity or such. 
However interacting with voxels requires global coords, so in such cases 
conversion can be done with:

```js
// writes into localPos
noa.globalToLocal(globalPos, precisePos, localPos) 

// writes into globalPos, precisePos
noa.localToGlobal(localPos, globalPos, precisePos)
```

In both cases, `precisePos` is an optional high-precision (i.e. fractional) 
offset to `globalPos`. If it's not provided, the operation will be done with 
`globalPos` alone (though the results may be imprecise).

----

## Example code

```js
// arbitrary distant location, in world coords
var farAway = [1000, 5, 5]

// convert the above to local coords, and move player there
var localPos = []
noa.globalToLocal(farAway, null, localPos)
noa.entities.setLocalPosition(noa.playerEntity, localPos)

// wait 100ms to allow a tick to occur, and afterwards the 
// local frame of reference will have moved near the player:
setTimeout(() => {
    var loc = noa.entities.getLocalPosition(noa.playerEntity)
    console.log(loc)  // reasonably small numbers, in local coords
}, 100)

// later...  we decide we want to raycast from the camera and do something
// at the resulting location
var camLocal = noa.camera.getLocalPosition()

// do a pick operation, in local coords
var camDir = noa.camera.getDirection()
var dist = 20
var result = noa.localPick(camLocal, camDir, dist)

// convert raycast results to global coords
if (result) {
    var globalPos = []
    var precise = []
    noa.localToGlobal(result.position, globalPos, precise)
    console.log('integer part of raycast result:', globalPos)
    console.log('fractional part of raycast result:', precise)
}
```
