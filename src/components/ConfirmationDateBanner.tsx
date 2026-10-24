import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../theme';

export interface ConfirmationDateBannerProps {
  matchedPhrase?: string;
  resolvedDateTimeStr: string;
  isDateOnly?: boolean;
  isAmbiguous?: boolean;
  timezoneLabel?: string;
  onQuickShift?: (shift: '+1h' | 'tonight' | 'tomorrow' | 'custom') => void;
  style?: ViewStyle;
}

export const ConfirmationDateBanner: React.FC<ConfirmationDateBannerProps> = ({
  matchedPhrase,
  resolvedDateTimeStr,
  isDateOnly = false,
  isAmbiguous = false,
  timezoneLabel = 'IST',
  onQuickShift,
  style,
}) => {
  const { colors, typography, spacing, radii } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isAmbiguous ? colors.status.warning.bg : colors.bgMuted,
          borderColor: isAmbiguous ? colors.status.warning.border : colors.borderSubtle,
          borderRadius: radii.md,
          borderWidth: 1,
          padding: spacing.base,
        },
        style,
      ]}
      accessibilityRole="region"
      accessibilityLabel={isAmbiguous ? 'Ambiguous reminder deadline' : 'Verified reminder deadline'}
    >
      <View style={styles.topRow}>
        <View style={styles.statusLabelRow}>
          {isAmbiguous ? (
            <AlertCircle size={14} color={colors.status.warning.text} strokeWidth={2} />
          ) : (
            <CheckCircle2 size={14} color={colors.status.completed.text} strokeWidth={2} />
          )}
          <Text
            style={[
              styles.statusText,
              {
                color: isAmbiguous ? colors.status.warning.text : colors.textSecondary,
                fontFamily: typography.fonts.bodyMedium,
                fontSize: typography.sizes.xs,
              },
            ]}
          >
            {isAmbiguous ? 'Needs Confirmation' : 'Detected from message'}
          </Text>
        </View>

        {matchedPhrase ? (
          <View
            style={[
              styles.matchedBadge,
              {
                backgroundColor: colors.bgElevated,
                borderColor: colors.borderSubtle,
                borderRadius: radii.xs,
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={[
                styles.matchedText,
                {
                  color: colors.textSecondary,
                  fontFamily: typography.fonts.monoMedium,
                  fontSize: typography.sizes.xs,
                },
              ]}
              numberOfLines={1}
            >
              "{matchedPhrase}"
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.dateTimeRow}>
        <View style={styles.iconWrap}>
          {isDateOnly ? (
            <Calendar size={18} color={colors.textPrimary} strokeWidth={1.75} />
          ) : (
            <Clock size={18} color={colors.textPrimary} strokeWidth={1.75} />
          )}
        </View>
        <Text
          style={[
            styles.dateTimeText,
            {
              color: colors.textPrimary,
              fontFamily: typography.fonts.monoSemiBold,
              fontSize: typography.sizes.md,
            },
          ]}
        >
          {resolvedDateTimeStr}
        </Text>
        <View
          style={[
            styles.tzBadge,
            {
              backgroundColor: colors.bgElevated,
              borderColor: colors.borderSubtle,
              borderRadius: radii.xs,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            style={[
              styles.tzText,
              {
                color: colors.textMuted,
                fontFamily: typography.fonts.monoMedium,
                fontSize: typography.sizes.xs,
              },
            ]}
          >
            {isDateOnly ? 'DATE ONLY' : timezoneLabel}
          </Text>
        </View>
      </View>

      {onQuickShift ? (
        <View style={styles.quickShiftRow}>
          {(['+1h', 'tonight', 'tomorrow', 'custom'] as const).map((shift) => (
            <TouchableOpacity
              key={shift}
              onPress={() => onQuickShift(shift)}
              style={[
                styles.shiftChip,
                {
                  backgroundColor: colors.bgElevated,
                  borderColor: colors.borderSubtle,
                  borderRadius: radii.xs,
                  borderWidth: 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={'Shift deadline ' + shift}
            >
              <Text
                style={[
                  styles.shiftChipText,
                  {
                    color: colors.textPrimary,
                    fontFamily: typography.fonts.bodyMedium,
                    fontSize: typography.sizes.xs,
                  },
                ]}
              >
                {shift === '+1h'
                  ? '+1 Hour'
                  : shift === 'tonight'
                  ? 'Tonight'
                  : shift === 'tomorrow'
                  ? 'Tomorrow'
                  : 'Edit...'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    maxWidth: '55%',
  },
  matchedText: {},
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeText: {
    flex: 1,
    letterSpacing: -0.2,
  },
  tzBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tzText: {
    fontSize: 10,
  },
  quickShiftRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  shiftChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shiftChipText: {},
});
