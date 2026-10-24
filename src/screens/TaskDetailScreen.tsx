import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Archive,
  Bell,
  RefreshCw,
  ExternalLink,
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { TaskFixture, BUILTIN_PROFILES } from '../mocks/phase1Fixtures';
import { TemporalChip } from '../components/TemporalChip';
import { SourceProvenanceCard } from '../components/SourceProvenanceCard';
import { CascadeTimelinePreview } from '../components/CascadeTimelinePreview';

export interface TaskDetailScreenProps {
  task: TaskFixture;
  onBack: () => void;
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string, minutes: number) => void;
  onArchive: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({
  task,
  onBack,
  onComplete,
  onSnooze,
  onArchive,
  onDelete,
}) => {
  const { colors, typography, spacing, radii, isDark } = useTheme();

  const isCompleted = task.status === 'completed';
  const profile = BUILTIN_PROFILES.find((p) => p.id === task.reminderProfileId) || BUILTIN_PROFILES[1];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgCanvas }]}
      contentContainerStyle={[styles.content, { padding: spacing.base, paddingBottom: spacing.xxxl }]}
    >
      {/* Top Navigation Bar */}
      <View style={[styles.topBar, { marginBottom: spacing.md }]}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to task list"
        >
          <ArrowLeft size={20} color={colors.textPrimary} strokeWidth={1.75} />
        </TouchableOpacity>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.iconAction, { marginRight: spacing.sm }]}
            onPress={() => onArchive(task.id)}
            accessibilityRole="button"
            accessibilityLabel="Archive task"
          >
            <Archive size={18} color={colors.textMuted} strokeWidth={1.75} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconAction}
            onPress={() => onDelete(task.id)}
            accessibilityRole="button"
            accessibilityLabel="Delete task"
          >
            <Trash2 size={18} color={colors.status.overdue.text} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Task Title */}
      <Text
        style={[
          styles.title,
          {
            fontFamily: typography.fonts.displayBold,
            color: colors.textPrimary,
            fontSize: typography.sizes.xl,
            lineHeight: typography.lineHeights.xl,
          },
        ]}
      >
        {task.title}
      </Text>

      {/* Status & Deadline Badges */}
      <View style={[styles.badgeRow, { marginTop: spacing.sm, marginBottom: spacing.lg }]}>
        <TemporalChip
          label={task.status.toUpperCase()}
          tier={isCompleted ? 'completed' : task.status === 'inbox' ? 'neutral' : 'scheduled'}
          style={{ marginRight: spacing.xs }}
        />

        {task.dueLocalTime ? (
          <TemporalChip
            label={`${task.dueLocalDate || 'Today'} ${task.dueLocalTime} ${task.dueTimezone.split('/')[1] || ''}`}
            tier="neutral"
          />
        ) : null}
      </View>

      {/* Fast Action Triggers */}
      <View style={[styles.fastActionRow, { marginBottom: spacing.lg }]}>
        <TouchableOpacity
          style={[
            styles.primaryActionBtn,
            {
              backgroundColor: isCompleted ? colors.bgMuted : colors.accentPrimary,
              borderRadius: radii.sm,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.base,
            },
          ]}
          onPress={() => onComplete(task.id)}
        >
          <CheckCircle2 size={15} color={isCompleted ? colors.textMuted : isDark ? '#090D16' : '#FFFFFF'} strokeWidth={1.75} />
          <Text
            style={[
              styles.primaryActionBtnText,
              {
                fontFamily: typography.fonts.bodyMedium,
                color: isCompleted ? colors.textMuted : isDark ? '#090D16' : '#FFFFFF',
                fontSize: typography.sizes.xs,
                marginLeft: spacing.xs,
              },
            ]}
          >
            {isCompleted ? 'Mark Incomplete' : 'Complete Task'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryActionBtn,
            {
              backgroundColor: colors.bgMuted,
              borderColor: colors.borderSubtle,
              borderRadius: radii.sm,
              borderWidth: 1,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              marginLeft: spacing.sm,
            },
          ]}
          onPress={() => onSnooze(task.id, 60)}
        >
          <Clock size={15} color={colors.textPrimary} strokeWidth={1.75} />
          <Text
            style={[
              styles.secondaryActionBtnText,
              {
                fontFamily: typography.fonts.bodyMedium,
                color: colors.textPrimary,
                fontSize: typography.sizes.xs,
                marginLeft: spacing.xs,
              },
            ]}
          >
            +1h Snooze
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reminder Profile & Occurrences Breakdown */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderSubtle,
            borderRadius: radii.md,
            borderWidth: 1,
            padding: spacing.base,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            styles.cardSectionTitle,
            {
              fontFamily: typography.fonts.displaySemiBold,
              color: colors.textSecondary,
              fontSize: typography.sizes.xs,
              marginBottom: spacing.xs,
              textTransform: 'uppercase',
            },
          ]}
        >
          Reminder Profile: {profile.name}
        </Text>

        <CascadeTimelinePreview
          stages={task.occurrences.map((o) => ({
            offsetMinutes: o.offsetMinutes,
            label: o.stageLabel,
            status: o.status,
            triggerTimeStr: o.status === 'skipped' ? 'skipped' : o.triggerAtUtc.slice(11, 16),
          }))}
          style={{ marginVertical: spacing.sm }}
        />

        {/* Occurrences List */}
        <View style={{ marginTop: spacing.sm }}>
          {task.occurrences.map((occ) => (
            <View
              key={occ.id}
              style={[
                styles.occurrenceRow,
                { borderTopColor: colors.borderSubtle, borderTopWidth: 1, paddingVertical: spacing.xs },
              ]}
            >
              <Text
                style={[
                  styles.occLabel,
                  { fontFamily: typography.fonts.monoMedium, color: colors.textPrimary, fontSize: typography.sizes.xs },
                ]}
              >
                {occ.stageLabel}
              </Text>
              <Text
                style={[
                  styles.occStatus,
                  {
                    fontFamily: typography.fonts.monoMedium,
                    color: occ.status === 'completed' ? colors.status.completed.text : colors.textMuted,
                    fontSize: 10,
                  },
                ]}
              >
                {occ.status.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Captured Source Provenance */}
      {task.source ? (
        <View style={{ marginBottom: spacing.lg }}>
          <Text
            style={[
              styles.cardSectionTitle,
              {
                fontFamily: typography.fonts.displaySemiBold,
                color: colors.textSecondary,
                fontSize: typography.sizes.xs,
                marginBottom: spacing.xs,
                textTransform: 'uppercase',
              },
            ]}
          >
            Source Provenance
          </Text>
          <SourceProvenanceCard
            sourceAppLabel={task.source.sourceAppLabel}
            senderLabel={task.source.senderLabel}
            subject={task.source.subject}
            sourceExcerpt={task.source.sourceExcerpt}
            sourceUrl={task.source.sourceUrl}
          />
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 6,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconAction: {
    padding: 6,
  },
  title: {},
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fastActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryActionBtnText: {},
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryActionBtnText: {},
  card: {},
  cardSectionTitle: {},
  occurrenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  occLabel: {},
  occStatus: {
    letterSpacing: 0.5,
  },
});
