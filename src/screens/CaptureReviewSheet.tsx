import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Check,
  Calendar,
  Clock,
  ExternalLink,
  ChevronDown,
  Layers,
  AlertCircle,
  Share2,
} from 'lucide-react-native';
import { useTheme } from '../theme';
import { BUILTIN_PROFILES } from '../mocks/phase1Fixtures';

export interface CaptureReviewSheetProps {
  visible: boolean;
  initialTitle?: string;
  initialSourceApp?: string;
  initialExcerpt?: string;
  initialUrl?: string;
  matchedPhrase?: string;
  resolvedDateTimeStr?: string;
  isDateOnly?: boolean;
  onDismiss: () => void;
  onSaveReminder: (payload: {
    title: string;
    profileId: string;
    deadlineStr: string;
    isDateOnly: boolean;
  }) => void;
  onSaveToInbox: (payload: { title: string }) => void;
  onOpenFullApp?: () => void;
}

export const CaptureReviewSheet: React.FC<CaptureReviewSheetProps> = ({
  visible,
  initialTitle = 'Review contract proposal',
  initialSourceApp = 'Slack',
  initialExcerpt = 'Can we review the revised contract proposal tomorrow by 3 PM?',
  initialUrl,
  matchedPhrase = 'tomorrow by 3 PM',
  resolvedDateTimeStr = 'Sat, 25 Oct 2026 - 15:00',
  isDateOnly = false,
  onDismiss,
  onSaveReminder,
  onSaveToInbox,
  onOpenFullApp,
}) => {
  const { colors, typography, radii } = useTheme();

  const [title, setTitle] = useState(initialTitle);
  const [selectedProfileId, setSelectedProfileId] = useState('builtin_standard');
  const [currentDeadlineStr, setCurrentDeadlineStr] = useState(resolvedDateTimeStr);
  const [excerptExpanded, setExcerptExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!visible) return null;

  const selectedProfile = BUILTIN_PROFILES.find((p) => p.id === selectedProfileId) || BUILTIN_PROFILES[1];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onSaveReminder({
          title: title.trim() || initialTitle,
          profileId: selectedProfileId,
          deadlineStr: currentDeadlineStr,
          isDateOnly,
        });
      }, 500);
    }, 450);
  };

  const modalBody = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.overlay,
        Platform.OS === 'web' && ({
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          justifyContent: 'flex-end',
          alignItems: 'center',
        } as any),
      ]}
    >
      <TouchableOpacity activeOpacity={1} onPress={onDismiss} style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />

      {/* Compact Smoked-Glass Quick Capture Sheet */}
      <View
        style={[
          styles.sheetContainer,
          {
            backgroundColor: '#1E1A16', // Deep smoked charcoal/espresso
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
          },
        ]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header Row: Identity + Source Origin + Close */}
          <View style={styles.headerRow}>
            <View style={styles.brandingGroup}>
              <View style={[styles.brandDot, { backgroundColor: colors.accentLime }]} />
              <Text style={[styles.brandText, { color: colors.textPrimary, fontFamily: typography.fonts.displayBold }]}>
                Remindly Capture
              </Text>
              {initialSourceApp ? (
                <View style={[styles.sourcePill, { backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.sourcePillText, { color: colors.textSecondary }]}>
                    From {initialSourceApp}
                  </Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.closeBtn}>
              <X size={16} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Pre-filled Editable Task Title */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>REMINDER TITLE</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What needs follow-up?"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.titleInput,
                {
                  color: colors.textPrimary,
                  fontFamily: typography.fonts.displaySemiBold,
                  backgroundColor: colors.bgElevated,
                  borderColor: colors.borderSubtle,
                  borderRadius: 14,
                },
              ]}
              multiline
            />
          </View>

          {/* Verified Deadline Confirmation Chip */}
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>DETECTED DEADLINE</Text>
            <View style={[styles.deadlineContainer, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle, borderRadius: 14 }]}>
              <View style={styles.deadlineInfoRow}>
                <Clock size={16} color={colors.accentLime} strokeWidth={2.2} />
                <Text style={[styles.deadlineText, { color: colors.textPrimary, fontFamily: typography.fonts.monoMedium }]}>
                  {currentDeadlineStr}
                </Text>
              </View>

              {/* Quick Shift Chips */}
              <View style={styles.quickShiftsRow}>
                <TouchableOpacity
                  onPress={() => setCurrentDeadlineStr('Sat, 25 Oct 2026 - 16:00')}
                  style={[styles.shiftChip, { backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle }]}
                >
                  <Text style={[styles.shiftChipText, { color: colors.textSecondary }]}>+1h</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCurrentDeadlineStr('Sat, 25 Oct 2026 - 21:00')}
                  style={[styles.shiftChip, { backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle }]}
                >
                  <Text style={[styles.shiftChipText, { color: colors.textSecondary }]}>Tonight</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCurrentDeadlineStr('Sun, 26 Oct 2026 - 09:00')}
                  style={[styles.shiftChip, { backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle }]}
                >
                  <Text style={[styles.shiftChipText, { color: colors.textSecondary }]}>Tomorrow</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Collapsible Source Message Excerpt */}
          {initialExcerpt ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setExcerptExpanded(!excerptExpanded)}
              style={[styles.excerptCard, { backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle }]}
            >
              <View style={styles.excerptHeader}>
                <Text style={[styles.excerptLabel, { color: colors.textMuted }]}>
                  ORIGINAL MESSAGE EXCERPT
                </Text>
                <ChevronDown size={14} color={colors.textMuted} style={excerptExpanded && { transform: [{ rotate: '180deg' }] }} />
              </View>
              <Text
                style={[styles.excerptBody, { color: colors.textSecondary, fontFamily: typography.fonts.bodyRegular }]}
                numberOfLines={excerptExpanded ? undefined : 2}
              >
                "{initialExcerpt}"
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Preselected Profile Chip */}
          <View style={styles.profileRow}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>ALERT CADENCE</Text>
            <View style={styles.profileGroup}>
              {BUILTIN_PROFILES.map((p) => {
                const isSelected = p.id === selectedProfileId;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setSelectedProfileId(p.id)}
                    style={[
                      styles.profileChip,
                      {
                        backgroundColor: isSelected ? colors.accentLime : colors.bgElevated,
                        borderColor: isSelected ? colors.accentLime : colors.borderSubtle,
                        borderRadius: 10,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.profileChipText,
                        {
                          color: isSelected ? colors.accentLimeDarkText : colors.textSecondary,
                          fontFamily: isSelected ? typography.fonts.displayBold : typography.fonts.bodyMedium,
                        },
                      ]}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Action Row: Primary Chartreuse Save Button + Secondary Full Editor */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={isSaving || saveSuccess}
              style={[
                styles.saveButton,
                {
                  backgroundColor: colors.accentLime,
                  borderRadius: 24,
                  shadowColor: colors.accentLime,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save Reminder"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.accentLimeDarkText} />
              ) : saveSuccess ? (
                <View style={styles.btnContentRow}>
                  <Check size={16} color={colors.accentLimeDarkText} strokeWidth={3} />
                  <Text style={[styles.saveButtonText, { color: colors.accentLimeDarkText, fontFamily: typography.fonts.displayBold }]}>
                    Saved
                  </Text>
                </View>
              ) : (
                <Text style={[styles.saveButtonText, { color: colors.accentLimeDarkText, fontFamily: typography.fonts.displayBold }]}>
                  Save Reminder
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity onPress={() => onSaveToInbox({ title })} style={styles.secondaryTextBtn}>
                <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>Save to Inbox</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onDismiss();
                  onOpenFullApp?.();
                }}
                style={styles.secondaryTextBtn}
              >
                <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>Open Full App →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );

  return Platform.OS === 'web' ? (
    modalBody
  ) : (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      {modalBody}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '88%',
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 10000,
  },
  scrollContent: {
    padding: 24,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  brandText: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  sourcePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  sourcePillText: {
    fontSize: 11,
  },
  closeBtn: {
    padding: 4,
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    fontWeight: 'bold',
  },
  titleInput: {
    fontSize: 16,
    padding: 14,
    borderWidth: 1,
    minHeight: 52,
  },
  deadlineContainer: {
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  deadlineInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deadlineText: {
    fontSize: 14,
  },
  quickShiftsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  shiftChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  shiftChipText: {
    fontSize: 11,
  },
  excerptCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  excerptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  excerptLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  excerptBody: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  profileRow: {
    gap: 6,
  },
  profileGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  profileChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  profileChipText: {
    fontSize: 11,
  },
  actionRow: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    width: '100%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveButtonText: {
    fontSize: 16,
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  secondaryTextBtn: {
    paddingVertical: 4,
  },
  secondaryText: {
    fontSize: 12,
  },
});
