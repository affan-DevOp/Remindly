import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../theme';

export type TemporalTier = 'overdue' | 'warning' | 'scheduled' | 'completed' | 'neutral';

export interface TemporalChipProps {
  label?: string;
  text?: string;
  tier?: TemporalTier;
  icon?: React.ReactNode;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const TemporalChip: React.FC<TemporalChipProps> = ({
  label,
  text,
  tier = 'neutral',
  icon,
  showIcon = false,
  size = 'sm',
  style,
}) => {
  const { colors, typography, radii, spacing } = useTheme();
  const tierColors = colors.status[tier];
  const displayText = text || label || '';

  const renderIcon = () => {
    if (icon) return <View style={{ marginRight: spacing.xs }}>{icon}</View>;
    if (!showIcon) return null;

    if (tier === 'overdue') {
      return (
        <View style={{ marginRight: 4 }}>
          <AlertCircle size={10} color={tierColors.text} strokeWidth={2} />
        </View>
      );
    }
    if (tier === 'warning') {
      return (
        <View style={{ marginRight: 4 }}>
          <Clock size={10} color={tierColors.text} strokeWidth={2} />
        </View>
      );
    }
    if (tier === 'completed') {
      return (
        <View style={{ marginRight: 4 }}>
          <CheckCircle2 size={10} color={tierColors.text} strokeWidth={2} />
        </View>
      );
    }
    return null;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tierColors.bg,
          borderColor: tierColors.border,
          borderRadius: radii.xs,
          paddingHorizontal: size === 'sm' ? 6 : 8,
          paddingVertical: size === 'sm' ? 2 : 4,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={'Status: ' + displayText}
    >
      {renderIcon()}
      <Text
        style={[
          styles.text,
          {
            fontFamily: typography.fonts.monoMedium,
            fontSize: size === 'sm' ? 11 : 12,
            color: tierColors.text,
          },
        ]}
      >
        {displayText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  text: {},
});
