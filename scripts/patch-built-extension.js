#!/usr/bin/env node

/**
 * Post-build patch for Kubewarden extension
 * Patches the built UMD file to support both $extension and $plugin
 * This ensures compatibility with Rancher 2.12.7 which only has $plugin
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist-pkg');
const pkg = require('../pkg/kubewarden/package.json');
const version = pkg.version;
const filename = `kubewarden-${version}.umd.min.js`;
const filePath = path.join(DIST_DIR, `kubewarden-${version}`, filename);

console.log('[Kubewarden] Post-build patch: Fixing $extension compatibility...');

if (!fs.existsSync(filePath)) {
  console.error(`[Kubewarden] ERROR: Built file not found at ${filePath}`);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Replace this.$extension?.getDynamic with (this.$extension||this.$plugin)?.getDynamic
// This makes the bundled code work in both old Rancher (with $plugin) and new Rancher (with $extension)
const before = content.length;
content = content.replace(
  /this\.\$extension\?\./g,
  '(this.$extension||this.$plugin)?.'
);
const after = content.length;

if (before === after) {
  console.log('[Kubewarden] No $extension references found to patch (this is unusual)');
} else {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[Kubewarden] ✓ Patched $extension references for backward compatibility');
}

console.log('[Kubewarden] Post-build patch complete');
