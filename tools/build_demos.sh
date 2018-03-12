#!/bin/sh -x

(
    cd docs/hello-world
    webpack
)

(
    cd docs/test
    webpack
)


