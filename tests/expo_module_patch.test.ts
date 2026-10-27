const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('postinstall preserves missing-native-module detection used by font and asset loading', () => {
  const outputs = new Map<string, string>();
  const scriptDirectory = path.resolve('scripts');
  vm.runInNewContext(fs.readFileSync(path.join(scriptDirectory, 'patch-expo-modules.js'), 'utf8'), {
    __dirname: scriptDirectory,
    require: (name: string) => name === 'fs' ? {
      existsSync: () => true,
      writeFileSync: (filename: string, value: string) => outputs.set(filename, value),
    } : require(name),
    console: { log: () => {} },
  });
  const generated = outputs.get(path.resolve(scriptDirectory, '../node_modules/expo-modules-core/build/requireNativeModule.js'))!;
  expect(generated).toBeTruthy();
  const nativeFontModule = { loadAsync: () => {} };
  const context: any = {
    ensureNativeModulesAreInstalled: () => {},
    NativeModulesProxy: {},
    TurboModuleRegistry: { get: () => null },
    createTurboModuleToExpoProxy: () => null,
    expo: { modules: { ExpoFontLoader: nativeFontModule } },
    console,
  };
  vm.runInNewContext(generated.replace(/^import .*;\r?\n/gm, '').replace(/export function /g, 'function '), context);
  expect(context.requireOptionalNativeModule('ExpoGo')).toBeNull();
  expect(() => context.requireNativeModule('MissingModule')).toThrow("Cannot find native module 'MissingModule'");
  expect(context.requireNativeModule('ExpoFontLoader')).toBe(nativeFontModule);
});
