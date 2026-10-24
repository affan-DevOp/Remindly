const { withAndroidManifest, withMainApplication } = require('@expo/config-plugins');

function withQuickCapture(config) {
  // 1. Manifest additions
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Ensure permissions
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    const perms = [
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
      'android.permission.POST_NOTIFICATIONS'
    ];
    for (const p of perms) {
      if (!manifest['uses-permission'].some((item) => item.$?.['android:name'] === p)) {
        manifest['uses-permission'].push({ $: { 'android:name': p } });
      }
    }

    // Ensure service and receiver in application
    const app = manifest.application[0];
    app.service = app.service || [];
    if (!app.service.some((s) => s.$?.['android:name'] === 'com.remindly.app.overlay.QuickCaptureService')) {
      app.service.push({
        $: {
          'android:name': 'com.remindly.app.overlay.QuickCaptureService',
          'android:enabled': 'true',
          'android:exported': 'false',
          'android:foregroundServiceType': 'specialUse',
        },
        property: [
          {
            $: {
              'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
              'android:value': 'Floating persistent quick capture overlay allowing users to create reminders from any application.'
            }
          }
        ]
      });
    }

    app.receiver = app.receiver || [];
    if (!app.receiver.some((r) => r.$?.['android:name'] === 'com.remindly.app.overlay.ReminderAlarmReceiver')) {
      app.receiver.push({
        $: {
          'android:name': 'com.remindly.app.overlay.ReminderAlarmReceiver',
          'android:exported': 'false'
        }
      });
    }

    return config;
  });

  // 2. MainApplication package registration
  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    const pkgCall = 'add(com.remindly.app.overlay.QuickCapturePackage())';
    if (!contents.includes(pkgCall)) {
      contents = contents.replace(
        'PackageList(this).packages.apply {',
        'PackageList(this).packages.apply {\n          ' + pkgCall
      );
      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
}

module.exports = withQuickCapture;
