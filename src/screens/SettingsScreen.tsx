import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import {
  Bell,
  Clock,
  Shield,
  Moon,
  Sun,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  Download,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { BUILTIN_PROFILES } from '../mocks/phase1Fixtures';

export interface SettingsScreenProps {
  onSendTestNotification?: () => void;
  onExportBackup?: () => void;
  onClearCompleted?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onSendTestNotification,
  onExportBackup,
  onClearCompleted,
}) => {
  const { colors, typography, spacing, radii, isDark } = useTheme();

  const [defaultProfileId, setDefaultProfileId] = useState('builtin_standard');
  const [defaultDateOnlyTime, setDefaultDateOnlyTime] = useState('09:00');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietHoursRange, setQuietHoursRange] = useState('22:00 – 08:00');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bgCanvas }]}
      contentContainerStyle={[styles.content, { padding: spacing.base, paddingBottom: spacing.xxxl }]}
    >
      {/* 1. Reminder Engine Defaults */}
      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            {
              fontFamily: typography.fonts.displaySemiBold,
              color: colors.textSecondary,
              fontSize: typography.sizes.xs,
              letterSpacing: typography.tracking.tight,
            },
          ]}
        >
          REMINDER DEFAULTS
        </Text>
      </View>

      <View
        style={[
          styles.groupedCard,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderSubtle,
            borderRadius: radii.md,
            borderWidth: 1,
            marginBottom: spacing.lg,
          },
        ]}
      >
        {/* Default Profile Selector */}
        <View style={[styles.settingRow, { padding: spacing.base, borderBottomColor: colors.borderSubtle, borderBottomWidth: 1 }]}>
          <View style={styles.rowLeft}>
            <Bell size={18} color={colors.accentActive} strokeWidth={1.75} />
            <View style={{ marginLeft: spacing.sm }}>
              <Text
                style={[
                  styles.rowLabel,
                  { fontFamily: typography.fonts.bodyMedium, color: colors.textPrimary, fontSize: typography.sizes.base },
                ]}
              >
                Default Profile
              </Text>
              <Text
                style={[
                  styles.rowSubLabel,
                  { fontFamily: typography.fonts.bodyRegular, color: colors.textSecondary, fontSize: typography.sizes.xs },
                ]}
              >
                Standard (-24h, -1h, Due)
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.75} />
        </View>

        {/* Default Date-Only Time */}
        <View style={[styles.settingRow, { padding: spacing.base, borderBottomColor: colors.borderSubtle, borderBottomWidth: 1 }]}>
          <View style={styles.rowLeft}>
            <Clock size={18} color={colors.accentActive} strokeWidth={1.75} />
            <View style={{ marginLeft: spacing.sm }}>
              <Text
                style={[
                  styles.rowLabel,
                  { fontFamily: typography.fonts.bodyMedium, color: colors.textPrimary, fontSize: typography.sizes.base },
                ]}
              >
                Default Time (Date-Only)
              </Text>
              <Text
                style={[
                  styles.rowSubLabel,
                  { fontFamily: typography.fonts.bodyRegular, color: colors.textSecondary, fontSize: typography.sizes.xs },
                ]}
              >
                Used when commitments specify only a calendar day
              </Text>
            </View>
          </View>
          <Text
            style={[
              styles.rowValueMono,
              { fontFamily: typography.fonts.monoMedium, color: colors.accentActive, fontSize: typography.sizes.sm },
            ]}
          >
            {defaultDateOnlyTime}
          </Text>
        </View>

        {/* Quiet Hours Switch */}
        <View style={[styles.settingRow, { padding: spacing.base }]}>
          <View style={styles.rowLeft}>
            <Moon size={18} color={colors.accentActive} strokeWidth={1.75} />
            <View style={{ marginLeft: spacing.sm }}>
              <Text
                style={[
                  styles.rowLabel,
                  { fontFamily: typography.fonts.bodyMedium, color: colors.textPrimary, fontSize: typography.sizes.base },
                ]}
              >
                Quiet Hours
              </Text>
              <Text
                style={[
                  styles.rowSubLabel,
                  { fontFamily: typography.fonts.bodyRegular, color: colors.textSecondary, fontSize: typography.sizes.xs },
                ]}
              >
                Defers non-urgent advance alerts to {quietHoursRange}
              </Text>
            </View>
          </View>
          <Switch
            value={quietHoursEnabled}
            onValueChange={setQuietHoursEnabled}
            trackColor={{ false: colors.bgMuted, true: colors.accentActive }}
          />
        </View>
      </View>

      {/* 2. Notification & Permission Cards */}
      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            {
              fontFamily: typography.fonts.displaySemiBold,
              color: colors.textSecondary,
              fontSize: typography.sizes.xs,
              letterSpacing: typography.tracking.tight,
            },
          ]}
        >
          OS PERMISSIONS & DELIVERY
        </Text>
      </View>

      <View
        style={[
          styles.groupedCard,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderSubtle,
            borderRadius: radii.md,
            borderWidth: 1,
            marginBottom: spacing.lg,
            padding: spacing.base,
          },
        ]}
      >
        <View style={styles.statusRow}>
          <ShieldCheck size={18} color={colors.status.completed.text} strokeWidth={1.75} />
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text
              style={[
                styles.cardTitle,
                { fontFamily: typography.fonts.bodySemiBold, color: colors.textPrimary, fontSize: typography.sizes.sm },
              ]}
            >
              Notifications Active
            </Text>
            <Text
              style={[
                styles.cardDescription,
                { fontFamily: typography.fonts.bodyRegular, color: colors.textSecondary, fontSize: typography.sizes.xs },
              ]}
            >
              Registered channels: "Task Reminders" and "Urgent Deadline Reminders"
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.testButton,
            {
              backgroundColor: colors.bgMuted,
              borderColor: colors.borderSubtle,
              borderRadius: radii.sm,
              borderWidth: 1,
              marginTop: spacing.md,
              paddingVertical: spacing.sm,
              alignItems: 'center',
            },
          ]}
          onPress={onSendTestNotification}
        >
          <Text
            style={[
              styles.testButtonText,
              { fontFamily: typography.fonts.bodyMedium, color: colors.textPrimary, fontSize: typography.sizes.xs },
            ]}
          >
            Send Test Notification (in 5s)
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Appearance Theme */}
      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            {
              fontFamily: typography.fonts.displaySemiBold,
              color: colors.textSecondary,
              fontSize: typography.sizes.xs,
              letterSpacing: typography.tracking.tight,
            },
          ]}
        >
          APPEARANCE
        </Text>
      </View>

      <View
        style={[
          styles.groupedCard,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderSubtle,
            borderRadius: radii.md,
            borderWidth: 1,
            marginBottom: spacing.lg,
            padding: spacing.base,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accentLime }} />
          <Text style={{ fontFamily: typography.fonts.bodyMedium, color: colors.textPrimary, fontSize: 14 }}>
            Warm Obsidian & Luminous Chartreuse
          </Text></View>
      </View>

      {/* 4. Local-First Privacy & Ownership */}
      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            {
              fontFamily: typography.fonts.displaySemiBold,
              color: colors.textSecondary,
              fontSize: typography.sizes.xs,
              letterSpacing: typography.tracking.tight,
            },
          ]}
        >
          DATA OWNERSHIP & PRIVACY
        </Text>
      </View>

      <View
        style={[
          styles.groupedCard,
          {
            backgroundColor: colors.bgSurface,
            borderColor: colors.borderSubtle,
            borderRadius: radii.md,
            borderWidth: 1,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.settingRow, { padding: spacing.base, borderBottomColor: colors.borderSubtle, borderBottomWidth: 1 }]}
          onPress={onExportBackup}
        >
          <View style={styles.rowLeft}>
            <Download size={18} color={colors.accentActive} strokeWidth={1.75} />
            <Text
              style={[
                styles.rowLabel,
                { fontFamily: typography.fonts.bodyMedium, color: colors.textPrimary, fontSize: typography.sizes.base, marginLeft: spacing.sm },
              ]}
            >
              Export Local Backup (JSON)
            </Text>
          </View>
          <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.75} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingRow, { padding: spacing.base }]}
          onPress={onClearCompleted}
        >
          <View style={styles.rowLeft}>
            <Trash2 size={18} color={colors.status.overdue.text} strokeWidth={1.75} />
            <Text
              style={[
                styles.rowLabel,
                { fontFamily: typography.fonts.bodyMedium, color: colors.status.overdue.text, fontSize: typography.sizes.base, marginLeft: spacing.sm },
              ]}
            >
              Clear Completed Tasks
            </Text>
          </View>
          <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
  },
  sectionHeader: {
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    textTransform: 'uppercase',
  },
  groupedCard: {},
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowLabel: {},
  rowSubLabel: {
    marginTop: 2,
  },
  rowValueMono: {},
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {},
  cardDescription: {
    marginTop: 2,
  },
  testButton: {},
  testButtonText: {},
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeTabText: {},
});
