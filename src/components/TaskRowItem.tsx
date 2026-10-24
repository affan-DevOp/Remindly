import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Check, MoreHorizontal, Link2, MessageSquare, Mail } from 'lucide-react-native';
import { useTheme } from '../theme';
import { TemporalChip, TemporalTier } from './TemporalChip';
import { TaskFixture } from '../mocks/phase1Fixtures';

export interface TaskRowItemProps {
  task: TaskFixture;
  onToggleComplete?: (taskId: string) => void;
  onPressTask?: (taskId: string) => void;
  onMorePress?: (task: TaskFixture) => void;
  style?: ViewStyle;
}

export const TaskRowItem: React.FC<TaskRowItemProps> = ({
  task,
  onToggleComplete,
  onPressTask,
  onMorePress,
  style,
}) => {
  const { colors, typography, spacing, radii } = useTheme();

  const isCompleted = task.status === 'completed';
  const isImportant = task.priority === 'important';

  let tier: TemporalTier = 'scheduled';
  let countdownText = 'No deadline';

  if (task.status === 'inbox') {
    tier = 'neutral';
    countdownText = 'Needs review';
  } else if (task.dueLocalDate || task.dueAtUtc) {
    if (task.id.includes('overdue')) {
      tier = 'overdue';
      countdownText = 'Overdue - 42m';
    } else if (task.id.includes('next_up')) {
      tier = 'warning';
      countdownText = 'in 28m';
    } else if (task.dueLocalTime) {
      tier = 'scheduled';
      countdownText = task.dueLocalDate ? task.dueLocalDate.slice(5) + ' ' + task.dueLocalTime : task.dueLocalTime;
    }
  }

  if (isCompleted) {
    tier = 'completed';
    countdownText = 'Completed';
  }

  const sourceApp = task.source?.sourceAppLabel;
  const sourceUrl = task.source?.sourceUrl;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPressTask?.(task.id)}
      style={[
        styles.container,
        {
          backgroundColor: colors.bgElevated,
          borderColor: colors.borderSubtle,
          borderRadius: radii.md,
          borderWidth: 1,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
        isCompleted && { opacity: 0.55 },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={'Task: ' + task.title + ', status: ' + task.status}
    >
      <View style={styles.contentRow}>
        <TouchableOpacity
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => onToggleComplete?.(task.id)}
          style={[
            styles.checkbox,
            {
              borderColor: isCompleted ? colors.status.completed.border : colors.borderFocus,
              backgroundColor: isCompleted ? colors.status.completed.bg : 'transparent',
              borderRadius: radii.sm,
            },
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted }}
          accessibilityLabel={isCompleted ? 'Mark incomplete' : 'Mark completed'}
        >
          {isCompleted ? (
            <Check size={14} color={colors.status.completed.text} strokeWidth={2.5} />
          ) : null}
        </TouchableOpacity>

        <View style={styles.textColumn}>
          <View style={styles.titleLine}>
            <Text
              style={[
                styles.title,
                {
                  color: isCompleted ? colors.textMuted : colors.textPrimary,
                  fontFamily: isCompleted ? typography.fonts.bodyRegular : typography.fonts.bodySemiBold,
                  fontSize: typography.sizes.base,
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>

            {isImportant ? (
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: colors.status.warning.text, borderRadius: radii.full },
                ]}
                accessibilityLabel="Important priority"
              />
            ) : null}
          </View>

          <View style={styles.metaRow}>
            {sourceApp ? (
              <View
                style={[
                  styles.sourceTag,
                  {
                    backgroundColor: colors.bgMuted,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.xs,
                    borderWidth: 1,
                  },
                ]}
              >
                {sourceApp.toLowerCase().includes('mail') ? (
                  <Mail size={10} color={colors.textSecondary} strokeWidth={1.75} />
                ) : (
                  <MessageSquare size={10} color={colors.textSecondary} strokeWidth={1.75} />
                )}
                <Text
                  style={[
                    styles.sourceLabel,
                    {
                      color: colors.textSecondary,
                      fontFamily: typography.fonts.bodyRegular,
                      fontSize: typography.sizes.xs,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {sourceApp}
                </Text>
              </View>
            ) : null}

            {sourceUrl ? (
              <Link2 size={12} color={colors.textMuted} strokeWidth={1.75} />
            ) : null}

            <TemporalChip
              tier={tier}
              text={countdownText}
              showIcon={tier !== 'neutral'}
            />
          </View>
        </View>

        <TouchableOpacity
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => onMorePress?.(task)}
          style={styles.moreButton}
          accessibilityRole="button"
          accessibilityLabel={'More options for ' + task.title}
        >
          <MoreHorizontal size={18} color={colors.textMuted} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 6,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    lineHeight: 20,
  },
  priorityDot: {
    width: 6,
    height: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sourceLabel: {
    fontSize: 11,
  },
  moreButton: {
    padding: 6,
  },
});
