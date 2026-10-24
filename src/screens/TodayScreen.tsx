import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Inbox as InboxIcon,
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { TaskFixture } from '../mocks/phase1Fixtures';
import { HorizontalCalendarStrip } from '../components/HorizontalCalendarStrip';
import { TaskTimelineCard } from '../components/TaskTimelineCard';

export type TodayCategory = 'all' | 'important' | 'notes';

export interface TodayScreenProps {
  tasks: TaskFixture[];
  onToggleComplete: (taskId: string) => void;
  onPressTask: (taskId: string) => void;
  onMorePress: (task: TaskFixture) => void;
  onGoToInbox: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  tasks,
  onToggleComplete,
  onPressTask,
  onMorePress,
  onGoToInbox,
}) => {
  const { colors, typography, radii } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<TodayCategory>('all');
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const overdueTasks = tasks.filter((t) => t.status === 'scheduled' && t.id.includes('overdue'));
  const scheduledTasks = tasks.filter((t) => t.status === 'scheduled' && !t.id.includes('overdue'));
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgCanvas }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* User Greeting & Header from Dribbble shot 3 ("Hi, Good Morning Jacobe") */}
      <View style={styles.greetingHeaderRow}>
        <View style={styles.avatarUserRow}>
          <View style={[styles.userAvatar, { backgroundColor: colors.accentLime, borderRadius: radii.full }]}>
            <Text style={[styles.avatarText, { color: colors.accentLimeDarkText, fontFamily: typography.fonts.displayBold }]}>
              J
            </Text>
          </View>
          <View style={styles.userTextCol}>
            <Text style={[styles.greetingSmall, { color: colors.textMuted, fontFamily: typography.fonts.bodyRegular }]}>
              Hi, Good Morning
            </Text>
            <Text style={[styles.userName, { color: colors.textPrimary, fontFamily: typography.fonts.displayBold }]}>
              Jacobe
            </Text>
          </View>
        </View>

        {/* View Profile / Fast Action Pill */}
        <TouchableOpacity
          onPress={onGoToInbox}
          style={[styles.headerPill, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}
          accessibilityRole="button"
          accessibilityLabel="Inbox fast access"
        >
          <ArrowRight size={14} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Segmented Category Filter Pills from Dribbble shot 3 */}
      <View style={styles.filterPillsRow}>
        {(['all', 'important', 'notes'] as const).map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected ? colors.accentLime : colors.bgElevated,
                  borderColor: isSelected ? colors.accentLime : colors.borderSubtle,
                  borderRadius: radii.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  {
                    color: isSelected ? colors.accentLimeDarkText : colors.textSecondary,
                    fontFamily: isSelected ? typography.fonts.displayBold : typography.fonts.bodyMedium,
                  },
                ]}
              >
                {cat === 'all' ? 'ALL REMINDERS' : cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 7-Day Horizontal Calendar Strip from Dribbble shot 3 */}
      <HorizontalCalendarStrip />

      {/* Section Title: "Scheduled Reminders:" from Image 3 */}
      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitleText,
            {
              color: colors.textPrimary,
              fontFamily: typography.fonts.displayBold,
            },
          ]}
        >
          Scheduled Reminders:
        </Text>
      </View>

      {/* Timeline Reminders: 9 am, 10 am, 11 am... */}
      {scheduledTasks.length === 0 && overdueTasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No scheduled reminders for today.
          </Text>
        </View>
      ) : (
        <View style={styles.timelineList}>
          {/* Overdue Urgent Task if present */}
          {overdueTasks.map((task, idx) => (
            <TaskTimelineCard
              key={task.id}
              task={task}
              isFeatured={true} // Styled in luminous lime
              timeMarker={idx === 0 ? '9 am' : '10 am'}
              timeRange="Overdue - 42m"
              onToggleComplete={onToggleComplete}
              onPressCard={onPressTask}
            />
          ))}

          {/* Standard Scheduled Tasks */}
          {scheduledTasks.map((task, idx) => (
            <TaskTimelineCard
              key={task.id}
              task={task}
              isFeatured={idx === 0 && overdueTasks.length === 0} // First task highlighted in lime like Image 3
              timeMarker={idx === 0 ? '11 am' : idx === 1 ? '12 pm' : '2 pm'}
              timeRange={task.dueLocalTime ? task.dueLocalTime + ' to 4:00pm' : 'Today'}
              onToggleComplete={onToggleComplete}
              onPressCard={onPressTask}
            />
          ))}
        </View>
      )}

      {/* Completed Accordion */}
      {completedTasks.length > 0 ? (
        <View style={styles.completedSection}>
          <TouchableOpacity
            onPress={() => setCompletedExpanded(!completedExpanded)}
            style={[
              styles.completedHeader,
              { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle },
            ]}
          >
            <View style={styles.completedHeaderLeft}>
              <CheckCircle2 size={16} color={colors.status.completed.text} strokeWidth={2} />
              <Text style={[styles.completedHeaderText, { color: colors.textSecondary }]}>
                Completed ({completedTasks.length})
              </Text>
            </View>
            {completedExpanded ? (
              <ChevronDown size={16} color={colors.textMuted} />
            ) : (
              <ChevronRight size={16} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  greetingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatarUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
  },
  userTextCol: {
    gap: 2,
  },
  greetingSmall: {
    fontSize: 12,
  },
  userName: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  headerPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 14,
  },
  sectionTitleText: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  timelineList: {
    gap: 4,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  completedSection: {
    marginTop: 20,
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  completedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedHeaderText: {
    fontSize: 13,
  },
});
