import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Sun, CheckCircle2, ArrowRight, Sparkles, Clock } from 'lucide-react-native';
import { useTheme } from '../theme';

export interface WelcomeOnboardingModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const WelcomeOnboardingModal: React.FC<WelcomeOnboardingModalProps> = ({
  visible,
  onDismiss,
}) => {
  const { colors, typography, radii } = useTheme();

  if (!visible) return null;

  const content = (
    <View
      style={[
        styles.overlay,
        Platform.OS === 'web' && ({
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        } as any),
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onDismiss}
        style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.85)' }]}
      />

      {/* Opening Page Container (Sage Green from Dribbble shot 2) */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: '#EBF3EA', // Soft Sage Green from Image 2
            borderRadius: 36,
            width: '100%',
            maxWidth: 400,
            zIndex: 10000,
          },
        ]}
      >
        {/* Top Header Branding */}
        <View style={styles.topHeader}>
          <Text style={[styles.brandTitle, { fontFamily: typography.fonts.displayBold }]}>
            Timezy
          </Text>
          <View style={styles.sunIconWrap}>
            <Sun size={20} color="#FBBF24" fill="#FBBF24" />
          </View>
        </View>

        {/* Center Illustration Artwork simulation */}
        <View style={styles.illustrationCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.joinSpeechBubble}>
              <Text style={styles.joinText}>Join</Text>
            </View>
            <View style={styles.avatarCircle}>
              <Clock size={40} color="#0F2A15" strokeWidth={1.75} />
            </View>
          </View>
        </View>

        {/* Hero Copy */}
        <View style={styles.copyBlock}>
          <Text style={[styles.heroHeadline, { fontFamily: typography.fonts.displayBold }]}>
            Schedule Smarter,{'\n'}Work Better
          </Text>
          <Text style={[styles.heroSubtext, { fontFamily: typography.fonts.bodyRegular }]}>
            You can check and handle your project schedules in a more convenient way. Never lose a follow-up hidden in a message.
          </Text>
        </View>

        {/* Signature Dark Forest Green Pill Button ("Let's Go" from Image 2) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onDismiss}
          style={[
            styles.letsGoButton,
            {
              backgroundColor: '#0F2A15', // Deep Forest Green from Image 2
              borderRadius: 28,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Let's Go"
        >
          <Text style={[styles.letsGoText, { fontFamily: typography.fonts.displaySemiBold }]}>
            Let's Go
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return Platform.OS === 'web' ? (
    content
  ) : (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      {content}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill as any,
  },
  card: {
    padding: 28,
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  topHeader: {
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 28,
    color: '#0F2A15',
    letterSpacing: -0.5,
  },
  sunIconWrap: {
    position: 'absolute',
    top: -6,
    right: -40,
  },
  illustrationCard: {
    width: '100%',
    height: 180,
    backgroundColor: '#DFEAE0',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarWrap: {
    alignItems: 'center',
    position: 'relative',
  },
  joinSpeechBubble: {
    position: 'absolute',
    top: -20,
    left: -32,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0F2A15',
  },
  joinText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F2A15',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F2A15',
  },
  copyBlock: {
    alignItems: 'center',
    gap: 10,
    textAlign: 'center',
  },
  heroHeadline: {
    fontSize: 24,
    lineHeight: 30,
    color: '#0F2A15',
    textAlign: 'center',
  },
  heroSubtext: {
    fontSize: 13,
    lineHeight: 19,
    color: '#3A5240',
    textAlign: 'center',
  },
  letsGoButton: {
    width: '100%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  letsGoText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
