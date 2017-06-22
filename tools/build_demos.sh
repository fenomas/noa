#!/bin/sh -x

(
    cd docs/hello-world
    webpack index.js bundle.js
)

(
    cd docs/test
    webpack index.js bundle.js
)


