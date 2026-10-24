import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Inbox as InboxIcon, Calendar, Archive } from 'lucide-react-native';
import { useTheme } from '../theme';
import { TaskFixture } from '../mocks/phase1Fixtures';
import { SourceProvenanceCard } from '../components/SourceProvenanceCard';

export interface InboxScreenProps {
  inboxTasks: TaskFixture[];
  onSetDeadline: (task: TaskFixture) => void;
  onArchive: (taskId: string) => void;
}

export const InboxScreen: React.FC<InboxScreenProps> = ({
  inboxTasks,
  onSetDeadline,
  onArchive,
}) => {
  const { colors, typography, spacing, radii, isDark } = useTheme();

  if (inboxTasks.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.bgCanvas, padding: spacing.xl }]}>
        <View
          style={[
            styles.emptyIconCircle,
            { backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle, borderRadius: radii.full },
          ]}
        >
          <InboxIcon size={32} color={colors.textMuted} strokeWidth={1.75} />
        </View>
        <Text
          style={[
            styles.emptyTitle,
            {
              fontFamily: typography.fonts.displaySemiBold,
              color: colors.textPrimary,
              fontSize: typography.sizes.lg,
              marginTop: spacing.md,
            },
          ]}
        >
          Inbox is clear
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            {
              fontFamily: typography.fonts.bodyRegular,
              color: colors.textSecondary,
              fontSize: typography.sizes.sm,
              textAlign: 'center',
              marginTop: spacing.xs,
              maxWidth: 280,
            },
          ]}
        >
          When you share messages or links without a clear deadline, they wait here for 1-tap triage.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgCanvas }]}
      contentContainerStyle={[styles.content, { padding: spacing.base, paddingBottom: spacing.xxl }]}
    >
      <View style={[styles.headerBanner, { marginBottom: spacing.md }]}>
        <Text
          style={[
            styles.bannerCount,
            {
              fontFamily: typography.fonts.monoMedium,
              color: colors.accentActive,
              fontSize: typography.sizes.xs,
            },
          ]}
        >
          {inboxTasks.length} CAPTURES NEEDING TRIAGE
        </Text>
      </View>

      {inboxTasks.map((task) => (
        <View
          key={task.id}
          style={[
            styles.inboxCard,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderSubtle,
              borderRadius: radii.md,
              borderWidth: 1,
              padding: spacing.base,
              marginBottom: spacing.md,
            },
          ]}
        >
          {/* Title */}
          <Text
            style={[
              styles.taskTitle,
              {
                fontFamily: typography.fonts.displaySemiBold,
                color: colors.textPrimary,
                fontSize: typography.sizes.base,
              },
            ]}
          >
            {task.title}
          </Text>

          {/* Source Provenance Card excerpt */}
          {task.source ? (
            <SourceProvenanceCard
              sourceAppLabel={task.source.sourceAppLabel}
              senderLabel={task.source.senderLabel}
              subject={task.source.subject}
              sourceExcerpt={task.source.sourceExcerpt}
              sourceUrl={task.source.sourceUrl}
              style={{ marginTop: spacing.sm }}
            />
          ) : null}

          {/* 1-Tap Triage Action Row */}
          <View style={[styles.actionRow, { marginTop: spacing.md }]}>
            <TouchableOpacity
              style={[
                styles.primaryTriageBtn,
                {
                  backgroundColor: colors.accentPrimary,
                  borderRadius: radii.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
              ]}
              onPress={() => onSetDeadline(task)}
              accessibilityRole="button"
              accessibilityLabel={`Set deadline for ${task.title}`}
            >
              <Calendar size={13} color={isDark ? '#090D16' : '#FFFFFF'} strokeWidth={1.75} />
              <Text
                style={[
                  styles.primaryTriageBtnText,
                  {
                    fontFamily: typography.fonts.bodyMedium,
                    color: isDark ? '#090D16' : '#FFFFFF',
                    fontSize: typography.sizes.xs,
                    marginLeft: spacing.xs,
                  },
                ]}
              >
                Set Deadline
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryTriageBtn,
                {
                  backgroundColor: colors.bgMuted,
                  borderColor: colors.borderSubtle,
                  borderRadius: radii.sm,
                  borderWidth: 1,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  marginLeft: spacing.sm,
                },
              ]}
              onPress={() => onArchive(task.id)}
              accessibilityRole="button"
              accessibilityLabel={`Archive ${task.title}`}
            >
              <Archive size={13} color={colors.textSecondary} strokeWidth={1.75} />
              <Text
                style={[
                  styles.secondaryTriageBtnText,
                  {
                    fontFamily: typography.fonts.bodyMedium,
                    color: colors.textSecondary,
                    fontSize: typography.sizes.xs,
                    marginLeft: spacing.xs,
                  },
                ]}
              >
                Archive
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {},
  headerBanner: {},
  bannerCount: {
    letterSpacing: 0.5,
  },
  inboxCard: {},
  taskTitle: {},
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryTriageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryTriageBtnText: {},
  secondaryTriageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryTriageBtnText: {},
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {},
  emptySubtitle: {},
});
