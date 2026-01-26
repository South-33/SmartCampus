const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable modern package exports (needed for @convex-dev/auth/react)
config.resolver.unstable_enablePackageExports = true;

// Ensure we handle pnpm symlinks correctly if needed
config.resolver.nodeModulesPaths = [
  require('path').resolve(__dirname, 'node_modules'),
];

module.exports = config;
