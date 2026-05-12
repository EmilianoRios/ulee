const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const pnpmStore = path.resolve(workspaceRoot, 'node_modules/.pnpm');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.unstable_enableSymlinks = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Expose transitive deps from pnpm virtual store so Metro can resolve them.
// Only indexes Tamagui-related packages to avoid performance issues.
if (fs.existsSync(pnpmStore)) {
  const tamaguiStorePkgs = fs.readdirSync(pnpmStore).filter(
    p => p.startsWith('@tamagui+') || p.startsWith('tamagui@')
  );
  for (const pkg of tamaguiStorePkgs) {
    const pkgNodeModules = path.resolve(pnpmStore, pkg, 'node_modules');
    if (fs.existsSync(pkgNodeModules)) {
      config.resolver.nodeModulesPaths.push(pkgNodeModules);
    }
  }
}

module.exports = config;
