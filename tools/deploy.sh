#!/bin/sh -x
set -e
git checkout gh-pages
git merge -X theirs master -m "Merge branch 'master' into gh-pages"
webpack examples/hello-world/index.js examples/hello-world/bundle.js
webpack examples/test/index.js examples/test/bundle.js
git commit bundle.js -m "Regenerate bundle.js using deploy.sh"
git checkout master
