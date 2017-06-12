
# noa-engine

An experimental voxel game engine.

[Live demo of test app here!](http://andyhall.github.io/noa-testbed/)

### Usage

Under active development, best way to try it is to clone and hack on it:

```sh
(clone this repo)
cd noa
npm install
npm start       # runs /examples/hello-world
npm test        # runs /examples/test
```

Here are live versions of the examples: 
 * [hello-world example](http://andyhall.github.io/noa/examples/hello-world/)
 * [test example](http://andyhall.github.io/noa/examples/test/)

To build a new world app, use `noa` as a dependency:

```sh
npm install --save noa-engine
```

```js
var engine = require('noa-engine')
var noa = engine({
    inverseY: true,
    // see source or examples for more options and usage
})
```

### Docs

The source is pretty fully commented. There is a partial API reference 
at the end of this file, but I haven't been able to find a good way of 
generating JSDocs that I can live with, so for now it's best to consult 
the source.

### Recent changes:

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