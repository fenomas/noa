
# noa-engine

An experimental voxel engine.

Example games:
 * [Minecraft Classic](https://classic.minecraft.net/) - a game from Mojang *(!!)* made with this engine
 * [noa-lt](http://andyhall.github.io/noa-lt/) - Game world containing "slides" for a lightning talk I gave on voxels in js
 * [hello-world](https://andyhall.github.io/noa-examples/hello-world/) - bare minimum world, suitable as a starting point to build something out of ([source](https://github.com/andyhall/noa-examples))
 * [testbed](https://andyhall.github.io/noa-examples/test/) - sample world implementing most of the engine's features ([source](https://github.com/andyhall/noa-examples))
 * [old testbed](https://andyhall.github.io/noa-testbed/) - outdated, but colorful

----

## Usage

The easiest way to start building a game with `noa` is to clone the [examples](https://github.com/andyhall/noa-examples) repo and start hacking on the code there. The comments in the `hello-world` example source walk through how to instantiate the engine, build a world, and so forth.

To hack on the `noa` engine itself, you'll want to clone this repo alongside your game content, and make the latter depend on the former with a local file dependency (i.e. `file:../noa` or similar in your package.json). Note however that webpack is picky about this - see the [examples readme](https://github.com/andyhall/noa-examples) for details.


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

See [HISTORY.md](HISTORY.md) for new features, breaking changes, and migration info from each version.


----

## Credits

Made by [@fenomas](https://twitter.com/fenomas), license is MIT.


