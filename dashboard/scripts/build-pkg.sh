#!/usr/bin/env bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BASE_DIR="$( cd $SCRIPT_DIR && cd ../.. & pwd)"
SHELL_DIR=$BASE_DIR/node_modules/@rancher/shell/
EXIT_CODE=0
echo "Base: ${BASE_DIR}, 1: ${1}"

VERSION=$(node -p -e "require('./package.json').version")
NAME=${1}-${VERSION}
PKG_DIST=${BASE_DIR}/dist-pkg/${NAME}

echo "Building UI Package $1"
echo "  Package name:    ${NAME}"
echo "  Package version: ${VERSION}"
rm -rf ${PKG_DIST}
mkdir -p ${PKG_DIST}

# Check that the .shell link exists and points to the correct place
if [ -e ".shell" ]; then
  LINK=$(readlink .shell)
  if [ "${LINK}" != "${SHELL_DIR}" ]; then
    echo ".shell symlink exists but does not point to expected location - please check and fix"
    exit -1
  fi
else
  ln -s ${SHELL_DIR} .shell
fi

FILE=index.ts

${BASE_DIR}/node_modules/.bin/vue-cli-service build --name ${NAME} --target lib ${FILE} --dest ${PKG_DIST} --formats umd-min --filename ${NAME}
EXIT_CODE=$?
cp -f ./package.json ${PKG_DIST}/package.json
node ${SCRIPT_DIR}/pkgfile.js ${PKG_DIST}/package.json
rm -rf ${PKG_DIST}/*.bak
rm .shell

exit $EXIT_CODE
