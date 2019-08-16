
# noa-engine

An experimental voxel engine.

Example games:
 * [Minecraft Classic](https://classic.minecraft.net/) - a game from Mojang **(!)** built on this engine
 * [noa-lt](http://andyhall.github.io/noa-lt/) - game world containing "slides" for a talk I gave on voxels in JS
 * [noa-examples](https://github.com/andyhall/noa-examples) - repo with minimal hello-world and testbed game worlds
 * [old testbed](https://andyhall.github.io/noa-testbed/) - outdated, but colorful

----

## Usage

The easiest way to start building a game with `noa` is to clone the [examples](https://github.com/andyhall/noa-examples) repo and start hacking on the code there. The comments in the `hello-world` example source walk through how to instantiate the engine, define world geometry, and so forth.

To hack on the `noa` engine itself, you'll want to clone this repo alongside your game content, and make the latter depend on the former with a local file dependency (i.e. `file:../noa` in `package.json`). Note however that webpack is picky about this - see the [examples readme](https://github.com/andyhall/noa-examples) for details.


## Docs

See the [API reference](API.md) for an overview of engine classes and methods.
Docs are evolving though, some details are only documented in source comments.
Documentation PRs are welcome!


## Status, contributing, etc.

This library is under active development and contributions are welcome!
If you have a nontrivial feature in mind, probably best to open a discussion issue
first though. The goal of this module is minimally only do voxel-specific things, 
and otherwise to stay out of your way.

> Please note that all feature work is in the `develop` branch; please send any PRs against that branch!

For code style/formatting, the repo includes config files for [eslint](https://eslint.org/) and [js-beautify](https://github.com/beautify-web/js-beautify), which are both dev dependencies. If you use VSCode for editing, here are the extensions I use to run them automatically: [beautify](https://marketplace.visualstudio.com/items?itemName=HookyQR.beautify), [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).



## Change logs

See [HISTORY.md](HISTORY.md) for changes and migration info from each version.

 * **migration note**: From noa `v0.26`, game clients should declare a dependency on `@babylon/core`, rather than manually loading babylon.js and leaving it in global scope. This allows tree-shaking to happen, greatly reducing (production) bundle sizes for typical games. For sample code and configs see [noa-examples](https://github.com/andyhall/noa-examples).

----

## Credits

Made with 🍺 by [Andy Hall](https://twitter.com/fenomas), license is MIT.


