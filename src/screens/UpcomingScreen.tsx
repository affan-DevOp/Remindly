import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Search, Filter, Calendar, Sparkles } from 'lucide-react-native';
import { useTheme } from '../theme';
import { TaskFixture } from '../mocks/phase1Fixtures';
import { TaskRowItem } from '../components/TaskRowItem';

export type FilterCategory = 'all' | 'important' | 'with_link';

export interface UpcomingScreenProps {
  tasks: TaskFixture[];
  onToggleComplete: (taskId: string) => void;
  onPressTask: (taskId: string) => void;
  onMorePress: (task: TaskFixture) => void;
}

export const UpcomingScreen: React.FC<UpcomingScreenProps> = ({
  tasks,
  onToggleComplete,
  onPressTask,
  onMorePress,
}) => {
  const { colors, typography, spacing, radii, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => t.status === 'scheduled');

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.source?.sourceExcerpt.toLowerCase().includes(q) ||
          t.source?.senderLabel?.toLowerCase().includes(q)
      );
    }

    if (filterCategory === 'important') {
      result = result.filter((t) => t.priority === 'important');
    } else if (filterCategory === 'with_link') {
      result = result.filter((t) => !!t.source?.sourceUrl);
    }

    return result;
  }, [tasks, searchQuery, filterCategory]);

  // Group chronologically
  const tomorrowTasks = filteredTasks.filter((t) => t.id.includes('tomorrow'));
  const laterTasks = filteredTasks.filter((t) => !t.id.includes('tomorrow') && !t.id.includes('today') && !t.id.includes('overdue') && !t.id.includes('next_up'));

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { paddingHorizontal: spacing.base, paddingTop: spacing.sm }]}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderSubtle,
              borderRadius: radii.md,
              borderWidth: 1,
              paddingHorizontal: spacing.sm,
            },
          ]}
        >
          <Search size={16} color={colors.textMuted} strokeWidth={1.75} />
          <TextInput
            placeholder="Search upcoming tasks or excerpts..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[
              styles.searchInput,
              {
                fontFamily: typography.fonts.bodyRegular,
                color: colors.textPrimary,
                fontSize: typography.sizes.sm,
                marginLeft: spacing.xs,
              },
            ]}
          />
        </View>

        {/* Filter Chips */}
        <View style={[styles.filterRow, { marginTop: spacing.sm, marginBottom: spacing.xs }]}>
          {(['all', 'important', 'with_link'] as FilterCategory[]).map((cat) => {
            const isSelected = filterCategory === cat;
            const label = cat === 'all' ? 'All' : cat === 'important' ? 'Important' : 'With Link';

            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setFilterCategory(cat)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.accentPrimary : colors.bgMuted,
                    borderColor: isSelected ? colors.accentPrimary : colors.borderSubtle,
                    borderRadius: radii.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    marginRight: spacing.xs,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      fontFamily: typography.fonts.bodyMedium,
                      color: isSelected ? (isDark ? '#090D16' : '#FFFFFF') : colors.textSecondary,
                      fontSize: typography.sizes.xs,
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Task Groups */}
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        {tomorrowTasks.length > 0 ? (
          <View style={styles.groupSection}>
            <View style={[styles.groupHeaderRow, { paddingHorizontal: spacing.base, marginVertical: spacing.xs }]}>
              <Text
                style={[
                  styles.groupTitle,
                  {
                    fontFamily: typography.fonts.displaySemiBold,
                    color: colors.textPrimary,
                    fontSize: typography.sizes.sm,
                    letterSpacing: typography.tracking.tight,
                  },
                ]}
              >
                TOMORROW
              </Text>
            </View>

            <View style={[styles.cardSurface, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
              {tomorrowTasks.map((t) => (
                <TaskRowItem
                  key={t.id}
                  task={t}
                  onToggleComplete={onToggleComplete}
                  onPressTask={onPressTask}
                  onMorePress={onMorePress}
                />
              ))}
            </View>
          </View>
        ) : null}

        {laterTasks.length > 0 ? (
          <View style={[styles.groupSection, { marginTop: spacing.md }]}>
            <View style={[styles.groupHeaderRow, { paddingHorizontal: spacing.base, marginVertical: spacing.xs }]}>
              <Text
                style={[
                  styles.groupTitle,
                  {
                    fontFamily: typography.fonts.displaySemiBold,
                    color: colors.textPrimary,
                    fontSize: typography.sizes.sm,
                    letterSpacing: typography.tracking.tight,
                  },
                ]}
              >
                LATER THIS MONTH
              </Text>
            </View>

            <View style={[styles.cardSurface, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
              {laterTasks.map((t) => (
                <TaskRowItem
                  key={t.id}
                  task={t}
                  onToggleComplete={onToggleComplete}
                  onPressTask={onPressTask}
                  onMorePress={onMorePress}
                />
              ))}
            </View>
          </View>
        ) : null}

        {filteredTasks.length === 0 ? (
          <View style={[styles.emptyContainer, { padding: spacing.xl }]}>
            <Text
              style={[
                styles.emptyText,
                {
                  fontFamily: typography.fonts.bodyRegular,
                  color: colors.textMuted,
                  fontSize: typography.sizes.sm,
                },
              ]}
            >
              No upcoming tasks found matching your filter.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {},
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    borderWidth: 1,
  },
  filterChipText: {},
  groupSection: {},
  groupHeaderRow: {},
  groupTitle: {
    textTransform: 'uppercase',
  },
  cardSurface: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {},
});
