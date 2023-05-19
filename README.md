
# noa-engine

An experimental voxel game engine.

Some projects using `noa`:
 * [bloxd.io](https://bloxd.io/) - multiplayer voxel games with editable worlds, by [Arthur](https://github.com/MCArth)
 * [Minecraft Classic](https://classic.minecraft.net/) - from Mojang (I'm as surprised as you are)
 * [VoxelSrv](https://github.com/Patbox/voxelsrv) - a voxel game inspired by Minecraft, by [patbox](https://github.com/Patbox)
 * [CityCraft.io](https://citycraft.io/) - multiplayer voxel cities, by [raoneel](https://github.com/raoneel)
 * [OPCraft](https://github.com/latticexyz/opcraft) - a voxel game running on Ethereum smart contracts, by [Lattice](https://github.com/latticexyz)
 * [noa-examples](https://github.com/fenomas/noa-examples) - starter repo with minimal hello-world and testbed games


----

## Usage

The easiest way to start building a game with `noa` is to clone the 
[examples](https://github.com/fenomas/noa-examples) repo and start hacking 
on the code there. The comments in the `hello-world` example source walk 
through how to instantiate the engine, define world geometry, and so forth. 
The example repo also shows the intended way to import noa's 
peer dependencies, test a world, build for production, etc.


## Docs

See the [API reference](https://fenomas.github.io/noa/API/) 
for engine classes and methods. 

Documentation PRs are welcome! See the source for details, API docs 
are generated automatically via `npm run docs`.


## Status, contributing, etc.

This engine is under active development and contributions are welcome.
Please open a discussion issue before submitting large changes.
**PRs should be sent against the `develop` branch!**

Code style/formatting are set up with config files and dev dependencies, 
if you use VSCode most of it should work automatically. If you send PRs, 
please try to be sorta-kinda consistent with what's already there.



## Change logs

See [history.md](docs/history.md) for full changes and migration for each version.

Recent changes:

 * `v0.33`: 
   * Much improved [API docs](https://fenomas.github.io/noa/API/)
   * Terrain now supports texture atlases! See `registry.registerMaterial`.
   * Added a fast way to specify that a worldgen chunk is entirely air/dirt/etc.
   * Modernized keybinds to use [KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) strings, and changed several binding state properties
   * Bunch of internal improvements to support shadows - see [examples](https://github.com/fenomas/noa-examples)

 * `v0.32`: Fixes npm versioning issue - no code changes.
 * `v0.31`: 
   * Change the speed of the world! See `noa.timeScale`
   * Now possible to control chunk processing order: `noa.world.chunkSortingDistFn`
   * Much improved type exports and [API docs](https://fenomas.github.io/noa/API/) 
 * `v0.30`: 
   * Engine now a named export, use `import {Engine} from 'noa-engine'`
   * many performance and size optimizations
   * now generates proper type declarations and API references!
   * can now configure separate vert/horiz values for chunk load distance
   * core option `tickRate` is now in **ticks per second**, not ms per tick
   * adds several init options, e.g. `maxRenderRate`, `stickyFullscreen`
 * `v0.29`: 
   * maximum voxel ID is now `65535`
   * adds option `worldGenWhilePaused`
   * adds option `manuallyControlChunkLoading` and related APIs
   * performance and bug fixes


----

## Credits

Made with 🍺 by [@fenomas](https://fenomas.com), license is [MIT](LICENSE.txt).

Uses [Babylon.js](https://www.babylonjs.com/) for 3D rendering.
