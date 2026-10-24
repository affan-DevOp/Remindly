import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme';

export interface CalendarDay {
  dayNum: number;
  dayName: string;
  dateStr: string;
  isToday?: boolean;
}

const DEMO_DAYS: CalendarDay[] = [
  { dayNum: 12, dayName: 'SUN', dateStr: '2026-10-12' },
  { dayNum: 13, dayName: 'MON', dateStr: '2026-10-13' },
  { dayNum: 14, dayName: 'TUE', dateStr: '2026-10-14' },
  { dayNum: 15, dayName: 'WED', dateStr: '2026-10-15', isToday: true },
  { dayNum: 16, dayName: 'THU', dateStr: '2026-10-16' },
  { dayNum: 17, dayName: 'FRI', dateStr: '2026-10-17' },
  { dayNum: 18, dayName: 'SAT', dateStr: '2026-10-18' },
];

export interface HorizontalCalendarStripProps {
  selectedDate?: string;
  onSelectDate?: (dateStr: string) => void;
}

export const HorizontalCalendarStrip: React.FC<HorizontalCalendarStripProps> = ({
  selectedDate = '2026-10-15',
  onSelectDate,
}) => {
  const { colors, typography, radii } = useTheme();
  const [activeDate, setActiveDate] = useState(selectedDate);

  const handleSelect = (dateStr: string) => {
    setActiveDate(dateStr);
    onSelectDate?.(dateStr);
  };

  return (
    <View style={styles.container}>
      {/* Month Header Navigation */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.navArrow} accessibilityLabel="Previous month">
          <ChevronLeft size={16} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: colors.textPrimary, fontFamily: typography.fonts.displaySemiBold }]}>
          Nov 2026
        </Text>
        <TouchableOpacity style={styles.navArrow} accessibilityLabel="Next month">
          <ChevronRight size={16} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* 7-Day Horizontal Pills Row */}
      <View style={styles.daysRow}>
        {DEMO_DAYS.map((item) => {
          const isSelected = activeDate === item.dateStr;
          return (
            <TouchableOpacity
              key={item.dateStr}
              onPress={() => handleSelect(item.dateStr)}
              style={[
                styles.dayPill,
                {
                  backgroundColor: isSelected ? colors.accentLime : colors.bgElevated,
                  borderColor: isSelected ? colors.accentLime : colors.borderSubtle,
                  borderRadius: 14,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.dayName + ' ' + item.dayNum + (isSelected ? ' selected' : '')}
            >
              <Text
                style={[
                  styles.dayNumText,
                  {
                    color: isSelected ? colors.accentLimeDarkText : colors.textPrimary,
                    fontFamily: typography.fonts.displayBold,
                  },
                ]}
              >
                {item.dayNum}
              </Text>
              <Text
                style={[
                  styles.dayNameText,
                  {
                    color: isSelected ? colors.accentLimeDarkText : colors.textMuted,
                    fontFamily: typography.fonts.monoMedium,
                  },
                ]}
              >
                {item.dayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  navArrow: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayPill: {
    flex: 1,
    minHeight: 64,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 4,
  },
  dayNumText: {
    fontSize: 16,
  },
  dayNameText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
