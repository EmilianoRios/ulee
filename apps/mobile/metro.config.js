const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.unstable_enableSymlinks = true;
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force Tamagui singleton packages to always resolve to the same physical
// path so Metro never loads two instances of @tamagui/web or @tamagui/core.
const SINGLETON_PACKAGES = [
  '@tamagui/web',
  '@tamagui/core',
  '@tamagui/static',
];

const singletonPaths = {};
for (const pkg of SINGLETON_PACKAGES) {
  try {
    singletonPaths[pkg] = require.resolve(`${pkg}/package.json`, {
      paths: [workspaceRoot],
    }).replace('/package.json', '');
  } catch (_) {}
}

// Resolve react-native-web path for web platform aliasing.
// When metro.config.js defines a custom resolveRequest, it takes full control
// and bypasses Expo's extraNodeModules alias (react-native → react-native-web).
// We must re-implement that alias explicitly here.
let rnWebEntry;
let rnWebDir;
try {
  const rnWebPkg = require.resolve('react-native-web/package.json', {
    paths: [workspaceRoot],
  });
  rnWebDir = path.dirname(rnWebPkg);
  rnWebEntry = require.resolve('react-native-web', { paths: [workspaceRoot] });
} catch (_) {}

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // On web, alias react-native to react-native-web so the native renderer
  // is never bundled. Must be done here because our custom resolveRequest
  // overrides extraNodeModules (Metro's other aliasing mechanism).
  if (platform === 'web' && rnWebEntry) {
    if (moduleName === 'react-native') {
      return { filePath: rnWebEntry, type: 'sourceFile' };
    }
    if (moduleName.startsWith('react-native/') && rnWebDir) {
      const subpath = moduleName.slice('react-native'.length);
      try {
        return {
          filePath: require.resolve(path.join(rnWebDir, subpath)),
          type: 'sourceFile',
        };
      } catch (_) {}
    }
  }

  if (singletonPaths[moduleName]) {
    return {
      filePath: require.resolve(moduleName, { paths: [workspaceRoot] }),
      type: 'sourceFile',
    };
  }
  for (const pkg of SINGLETON_PACKAGES) {
    if (moduleName.startsWith(`${pkg}/`)) {
      const subpath = moduleName.slice(pkg.length);
      try {
        return {
          filePath: require.resolve(`${singletonPaths[pkg]}${subpath}`),
          type: 'sourceFile',
        };
      } catch (_) {}
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
