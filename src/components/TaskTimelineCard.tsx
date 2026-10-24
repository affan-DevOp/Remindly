import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Clock, Instagram, Briefcase, Scissors, FileText, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme';
import { TaskFixture } from '../mocks/phase1Fixtures';

export interface TaskTimelineCardProps {
  task: TaskFixture;
  isFeatured?: boolean; // Highlighted Luminous Lime Card from Image 3
  timeMarker?: string;  // e.g. '9 am', '10 am'
  timeRange?: string;   // e.g. '9:00am to 9:50am'
  onToggleComplete?: (id: string) => void;
  onPressCard?: (id: string) => void;
}

export const TaskTimelineCard: React.FC<TaskTimelineCardProps> = ({
  task,
  isFeatured = false,
  timeMarker = '9 am',
  timeRange = '9:00am to 9:50am',
  onToggleComplete,
  onPressCard,
}) => {
  const { colors, typography, radii } = useTheme();

  const isCompleted = task.status === 'completed';

  const renderIcon = () => {
    const titleLower = task.title.toLowerCase();
    const iconColor = isFeatured ? colors.accentLimeDarkText : colors.textPrimary;
    if (titleLower.includes('instagram') || titleLower.includes('social')) {
      return <Instagram size={18} color={iconColor} strokeWidth={2} />;
    }
    if (titleLower.includes('interview') || titleLower.includes('job') || titleLower.includes('budget')) {
      return <Briefcase size={18} color={iconColor} strokeWidth={2} />;
    }
    if (titleLower.includes('design') || titleLower.includes('ui')) {
      return <Scissors size={18} color={iconColor} strokeWidth={2} />;
    }
    return <FileText size={18} color={iconColor} strokeWidth={2} />;
  };

  return (
    <View style={styles.timelineRow}>
      {/* Left Time Marker Column */}
      <View style={styles.timeMarkerCol}>
        <Text style={[styles.timeMarkerText, { color: colors.textMuted, fontFamily: typography.fonts.monoMedium }]}>
          {timeMarker}
        </Text>
      </View>

      {/* Right Task Card Block */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPressCard?.(task.id)}
        style={[
          styles.cardContainer,
          isFeatured
            ? {
                backgroundColor: colors.accentLime,
                borderColor: colors.accentLime,
              }
            : {
                backgroundColor: colors.bgElevated,
                borderColor: colors.borderSubtle,
              },
          isCompleted && { opacity: 0.5 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={task.title + ', ' + timeRange}
      >
        <View style={styles.cardHeaderRow}>
          {/* Leading Icon Pill */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isFeatured ? 'rgba(0,0,0,0.08)' : colors.bgMuted,
                borderRadius: radii.sm,
              },
            ]}
          >
            {renderIcon()}
          </View>

          {/* Title & Time Range */}
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.taskTitle,
                {
                  color: isFeatured ? colors.accentLimeDarkText : colors.textPrimary,
                  fontFamily: typography.fonts.displaySemiBold,
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>

            <View style={styles.timeRangeRow}>
              <Text
                style={[
                  styles.timeRangeText,
                  {
                    color: isFeatured ? 'rgba(18,22,6,0.75)' : colors.textSecondary,
                    fontFamily: typography.fonts.bodyRegular,
                  },
                ]}
              >
                {timeRange}
              </Text>
            </View>
          </View>

          {/* Complete / Arrow Action */}
          <TouchableOpacity
            onPress={() => onToggleComplete?.(task.id)}
            style={[
              styles.checkAffordance,
              {
                borderColor: isFeatured ? 'rgba(18,22,6,0.3)' : colors.borderFocus,
                backgroundColor: isCompleted
                  ? colors.status.completed.text
                  : 'transparent',
                borderRadius: radii.full,
              },
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isCompleted }}
          >
            {isCompleted ? <Check size={12} color="#000000" strokeWidth={3} /> : null}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timeMarkerCol: {
    width: 54,
    paddingTop: 14,
  },
  timeMarkerText: {
    fontSize: 12,
  },
  cardContainer: {
    flex: 1,
    minHeight: 70,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    fontSize: 15,
    lineHeight: 19,
  },
  timeRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 12,
  },
  checkAffordance: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
