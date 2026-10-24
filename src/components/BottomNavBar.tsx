import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Inbox, Clock, Settings, Plus, Bell } from 'lucide-react-native';
import { useTheme } from '../theme';

export type NavTab = 'today' | 'inbox' | 'upcoming' | 'settings';

export interface BottomNavBarProps {
  activeTab: NavTab;
  inboxCount?: number;
  onSelectTab: (tab: NavTab) => void;
  onAddTaskPress: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  inboxCount = 0,
  onSelectTab,
  onAddTaskPress,
}) => {
  const { colors, typography, radii } = useTheme();

  return (
    <View style={styles.dockWrapper}>
      <View
        style={[
          styles.dockContainer,
          {
            backgroundColor: '#1E1A17',
            borderColor: '#332D28',
            borderRadius: 36,
          },
        ]}
      >
        {/* Today Tab (Home) */}
        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => onSelectTab('today')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'today' }}
          accessibilityLabel="Today view"
        >
          <Clock
            size={20}
            color={activeTab === 'today' ? colors.accentLime : colors.textMuted}
            strokeWidth={activeTab === 'today' ? 2.4 : 1.75}
          />
        </TouchableOpacity>

        {/* Upcoming (Calendar) */}
        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => onSelectTab('upcoming')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'upcoming' }}
          accessibilityLabel="Upcoming calendar view"
        >
          <Calendar
            size={20}
            color={activeTab === 'upcoming' ? colors.accentLime : colors.textMuted}
            strokeWidth={activeTab === 'upcoming' ? 2.4 : 1.75}
          />
        </TouchableOpacity>

        {/* Signature Floating Lime Action Button (+) from Dribbble shot 3 */}
        <View style={styles.centerFabContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onAddTaskPress}
            style={[
              styles.centerFab,
              {
                backgroundColor: colors.accentLime,
                borderRadius: radii.full,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create reminder"
          >
            <Plus size={24} color={colors.accentLimeDarkText} strokeWidth={2.6} />
          </TouchableOpacity>
        </View>

        {/* Inbox (Notifications Bell) */}
        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => onSelectTab('inbox')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'inbox' }}
          accessibilityLabel={'Inbox, ' + inboxCount + ' items'}
        >
          <View>
            <Bell
              size={20}
              color={activeTab === 'inbox' ? colors.accentLime : colors.textMuted}
              strokeWidth={activeTab === 'inbox' ? 2.4 : 1.75}
            />
            {inboxCount > 0 ? (
              <View
                style={[
                  styles.notificationDot,
                  {
                    backgroundColor: colors.accentLime,
                    borderRadius: radii.full,
                  },
                ]}
              />
            ) : null}
          </View>
        </TouchableOpacity>

        {/* Settings Tab */}
        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => onSelectTab('settings')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'settings' }}
          accessibilityLabel="Settings view"
        >
          <Settings
            size={20}
            color={activeTab === 'settings' ? colors.accentLime : colors.textMuted}
            strokeWidth={activeTab === 'settings' ? 2.4 : 1.75}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 380,
    height: 64,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  dockItem: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerFab: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DDF247',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
  },
});
