import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Check, Clock, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../theme';

export interface StageNode {
  offsetMinutes: number;
  label: string;
  triggerTimeStr?: string;
  isPast?: boolean;
  status?: 'pending' | 'scheduled' | 'skipped' | 'completed' | 'cancelled';
}

export const CascadeTimelinePreview: React.FC<CascadeTimelinePreviewProps> = ({
  stages,
  style,
}) => {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.timelineRow}>
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1;
          const isSkipped = stage.isPast || stage.status === 'skipped' || stage.status === 'cancelled';
          const isCompleted = stage.status === 'completed';

          const nodeColor = isSkipped
            ? colors.textMuted
            : isCompleted
            ? colors.status.completed.text
            : stage.offsetMinutes === 0
            ? colors.status.warning.text
            : colors.accentActive;

          return (
            <React.Fragment key={`${stage.label}-${index}`}>
              {/* Node Column */}
              <View style={styles.nodeColumn}>
                {/* Node Pill / Circle */}
                <View
                  style={[
                    styles.nodeCircle,
                    {
                      borderColor: nodeColor,
                      backgroundColor: isSkipped
                        ? colors.bgMuted
                        : isCompleted
                        ? colors.status.completed.bg
                        : colors.bgSurface,
                      opacity: isSkipped ? 0.45 : 1,
                    },
                  ]}
                >
                  {isCompleted ? (
                    <Check size={10} color={colors.status.completed.text} strokeWidth={2} />
                  ) : isSkipped ? (
                    <Text style={[styles.skippedDash, { color: colors.textMuted }]}>–</Text>
                  ) : (
                    <View style={[styles.activeDot, { backgroundColor: nodeColor }]} />
                  )}
                </View>

                {/* Stage Label in JetBrains Mono */}
                <Text
                  style={[
                    styles.stageLabel,
                    {
                      fontFamily: typography.fonts.monoMedium,
                      color: isSkipped ? colors.textMuted : colors.textPrimary,
                      fontSize: typography.sizes.xs,
                      marginTop: spacing.xs,
                      opacity: isSkipped ? 0.5 : 1,
                    },
                  ]}
                >
                  {stage.label}
                </Text>

                {/* Optional formatted time string */}
                {stage.triggerTimeStr ? (
                  <Text
                    style={[
                      styles.timeLabel,
                      {
                        fontFamily: typography.fonts.monoMedium,
                        color: colors.textMuted,
                        fontSize: 9,
                        marginTop: 1,
                        opacity: isSkipped ? 0.4 : 0.85,
                      },
                    ]}
                  >
                    {isSkipped ? '(skipped)' : stage.triggerTimeStr}
                  </Text>
                ) : null}
              </View>

              {/* Connecting Line between nodes */}
              {!isLast ? (
                <View
                  style={[
                    styles.connectLine,
                    {
                      backgroundColor: isSkipped ? colors.borderSubtle : colors.accentActive,
                      opacity: isSkipped ? 0.3 : 0.6,
                      marginHorizontal: spacing.xs,
                    },
                  ]}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

export interface CascadeTimelinePreviewProps {
  stages: StageNode[];
  style?: ViewStyle;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nodeColumn: {
    alignItems: 'center',
    minWidth: 44,
  },
  nodeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  skippedDash: {
    fontSize: 10,
    lineHeight: 12,
  },
  stageLabel: {
    letterSpacing: 0.2,
  },
  timeLabel: {
    letterSpacing: 0.1,
  },
  connectLine: {
    flex: 1,
    height: 1.5,
    marginBottom: 16,
  },
});
