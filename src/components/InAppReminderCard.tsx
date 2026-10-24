import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Check, Clock, Bell, MessageSquare, AlertCircle, X } from 'lucide-react-native';
import { useTheme } from '../theme';

export interface InAppReminderCardProps {
  visible: boolean;
  taskTitle?: string;
  sourceApp?: string;
  sourceExcerpt?: string;
  dueTimeStr?: string;
  urgencyText?: string;
  onDone: () => void;
  onSnooze: (minutes: number) => void;
  onDismiss: () => void;
}

export const InAppReminderCard: React.FC<InAppReminderCardProps> = ({
  visible,
  taskTitle = 'Review revised consulting agreement',
  sourceApp = 'WhatsApp',
  sourceExcerpt = 'Can we review the revised contract proposal by 3 PM?',
  dueTimeStr = 'Today at 3:00 PM',
  urgencyText = 'Due in 28 minutes',
  onDone,
  onSnooze,
  onDismiss,
}) => {
  const { colors, typography, radii } = useTheme();

  if (!visible) return null;

  const cardBody = (
    <View style={styles.overlay}>
      <TouchableOpacity activeOpacity={1} onPress={onDismiss} style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />

      {/* Android Floating Smoked Glass Reminder Card (NO iOS Dynamic Island) */}
      <View
        style={[
          styles.cardContainer,
          {
            backgroundColor: '#1E1A16', // Deep smoked charcoal/espresso
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 24,
            shadowColor: '#000000',
          },
        ]}
      >
        {/* Top Header: Brand glyph + Source Badge + Close */}
        <View style={styles.topRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.bellWrap, { backgroundColor: colors.bgMuted, borderRadius: radii.full }]}>
              <Bell size={14} color={colors.accentLime} strokeWidth={2.2} />
            </View>
            <View style={[styles.sourceBadge, { backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle }]}>
              <MessageSquare size={10} color={colors.textSecondary} />
              <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
                From {sourceApp}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.closeBtn}>
            <X size={16} color={colors.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Task Title & Supporting Source Excerpt */}
        <View style={styles.contentSection}>
          <Text style={[styles.taskTitle, { color: colors.textPrimary, fontFamily: typography.fonts.displayBold }]}>
            {taskTitle}
          </Text>
          <Text style={[styles.sourceExcerpt, { color: colors.textSecondary, fontFamily: typography.fonts.bodyRegular }]} numberOfLines={2}>
            "{sourceExcerpt}"
          </Text>
        </View>

        {/* Time & Urgency Pill Row */}
        <View style={styles.statusRow}>
          <View style={[styles.timeChip, { backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle }]}>
            <Clock size={12} color={colors.accentLime} strokeWidth={2} />
            <Text style={[styles.timeText, { color: colors.textPrimary, fontFamily: typography.fonts.monoMedium }]}>
              {dueTimeStr}
            </Text>
          </View>

          <View style={[styles.urgencyChip, { backgroundColor: colors.status.warning.bg, borderColor: colors.status.warning.border }]}>
            <AlertCircle size={12} color={colors.status.warning.text} strokeWidth={2} />
            <Text style={[styles.urgencyText, { color: colors.status.warning.text, fontFamily: typography.fonts.bodyMedium }]}>
              {urgencyText}
            </Text>
          </View>
        </View>

        {/* Dual Pill Actions: Luminous Chartreuse "Done" + Outlined "Remind me in 1h" */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onDone}
            style={[
              styles.doneButton,
              {
                backgroundColor: colors.accentLime,
                borderRadius: 24,
                shadowColor: colors.accentLime,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Check size={16} color={colors.accentLimeDarkText} strokeWidth={3} />
            <Text style={[styles.doneButtonText, { color: colors.accentLimeDarkText, fontFamily: typography.fonts.displayBold }]}>
              Done
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onSnooze(60)}
            style={[
              styles.snoozeButton,
              {
                backgroundColor: colors.bgMuted,
                borderColor: colors.borderSubtle,
                borderRadius: 24,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Remind me in 1 hour"
          >
            <Text style={[styles.snoozeButtonText, { color: colors.textPrimary, fontFamily: typography.fonts.bodyMedium }]}>
              Remind me in 1h
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return Platform.OS === 'web' ? (
    cardBody
  ) : (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      {cardBody}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 22,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
    gap: 16,
    zIndex: 10000,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  sourceText: {
    fontSize: 11,
  },
  closeBtn: {
    padding: 4,
  },
  contentSection: {
    gap: 6,
  },
  taskTitle: {
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.3,
  },
  sourceExcerpt: {
    fontSize: 13,
    lineHeight: 18,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 11,
  },
  urgencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  doneButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    fontSize: 15,
  },
  snoozeButton: {
    flex: 1.2,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  snoozeButtonText: {
    fontSize: 14,
  },
});
