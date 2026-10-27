import React from 'react';
import RemindlyDesignReference, { Props } from '../src/components/RemindlyDesignReference';
import { DEFAULT_USER } from '../src/types/task';

const { create, act } = require('react-test-renderer');
const mockOAuth = jest.fn();
const mockSignIn = { create: jest.fn(), prepareFirstFactor: jest.fn(), attemptFirstFactor: jest.fn() };
const mockSignUp = { create: jest.fn(), prepareEmailAddressVerification: jest.fn(), attemptEmailAddressVerification: jest.fn() };
const mockSetActive = jest.fn();

jest.mock('react-native', () => ({
  ...jest.requireActual('./mocks/react-native'),
  View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView',
  TextInput: 'TextInput', Switch: 'Switch', Modal: 'Modal', ActivityIndicator: 'ActivityIndicator',
  KeyboardAvoidingView: 'KeyboardAvoidingView', StatusBar: 'StatusBar',
  useWindowDimensions: () => ({ width: 390, height: 844 }),
  Alert: { alert: jest.fn() },
  Animated: {
    Value: class { setValue() {} }, View: 'AnimatedView',
    timing: () => ({}), parallel: () => ({ start: (callback?: () => void) => callback?.() }),
  },
}));
jest.mock('expo-font', () => ({ useFonts: () => [false] }));
jest.mock('@expo-google-fonts/plus-jakarta-sans', () => ({}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('expo-blur', () => ({ BlurTargetView: 'BlurTargetView', BlurView: 'BlurView' }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('expo-web-browser', () => ({ warmUpAsync: async () => {}, coolDownAsync: async () => {} }));
jest.mock('expo-auth-session', () => ({ makeRedirectUri: () => 'remindly://oauth-native-callback' }));
jest.mock('expo-constants', () => ({ __esModule: true, default: {}, ExecutionEnvironment: { StoreClient: 'storeClient' } }));
jest.mock('@clerk/clerk-expo', () => ({
  useOAuth: () => ({ startOAuthFlow: mockOAuth }),
  useSignIn: () => ({ isLoaded: true, signIn: mockSignIn, setActive: mockSetActive }),
  useSignUp: () => ({ isLoaded: true, signUp: mockSignUp }),
}));
jest.mock('lucide-react-native', () => new Proxy({}, { get: (_target, name) => name === '__esModule' ? true : 'Icon' }));
jest.mock('react-native-svg', () => new Proxy({}, { get: (_target, name) => name === '__esModule' ? true : 'Svg' }));

let renderer: any;
const textOf = (node: any): string => typeof node === 'string' ? node : (node?.children || []).map(textOf).join(' ');
const button = (label: string) => renderer.root.findAllByType('Pressable').find((node: any) => node.props.accessibilityLabel === label || textOf(node).trim() === label);
const press = async (label: string) => {
  const target = button(label);
  if (!target) throw new Error(`Button missing: ${label}`);
  await act(async () => { await target.props.onPress(); });
};
async function render(props: Props = {}) {
  await act(async () => { renderer = create(React.createElement(RemindlyDesignReference, { initialTasks: [], ...props })); });
}
async function typeTitle(value: string) {
  const input = renderer.root.findAllByType('TextInput').find((node: any) => node.props.placeholder === 'What do you need to remember?');
  await act(async () => input.props.onChangeText(value));
}
const sampleTask = (overrides: any = {}) => ({
  id: 'ui-task', title: 'Check buttons', source: 'Manual', status: 'upcoming',
  profile: 'Standard', excerpt: 'Saved context', createdAt: Date.now(),
  dateLabel: 'Today', timeLabel: '11:30 PM', ...overrides,
});

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  mockOAuth.mockResolvedValue({ authSessionResult: { type: 'cancel' } });
});
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); });

test('an explicitly empty repository shows no sample reminders and accepts updates back to empty', async () => {
  await render();
  expect(textOf(renderer.toJSON())).not.toContain('Review supplier invoice');
  const task: any = { id: 'one', title: 'Only task', source: 'Manual', status: 'inbox', profile: 'Simple', excerpt: '', createdAt: Date.now() };
  await act(async () => renderer.update(React.createElement(RemindlyDesignReference, { initialTasks: [task] })));
  await press('Inbox');
  expect(textOf(renderer.toJSON())).toContain('Only task');
  await act(async () => renderer.update(React.createElement(RemindlyDesignReference, { initialTasks: [] })));
  expect(textOf(renderer.toJSON())).not.toContain('Only task');
});

test('inbox capture saves without a deadline and waits for persistence', async () => {
  let finish!: () => void;
  const saved = jest.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
  await render({ onCaptureSaved: saved });
  await press('Inbox');
  await press('Capture something');
  await typeTitle('Remember this context');
  const save = renderer.root.findAllByType('Pressable').find((node: any) => node.props.disabled === false && textOf(node).includes('Save'));
  await act(async () => { void save.props.onPress(); });
  expect(saved).toHaveBeenCalledWith(expect.objectContaining({ title: 'Remember this context', status: 'inbox', dueAtUtc: undefined }));
  expect(button('Close capture sheet')).toBeDefined();
  await act(async () => { finish(); });
  expect(button('Close capture sheet')).toBeUndefined();
});

test('failed saves retain the draft and show an error', async () => {
  await render({ onCaptureSaved: async () => { throw new Error('Storage full'); } });
  await press('Quick capture reminder');
  await typeTitle('Keep this draft');
  // Two Inbox controls exist: use the date-mode pill inside the capture sheet.
  const pill = renderer.root.findAllByType('Pressable').find((node: any) => !node.props.accessibilityLabel && textOf(node).trim() === 'Inbox');
  await act(async () => pill.props.onPress());
  const save = renderer.root.findAllByType('Pressable').find((node: any) => textOf(node).includes('Save') && node.props.disabled === false);
  await act(async () => save.props.onPress());
  expect(button('Close capture sheet')).toBeDefined();
  expect(renderer.root.findAllByType('TextInput').some((node: any) => node.props.value === 'Keep this draft')).toBe(true);
  expect(textOf(renderer.toJSON())).toContain('Could not save reminder');
});

test('a second share reopens with fresh content and ordinary capture clears the source', async () => {
  await render({ initialSharedText: 'First shared message', initialShareRevision: 1 });
  expect(renderer.root.findAllByType('TextInput').some((node: any) => node.props.value === 'First shared message')).toBe(true);
  await act(async () => renderer.update(React.createElement(RemindlyDesignReference, { initialTasks: [], initialSharedText: 'Second shared message', initialShareRevision: 2 })));
  expect(renderer.root.findAllByType('TextInput').some((node: any) => node.props.value === 'Second shared message')).toBe(true);
  await press('Close capture sheet');
  await press('Discard reminder');
  await press('Quick capture reminder');
  expect(renderer.root.findAllByType('TextInput').some((node: any) => node.props.value === '')).toBe(true);
});

test('cancelled Google sign-in never calls the local login callback', async () => {
  const login = jest.fn();
  await render({ initialView: 'onboarding', onUserLogin: login });
  await press('Continue with Google');
  expect(mockOAuth).toHaveBeenCalled();
  expect(login).not.toHaveBeenCalled();
  expect(button('Explore the app first')).toBeDefined();
});

test('guest entry retains the actual guest identity', async () => {
  const login = jest.fn();
  await render({ initialView: 'onboarding', onUserLogin: login });
  await press('Explore the app first');
  expect(login).toHaveBeenCalledWith(DEFAULT_USER);
  expect(button('Explore the app first')).toBeUndefined();
});

test('email sign-in verifies a code before activating a session', async () => {
  mockSignIn.create.mockResolvedValue({ supportedFirstFactors: [{ strategy: 'email_code', emailAddressId: 'email-id' }] });
  mockSignIn.attemptFirstFactor.mockResolvedValue({ status: 'complete', createdSessionId: 'verified-session' });
  const login = jest.fn();
  await render({ initialView: 'onboarding', onUserLogin: login });
  await press('Sign in with Email or Account');
  const email = renderer.root.findAllByType('TextInput').find((node: any) => node.props.placeholder === 'e.g. maya@example.com');
  await act(async () => email.props.onChangeText('tester@example.com'));
  await press('Sign In and Keep Reminders');
  expect(mockSignIn.prepareFirstFactor).toHaveBeenCalledWith({ strategy: 'email_code', emailAddressId: 'email-id' });
  expect(mockSetActive).not.toHaveBeenCalled();
  expect(login).not.toHaveBeenCalled();
  const code = renderer.root.findAllByType('TextInput').find((node: any) => node.props.placeholder === 'Enter your email code');
  await act(async () => code.props.onChangeText('123456'));
  await press('Sign In and Keep Reminders');
  expect(mockSetActive).toHaveBeenCalledWith({ session: 'verified-session' });
});

test('complete waits for persistence and Undo restores the original inbox state', async () => {
  const task = sampleTask({ status: 'inbox', dateLabel: 'Inbox', timeLabel: 'No deadline' });
  const completed = jest.fn();
  const restored = jest.fn();
  await render({ initialTasks: [task], notificationTaskId: task.id, onTaskCompleted: completed, onTaskRestored: restored });
  await press('Mark done');
  expect(completed).toHaveBeenCalledWith(task.id);
  await press('Undo');
  expect(restored).toHaveBeenCalledWith(expect.objectContaining({ status: 'inbox' }));
});

test('a failed completion leaves the task active and reports the error', async () => {
  const task = sampleTask();
  await render({ initialTasks: [task], notificationTaskId: task.id, onTaskCompleted: async () => { throw new Error('Write failed'); } });
  await press('Mark done');
  expect(button('Mark done')).toBeDefined();
  expect(textOf(renderer.toJSON())).toContain('Could not save changes');
});

test('delete confirmation supports cancel, persisted delete, and Undo', async () => {
  const task = sampleTask();
  const deleted = jest.fn();
  const save = jest.fn();
  await render({ initialTasks: [task], notificationTaskId: task.id, onTaskDeleted: deleted, onCaptureSaved: save });
  await press('Delete reminder');
  await press('Keep reminder');
  expect(deleted).not.toHaveBeenCalled();
  await press('Delete reminder');
  // Both management and dialog share the label: select the destructive confirmation.
  const confirm = renderer.root.findAllByType('Pressable').filter((node: any) => node.props.accessibilityLabel === 'Delete reminder').at(-1);
  await act(async () => confirm.props.onPress());
  expect(deleted).toHaveBeenCalledWith(task.id);
  await press('Undo');
  expect(save).toHaveBeenCalledWith(task);
  expect(button('Open reminder: Check buttons')).toBeDefined();
});

test('edit title saves and snooze dispatches the selected duration', async () => {
  const task = sampleTask();
  const save = jest.fn();
  const snooze = jest.fn();
  await render({ initialTasks: [task], notificationTaskId: task.id, onCaptureSaved: save, onTaskSnoozed: snooze });
  await press('Edit reminder');
  const title = renderer.root.findAllByType('TextInput').find((node: any) => node.props.placeholder === 'Reminder title...');
  await act(async () => title.props.onChangeText('Updated title'));
  await press('Save changes');
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated title', id: task.id }));
  await press('+1 hour');
  expect(snooze).toHaveBeenCalledWith(task.id, 60);
});

test('calendar Add preserves the selected week and date', async () => {
  const save = jest.fn();
  await render({ onCaptureSaved: save });
  await press('Calendar');
  await press('Next week');
  await press('Add reminder');
  await typeTitle('Next Monday');
  const target = renderer.root.findAllByType('Pressable').find((node: any) => textOf(node).includes('Save') && node.props.disabled === false);
  await act(async () => target.props.onPress());
  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() - (nextMonday.getDay() + 6) % 7 + 7);
  const iso = `${nextMonday.getFullYear()}-${String(nextMonday.getMonth() + 1).padStart(2, '0')}-${String(nextMonday.getDate()).padStart(2, '0')}`;
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ dueLocalDate: iso }));
});

test('all notification preference switches call their persistence handlers', async () => {
  const callbacks = {
    onQuietHoursChange: jest.fn(), onNotificationsSoundChange: jest.fn(),
    onNotificationsVibrationChange: jest.fn(), onPersistentFollowupsChange: jest.fn(),
    onLockScreenPrivacyChange: jest.fn(),
  };
  await render(callbacks);
  await press('Settings');
  for (const label of ['Quiet hours', 'Notification sounds', 'Vibration feedback', 'Persistent follow-ups', 'Lock screen privacy']) {
    const toggle = renderer.root.findAllByType('Switch').find((node: any) => node.props.accessibilityLabel === label);
    await act(async () => toggle.props.onValueChange(!toggle.props.value));
  }
  for (const callback of Object.values(callbacks)) expect(callback).toHaveBeenCalledTimes(1);
});

test('default time cycles correctly and is used for tomorrow capture', async () => {
  const save = jest.fn();
  const updateTime = jest.fn();
  await render({ onCaptureSaved: save, initialSettings: { dateOnlyTime: '09:00' }, onDateOnlyTimeChange: updateTime });
  await press('Settings');
  await press('Change date-only reminder time');
  expect(updateTime).toHaveBeenCalledWith('10:00 AM');
  await press('Quick capture reminder');
  await typeTitle('Default time reminder');
  await press('Tomorrow');
  const target = renderer.root.findAllByType('Pressable').find((node: any) => textOf(node).includes('Save') && node.props.disabled === false);
  await act(async () => target.props.onPress());
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ dueLocalTime: '10:00' }));
});

test('failed settings persistence rolls the switch back and reports the failure', async () => {
  await render({ onQuietHoursChange: async () => { throw new Error('Write failed'); } });
  await press('Settings');
  const toggle = () => renderer.root.findAllByType('Switch').find((node: any) => node.props.accessibilityLabel === 'Quiet hours');
  await act(async () => toggle().props.onValueChange(false));
  expect(toggle().props.value).toBe(true);
  expect(textOf(renderer.toJSON())).toContain('Could not save this setting');
});

test('rescheduling an inbox reminder keeps its identity and original source', async () => {
  const task = sampleTask({ status: 'inbox', dateLabel: 'Inbox', timeLabel: 'No deadline', source: 'WhatsApp', sourceUrl: 'https://example.com/message' });
  const save = jest.fn();
  await render({ initialTasks: [task], notificationTaskId: task.id, onCaptureSaved: save });
  await press('Change reminder date');
  await press('Tomorrow');
  const target = renderer.root.findAllByType('Pressable').find((node: any) => textOf(node).includes('Save') && node.props.disabled === false);
  await act(async () => target.props.onPress());
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ id: task.id, status: 'upcoming', source: 'WhatsApp', excerpt: task.excerpt, sourceUrl: task.sourceUrl }));
});

test('shared natural-language deadlines populate the active capture sheet', async () => {
  const save = jest.fn();
  await render({ initialSharedText: 'Send the contract tomorrow at 2pm', initialShareRevision: 1, onCaptureSaved: save });
  const target = renderer.root.findAllByType('Pressable').find((node: any) => textOf(node).includes('Save') && node.props.disabled === false);
  await act(async () => target.props.onPress());
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const iso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ dueLocalDate: iso, dueLocalTime: '14:00' }));
});

test('minute step buttons carry into the next hour', async () => {
  const save = jest.fn();
  const task = sampleTask({ status: 'inbox' });
  await render({ initialTasks: [task], notificationTaskId: task.id, onCaptureSaved: save });
  await press('Change reminder time');
  await press('Tomorrow');
  const minute = renderer.root.findAllByType('TextInput').find((node: any) => node.props.keyboardType === 'number-pad');
  await act(async () => minute.props.onChangeText('58'));
  await press('+5m');
  const target = renderer.root.findAllByType('Pressable').find((node: any) => textOf(node).includes('Save') && node.props.disabled === false);
  await act(async () => target.props.onPress());
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ dueLocalTime: '10:03' }));
});

test('failed Google sign-in does not grant a local account', async () => {
  const login = jest.fn(); mockOAuth.mockRejectedValue(new Error('Offline'));
  await render({ initialView: 'onboarding', onUserLogin: login });
  await press('Continue with Google');
  expect(login).not.toHaveBeenCalled();
  expect(button('Explore the app first')).toBeDefined();
});

test('signing out closes the account sheet without reopening onboarding', async () => {
  const logout = jest.fn();
  await render({ currentUser: { isLoggedIn: true, name: 'Tester', email: 'tester@example.com', avatarInitial: 'T', authProvider: 'email' }, onUserLogout: logout });
  await press('Account & Profile');
  const target = renderer.root.findAllByType('Pressable').find((node: any) => textOf(node).includes('Sign out of Remindly'));
  await act(async () => target.props.onPress());
  expect(logout).toHaveBeenCalledTimes(1);
  expect(button('Close account sheet')).toBeUndefined();
  expect(button('Explore the app first')).toBeUndefined();
});

test('switching accounts waits for sign-out before opening another sign-in', async () => {
  let finish!: () => void;
  const logout = jest.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
  await render({ currentUser: { isLoggedIn: true, name: 'Tester', email: 'tester@example.com', avatarInitial: 'T', authProvider: 'google' }, onUserLogout: logout });
  await press('Account & Profile');
  const target = renderer.root.findAllByType('Pressable').find((node: any) => textOf(node).includes('Switch Account / Connect Google'));
  let switching!: Promise<void>;
  await act(async () => { switching = target.props.onPress(); });
  expect(logout).toHaveBeenCalledTimes(1);
  expect(button('Continue with Google')).toBeUndefined();
  await act(async () => { finish(); await switching; });
  expect(button('Continue with Google')).toBeDefined();
});

test('failed account-switch sign-out retains the current account sheet', async () => {
  await render({ currentUser: { isLoggedIn: true, name: 'Tester', email: 'tester@example.com', avatarInitial: 'T', authProvider: 'google' }, onUserLogout: async () => { throw new Error('Offline'); } });
  await press('Account & Profile');
  const target = renderer.root.findAllByType('Pressable').find((node: any) => textOf(node).includes('Switch Account / Connect Google'));
  await act(async () => target.props.onPress());
  expect(button('Continue with Google')).toBeUndefined();
  expect(button('Close account sheet')).toBeDefined();
  expect(textOf(renderer.toJSON())).toContain('Could not switch accounts');
});
