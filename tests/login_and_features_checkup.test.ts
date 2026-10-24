import { describe, test, expect, beforeEach } from '@jest/globals';
import { taskRepository } from '../src/services/taskRepository';
import { shareIngestService } from '../src/services/shareIngestService';
import { notificationService } from '../src/services/notificationService';
import { OmniTask, UserProfile } from '../src/types/task';

describe('Login & Feature Checkup Suite', () => {
  beforeEach(async () => {
    await taskRepository.init();
    await taskRepository.logoutUser();
  });

  describe('User Login & Task Migration', () => {
    test('Preserves guest tasks by migrating them upon user login', async () => {
      // 1. In guest mode, save a reminder
      const guestTask: OmniTask = {
        id: `task-guest-test-${Date.now()}`,
        title: 'Call landlord about repair',
        timeLabel: '10:00 AM',
        dateLabel: 'Today',
        status: 'upcoming',
        source: 'WhatsApp',
        excerpt: 'Could you please fix the heating?',
        important: true,
        profile: 'Important',
        createdAt: Date.now(),
        userId: 'local_guest',
      };
      await taskRepository.saveTask(guestTask, 'local_guest');

      const guestTasksBefore = await taskRepository.getAllTasks('local_guest');
      expect(guestTasksBefore.some((t) => t.id === guestTask.id)).toBe(true);

      // 2. User logs in with email
      const userProfile: UserProfile = {
        isLoggedIn: true,
        name: 'Affan Mushtaque',
        email: 'affan.mushtaque@gmail.com',
        avatarInitial: 'AM',
        authProvider: 'google',
      };
      await taskRepository.saveUser(userProfile);

      // 3. Authenticated user tasks should now include the migrated task
      const userTasksAfter = await taskRepository.getAllTasks('affan.mushtaque@gmail.com');
      expect(userTasksAfter.length).toBeGreaterThan(0);
      expect(userTasksAfter.some((t) => t.id === guestTask.id)).toBe(true);
    });

    test('Non-disruptive logout preserves onboarding status and returns to guest mode', async () => {
      const userProfile: UserProfile = {
        isLoggedIn: true,
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        avatarInitial: 'SC',
        authProvider: 'email',
      };
      await taskRepository.saveUser(userProfile);

      await taskRepository.logoutUser();
      const settings = await taskRepository.getSettings();
      expect(settings.user.isLoggedIn).toBe(false);
      expect(settings.hasSeenOnboarding).toBe(true);
      expect(taskRepository.getCurrentUserId()).toBe('local_guest');
    });
  });

  describe('Source Detection Across Ecosystem', () => {
    test('Detects Outlook messages', () => {
      const payload = shareIngestService.normalizePayload(
        'Regarding Q4 budget planning',
        'https://outlook.office.com/mail/id/123',
        undefined,
        'Outlook Meeting',
        'com.microsoft.office.outlook'
      );
      expect(payload?.source).toBe('Outlook');
    });

    test('Detects WhatsApp forwarded texts', () => {
      const payload = shareIngestService.normalizePayload(
        '[12:45, 10/24/2026] Maya: Please send the final draft tomorrow'
      );
      expect(payload?.source).toBe('WhatsApp');
    });

    test('Detects Gmail messages', () => {
      const payload = shareIngestService.normalizePayload(
        'From: alex@gmail.com\nSubject: Flight tickets confirmed'
      );
      expect(payload?.source).toBe('Gmail');
    });

    test('Detects Slack messages', () => {
      const payload = shareIngestService.normalizePayload(
        'Shared from slack.com/archives/C123456: @channel please review the PR'
      );
      expect(payload?.source).toBe('Slack');
    });

    test('Detects Telegram messages', () => {
      const payload = shareIngestService.normalizePayload(
        'Check out t.me/remindly_updates for release notes'
      );
      expect(payload?.source).toBe('Telegram');
    });

    test('Detects Web links with browser caller', () => {
      const payload = shareIngestService.normalizePayload(
        'https://docs.expo.dev/versions/latest/',
        'https://docs.expo.dev/versions/latest/',
        undefined,
        undefined,
        'com.android.chrome'
      );
      expect(payload?.source).toBe('Web');
    });
  });

  describe('Fast Test Notification Trigger', () => {
    test('Can trigger test notification without throwing', async () => {
      const res = await notificationService.sendTestNotification();
      expect(res).toBeTruthy();
    });
  });
});
