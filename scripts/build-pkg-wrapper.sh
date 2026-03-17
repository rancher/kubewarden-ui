#!/bin/bash

set -e

# Call the original build-pkg script with all arguments
./node_modules/@rancher/shell/scripts/build-pkg.sh "$@"

# Run the post-build patch
node ./scripts/patch-built-extension.js
