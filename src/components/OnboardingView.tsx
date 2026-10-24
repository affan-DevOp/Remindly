import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Share2, Clock, ShieldCheck, ArrowRight, Check, MessageSquare, Mail, Link2, Sparkles } from 'lucide-react-native';
import { useTheme } from '../theme';

export interface OnboardingViewProps {
  onGetStarted: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onGetStarted }) => {
  const { colors, typography, radii } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
      {/* Background Warm Ambient Glow */}
      <View style={[styles.ambientGlow, { backgroundColor: colors.bgAmbientGlow }]} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandRow}>
          <View style={[styles.brandDot, { backgroundColor: colors.accentLime }]} />
          <Text style={[styles.brandTitle, { fontFamily: typography.fonts.displayBold, color: colors.textPrimary }]}>
            Remindly
          </Text>
        </View>

        {/* Bespoke Vector Illustration Card: Message to Reminder Transformation */}
        <View style={[styles.illustrationCard, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
          {/* Floating Ingested Message Chips */}
          <View style={[styles.sourceChip, { top: 16, left: 16, backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle }]}>
            <MessageSquare size={13} color={colors.accentLime} />
            <Text style={[styles.sourceChipText, { color: colors.textSecondary }]}>Slack • "Review by 3 PM"</Text>
          </View>

          <View style={[styles.sourceChip, { top: 56, right: 16, backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle }]}>
            <Mail size={13} color="#60A5FA" />
            <Text style={[styles.sourceChipText, { color: colors.textSecondary }]}>Gmail • Contract Feedback</Text>
          </View>

          <View style={[styles.sourceChip, { top: 96, left: 24, backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle }]}>
            <Link2 size={13} color="#F472B6" />
            <Text style={[styles.sourceChipText, { color: colors.textSecondary }]}>Chrome • proposal.pdf</Text>
          </View>

          {/* Central Transformed Actionable Reminder Card */}
          <View style={[styles.resultingCard, { backgroundColor: colors.accentLime, shadowColor: colors.accentLime }]}>
            <View style={styles.resultingCardTop}>
              <View style={styles.resultingCheckCircle}>
                <Check size={14} color="#DDF247" strokeWidth={3} />
              </View>
              <Text style={[styles.resultingTag, { color: colors.accentLimeDarkText }]}>ACTIONABLE REMINDER</Text>
            </View>
            <Text style={[styles.resultingTitle, { color: colors.accentLimeDarkText, fontFamily: typography.fonts.displayBold }]}>
              Review Contract & Send Notes
            </Text>
            <Text style={[styles.resultingTime, { color: 'rgba(16, 20, 4, 0.75)' }]}>
              Today at 3:00 PM • 3 Alerts
            </Text>
          </View>
        </View>

        {/* Headline & Value Proposition */}
        <View style={styles.copyBlock}>
          <Text style={[styles.headline, { fontFamily: typography.fonts.displayBold, color: colors.textPrimary }]}>
            Catch it. Schedule it.{'\n'}Get it done.
          </Text>
          <Text style={[styles.subtext, { fontFamily: typography.fonts.bodyRegular, color: colors.textSecondary }]}>
            Turn messages, chats, and links into actionable follow-ups without losing their source context.
          </Text>
        </View>

        {/* 3 Core Value Pillars */}
        <View style={styles.pillarsContainer}>
          <View style={[styles.pillarRow, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
            <View style={[styles.pillarIconWrap, { backgroundColor: colors.bgMuted }]}>
              <Share2 size={18} color={colors.accentLime} />
            </View>
            <View style={styles.pillarTextCol}>
              <Text style={[styles.pillarTitle, { color: colors.textPrimary, fontFamily: typography.fonts.displaySemiBold }]}>
                1-Tap Share Capture
              </Text>
              <Text style={[styles.pillarSub, { color: colors.textMuted }]}>
                Share from Slack, WhatsApp, or Gmail straight into a quick follow-up.
              </Text>
            </View>
          </View>

          <View style={[styles.pillarRow, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
            <View style={[styles.pillarIconWrap, { backgroundColor: colors.bgMuted }]}>
              <Clock size={18} color={colors.accentLime} />
            </View>
            <View style={styles.pillarTextCol}>
              <Text style={[styles.pillarTitle, { color: colors.textPrimary, fontFamily: typography.fonts.displaySemiBold }]}>
                Local Date Extraction
              </Text>
              <Text style={[styles.pillarSub, { color: colors.textMuted }]}>
                Suggests deadlines on-device. You always review before scheduling.
              </Text>
            </View>
          </View>

          <View style={[styles.pillarRow, { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle }]}>
            <View style={[styles.pillarIconWrap, { backgroundColor: colors.bgMuted }]}>
              <ShieldCheck size={18} color={colors.accentLime} />
            </View>
            <View style={styles.pillarTextCol}>
              <Text style={[styles.pillarTitle, { color: colors.textPrimary, fontFamily: typography.fonts.displaySemiBold }]}>
                Zero Cloud Tracking
              </Text>
              <Text style={[styles.pillarSub, { color: colors.textMuted }]}>
                100% local-first SQLite storage. Your messages never leave your phone.
              </Text>
            </View>
          </View>
        </View>

        {/* Primary CTA Button: Luminous Chartreuse */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onGetStarted}
          style={[
            styles.ctaButton,
            {
              backgroundColor: colors.accentLime,
              borderRadius: 28,
              shadowColor: colors.accentLime,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Get Started with Remindly"
        >
          <Text style={[styles.ctaButtonText, { color: colors.accentLimeDarkText, fontFamily: typography.fonts.displayBold }]}>
            Get Started
          </Text>
          <ArrowRight size={18} color={colors.accentLimeDarkText} strokeWidth={2.5} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: 340,
    borderRadius: 170,
    opacity: 0.8,
    transform: [{ scaleX: 1.5 }],
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
    gap: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  brandTitle: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  illustrationCard: {
    width: '100%',
    height: 220,
    borderRadius: 28,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sourceChip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  sourceChipText: {
    fontSize: 11,
  },
  resultingCard: {
    width: '100%',
    padding: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    gap: 4,
  },
  resultingCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  resultingCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#101404',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultingTag: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  resultingTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  resultingTime: {
    fontSize: 12,
  },
  copyBlock: {
    gap: 10,
  },
  headline: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  subtext: {
    fontSize: 14,
    lineHeight: 21,
  },
  pillarsContainer: {
    gap: 10,
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  pillarIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTextCol: {
    flex: 1,
    gap: 2,
  },
  pillarTitle: {
    fontSize: 14,
  },
  pillarSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  ctaButton: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 8,
  },
  ctaButtonText: {
    fontSize: 16,
  },
});
