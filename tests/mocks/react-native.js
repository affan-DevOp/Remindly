const listeners = [];

module.exports = {
  Platform: {
    OS: 'android',
    select: (obj) => obj.android || obj.default,
  },
  StyleSheet: {
    create: (obj) => obj,
    absoluteFill: {},
    flatten: (obj) => (Array.isArray(obj) ? Object.assign({}, ...obj.filter(Boolean)) : obj || {}),
  },
  BackHandler: {
    addEventListener: (event, handler) => {
      listeners.push({ event, handler });
      return {
        remove: () => {
          const idx = listeners.findIndex((l) => l.handler === handler);
          if (idx >= 0) listeners.splice(idx, 1);
        },
      };
    },
    exitApp: () => {},
    // Test helper to simulate hardware back press
    _triggerBackPress: () => {
      for (let i = listeners.length - 1; i >= 0; i--) {
        if (listeners[i].event === 'hardwareBackPress') {
          const handled = listeners[i].handler();
          if (handled) return true;
        }
      }
      return false;
    },
    _getListeners: () => [...listeners],
    _clear: () => {
      listeners.length = 0;
    },
  },
  AppState: {
    addEventListener: () => ({ remove: () => {} }),
  },
};
