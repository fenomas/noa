
# noa-engine

An experimental voxel game engine.

Some projects using `noa`:
 * [Minecraft Classic](https://classic.minecraft.net/) - official game from Mojang (I'm as surprised as you are)
 * [VoxelSrv](https://github.com/Patbox/voxelsrv) - a voxel game inspired by Minecraft, by [patbox](https://github.com/Patbox)
 * [CityCraft.io](https://citycraft.io/) - multiplayer voxel cities, by [raoneel](https://github.com/raoneel)
 * [noa-examples](https://github.com/fenomas/noa-examples) - starter repo with minimal hello-world and testbed games


----

## Usage

The easiest way to start building a game with `noa` is to clone the 
[examples](https://github.com/fenomas/noa-examples) repo and start hacking 
on the code there. The comments in the `hello-world` example source walk 
through how to instantiate the engine, define world geometry, and so forth. 
The example repo also shows the intended way to import noa's 
peer depenencies, configure webpack, and so on.



## Size

The engine is around **250kb** when built in production mode and zipped. 
Uncompressed, `noa` is ~160kb its peer dependency `babylon.js` is ~900kb.


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

See [history.md](docs/history.md) for changes and migration for each version.

Recent changes:

 * `v0.30`: 
   * Engine now a named class, use `import {Engine} from 'noa-engine'`
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
 * `v0.28`: 
   * improves swapping between world data sets (see `noa.worldName`).
   * Removes duplicated voxel padding in each chunk (this means world generation no longer needs to be deterministic!)
 * `v0.27`: adds world origin rebasing - see [positions.md](docs/positions.md)


----

## Credits

Made with 🍺 by [Andy Hall](https://fenomas.com), license is MIT.

Uses [Babylon.js](https://www.babylonjs.com/) for 3D rendering.
