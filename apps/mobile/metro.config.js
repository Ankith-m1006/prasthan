// Metro: let the app import the shared contract (types only) and the synthetic seed JSON from the repo root.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const config = getDefaultConfig(__dirname);
config.watchFolders = [path.join(root, 'shared'), path.join(root, 'seed')];
config.resolver.nodeModulesPaths = [path.join(__dirname, 'node_modules')];
module.exports = config;
