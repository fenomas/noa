
# noa-engine

An experimental voxel game engine.

Some projects using `noa`:
 * [Minecraft Classic](https://classic.minecraft.net/) - official game from Mojang (I'm as surprised as you are)
 * [CityCraft.io](https://citycraft.io/) - multiplayer voxel cities
 * [VoxelSrv](https://github.com/Patbox/voxelsrv) - a voxel game inspired by Minecraft
 * [noa-examples](https://github.com/andyhall/noa-examples) - starter repo with minimal hello-world and testbed games


----

## Usage

The easiest way to start building a game with `noa` is to clone the [examples](https://github.com/andyhall/noa-examples) repo and start hacking on the code there. The comments in the `hello-world` example source walk through how to instantiate the engine, define world geometry, and so forth.

To hack on the `noa` engine itself, you'll want to clone this repo alongside your game content, and make the latter depend on the former with a local file dependency (i.e. `file:../noa` in `package.json`). Note however that webpack is picky about this - see the [examples readme](https://github.com/andyhall/noa-examples) for details.


## Docs

See the [API reference](doc/API.md) for an overview of engine classes and methods.
Docs are evolving though, some details are only documented in source comments.
Documentation PRs are welcome!


## Status, contributing, etc.

This library is under active development and contributions are welcome!
**Please submit any PRs against the `develop` branch**, and for nontrivial new 
features it's probably best to open a discussion issue first.

For code style/formatting, the repo includes config files for [eslint](https://eslint.org/) and [js-beautify](https://github.com/beautify-web/js-beautify), which are both dev dependencies. If you use VSCode for editing, here are the extensions I use to run them automatically: [beautify](https://marketplace.visualstudio.com/items?itemName=HookyQR.beautify), [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).



## Change logs

See [history.md](doc/history.md) for changes and migration info from each version.

Recent changes:

 * `v0.30`:
   * typescript
   * new `airJumps` option (defaults to `0`)
 * `v0.29`:
   * maximum voxel ID is now `65535`
   * adds option `worldGenWhilePaused`
   * adds option `manuallyControlChunkLoading` and related APIs
   * performance and bug fixes
 * `v0.28`:
   * improves swapping between world data sets (see `noa.worldName`).
   * Removes duplicated voxel padding in each chunk (this means world generation 
 no longer needs to be deterministic!)
 * `v0.27`: adds world origin rebasing - see [positions.md](doc/positions.md)


----

## Credits

Made with 🍺 by [Andy Hall](https://twitter.com/fenomas), license is MIT.

Uses [Babylon.js](https://www.babylonjs.com/) for 3D rendering.
