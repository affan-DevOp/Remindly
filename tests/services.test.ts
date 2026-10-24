import { describe, test, expect, beforeEach } from '@jest/globals';
import { shareIngestService } from '../src/services/shareIngestService';
import { taskRepository, INITIAL_SEED_TASKS } from '../src/services/taskRepository';
import { OmniTask } from '../src/types/task';

describe('Remindly Services Integration', () => {
  describe('ShareIngestService', () => {
    test('Extracts HTTP/HTTPS URL from raw shared text while preserving excerpt', () => {
      const rawText = 'Review contract proposal https://figma.com/file/123 before lunch';
      const normalized = shareIngestService.normalizePayload(rawText);

      expect(normalized).not.toBeNull();
      expect(normalized?.sourceUrl).toBe('https://figma.com/file/123');
      expect(normalized?.rawText).toBe(rawText);
      expect(normalized?.suggestedTitle).toBe('Review contract proposal https://figma.com/file/123 before lunch');
    });

    test('Infers WhatsApp source from timestamps in forwarded text', () => {
      const rawText = '[23/10/26, 8:40 PM] Aarav: Please make sure the revised agreement is reviewed';
      const normalized = shareIngestService.normalizePayload(rawText);

      expect(normalized).not.toBeNull();
      expect(normalized?.source).toBe('WhatsApp');
      expect(normalized?.suggestedTitle).toContain('Aarav: Please make sure');
    });

    test('Infers Slack source from slack-specific patterns', () => {
      const rawText = 'channel: #eng-sync Can you share the latest prototype specs?';
      const normalized = shareIngestService.normalizePayload(rawText);

      expect(normalized).not.toBeNull();
      expect(normalized?.source).toBe('Slack');
    });

    test('Deduplicates repeated share intents within timestamp window', () => {
      const rawText = 'Unique task ' + Date.now();
      const payload1 = shareIngestService.normalizePayload(rawText)!;

      const firstProcess = shareIngestService.shouldProcess(payload1.ingestKey);
      const secondProcess = shareIngestService.shouldProcess(payload1.ingestKey);

      expect(firstProcess).toBe(true);
      expect(secondProcess).toBe(false);
    });

    test('Returns null for empty text and empty URL', () => {
      expect(shareIngestService.normalizePayload('')).toBeNull();
      expect(shareIngestService.normalizePayload('   ')).toBeNull();
    });
  });

  describe('TaskRepository (Persistent SQLite & Memory Mode)', () => {
    test('Seeds initial tasks and loads all tasks', async () => {
      const tasks = await taskRepository.getAllTasks();
      expect(tasks.length).toBeGreaterThanOrEqual(INITIAL_SEED_TASKS.length);
      const overdueTask = tasks.find((t) => t.id === 'task-101');
      expect(overdueTask).toBeDefined();
      expect(overdueTask?.status).toBe('overdue');
    });

    test('Creates and persists a new task', async () => {
      const newTask: OmniTask = {
        id: 'test-task-' + Date.now(),
        title: 'Complete product review',
        timeLabel: '4:00 PM',
        dateLabel: 'Today',
        status: 'upcoming',
        source: 'Slack',
        excerpt: 'Product review call with team',
        profile: 'Standard',
        createdAt: Date.now(),
      };

      await taskRepository.saveTask(newTask);
      const all = await taskRepository.getAllTasks();
      const found = all.find((t) => t.id === newTask.id);
      expect(found).toBeDefined();
      expect(found?.title).toBe('Complete product review');
    });

    test('Marks task as done', async () => {
      const taskId = 'task-102';
      await taskRepository.completeTask(taskId);
      const all = await taskRepository.getAllTasks();
      const found = all.find((t) => t.id === taskId);
      expect(found?.status).toBe('done');
      expect(found?.completedAt).toBeDefined();
    });

    test('Snoozes task with new time label', async () => {
      const taskId = 'task-103';
      await taskRepository.snoozeTask(taskId, 15);
      const all = await taskRepository.getAllTasks();
      const found = all.find((t) => t.id === taskId);
      expect(found?.status).toBe('upcoming');
      expect(found?.timeLabel).toBe('In 15 min');
    });
  });
});
