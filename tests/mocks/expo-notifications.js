const scheduledList = [];

module.exports = {
  setNotificationHandler: () => {},
  setNotificationChannelAsync: async () => {},
  setNotificationCategoryAsync: async () => {},
  getPermissionsAsync: async () => ({ status: 'granted' }),
  requestPermissionsAsync: async () => ({ status: 'granted' }),
  scheduleNotificationAsync: async (req) => {
    const id = req?.identifier || 'test-id-' + Math.random().toString(36).slice(2);
    const existing = scheduledList.find((item) => item.identifier === id);
    if (!existing) {
      scheduledList.push({ identifier: id, content: req?.content, trigger: req?.trigger });
    }
    return id;
  },
  cancelAllScheduledNotificationsAsync: async () => { scheduledList.length = 0; },
  getAllScheduledNotificationsAsync: async () => [...scheduledList],
  cancelScheduledNotificationAsync: async (id) => {
    const idx = scheduledList.findIndex((item) => item.identifier === id);
    if (idx >= 0) scheduledList.splice(idx, 1);
  },
  AndroidImportance: {
    HIGH: 4,
    MAX: 5,
    DEFAULT: 3,
  },
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
    DATE: 'date',
  },
};
