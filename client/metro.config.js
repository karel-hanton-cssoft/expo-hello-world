const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Add repository root so Metro can resolve files outside client/
config.watchFolders = config.watchFolders || [];
if (!config.watchFolders.includes(repoRoot)) {
  config.watchFolders.push(repoRoot);
}

// Ensure resolver includes node_modules from repo root, helpful for monorepos
config.resolver = config.resolver || {};
config.resolver.nodeModulesPaths = config.resolver.nodeModulesPaths || [];
const repoNodeModules = path.resolve(repoRoot, 'node_modules');
if (!config.resolver.nodeModulesPaths.includes(repoNodeModules)) {
  config.resolver.nodeModulesPaths.push(repoNodeModules);
}

module.exports = config;
