const fs = require('fs');
const path = require('path');

const topicSub = path.resolve(__dirname, '../node_modules/expo-notifications/build/TopicSubscriptionModule.android.js');
if (fs.existsSync(topicSub)) {
  fs.writeFileSync(topicSub, [
    "import { requireOptionalNativeModule } from 'expo-modules-core';",
    "const nativeModule = requireOptionalNativeModule('ExpoTopicSubscriptionModule');",
    "const fallback = {",
    "  addListener: () => ({ remove: () => {} }),",
    "  removeListeners: () => {},",
    "  subscribeToTopicAsync: () => Promise.resolve(null),",
    "  unsubscribeFromTopicAsync: () => Promise.resolve(null),",
    "};",
    "export default nativeModule || fallback;",
    ""
  ].join('\n'), 'utf8');
}

const reqMod = path.resolve(__dirname, '../node_modules/expo-modules-core/build/requireNativeModule.js');
if (fs.existsSync(reqMod)) {
  fs.writeFileSync(reqMod, [
    "import { TurboModuleRegistry } from 'react-native';",
    "import NativeModulesProxy from './NativeModulesProxy';",
    "import { createTurboModuleToExpoProxy } from './TurboModuleToExpoModuleProxy';",
    "import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';",
    "",
    "function createFallbackProxy(moduleName) {",
    "  const fallbackHandler = {",
    "    get(_target, prop) {",
    "      if (prop === '__isFallbackProxy') return true;",
    "      if (prop === 'then') return undefined;",
    "      if (prop === 'addListener') {",
    "        return () => ({ remove: () => {} });",
    "      }",
    "      if (prop === 'removeListener' || prop === 'removeListeners' || prop === 'removeAllListeners') {",
    "        return () => {};",
    "      }",
    "      return (...args) => {",
    "        return Promise.resolve(null);",
    "      };",
    "    }",
    "  };",
    "  return new Proxy({}, fallbackHandler);",
    "}",
    "",
    "export function requireNativeModule(moduleName) {",
    "  const nativeModule = requireOptionalNativeModule(moduleName);",
    "  if (!nativeModule) {",
    "    console.warn(`[expo-modules-core] Native module '${moduleName}' not found. Using safe fallback for Expo Go.`);",
    "    return createFallbackProxy(moduleName);",
    "  }",
    "  return nativeModule;",
    "}",
    "",
    "export function requireOptionalNativeModule(moduleName) {",
    "  ensureNativeModulesAreInstalled();",
    "  try {",
    "    return globalThis.expo?.modules?.[moduleName] ?? NativeModulesProxy[moduleName] ?? createTurboModuleToExpoProxy(TurboModuleRegistry.get(moduleName) ?? null, moduleName) ?? null;",
    "  } catch (e) {",
    "    const error = e;",
    "    console.warn(`An error occurred while requiring the '${moduleName}' module: ${error.message}`);",
    "    return null;",
    "  }",
    "}",
    ""
  ].join('\n'), 'utf8');
}
console.log('Patched Expo modules successfully');
