import React from 'react';
import { StyleSheet, View, Text as RNText, Pressable, Platform, type TextProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Bell, ShieldCheck, Flame, ArrowRight } from 'lucide-react-native';

const C = {
  canvas: '#12100D',
  ink: '#F4EEDC',
  ink2: '#D2CBB9',
  muted: '#8E8779',
  lime: '#E0F34A',
  black: '#0D0B08',
  green: '#78D4A0',
};

function Text(props: TextProps) {
  return <RNText {...props} style={[{ fontFamily: 'PlusJakartaSans_500Medium' }, props.style]} />;
}

export function PermissionExplainerSheet({
  blurTarget,
  bottomInset = 20,
  onEnable,
  onClose,
}: {
  blurTarget?: React.RefObject<any>;
  bottomInset?: number;
  onEnable: () => void;
  onClose: () => void;
}) {
  return (
    <View style={styles.sheetOverlay}>
      <Pressable style={styles.sheetScrim} onPress={onClose} accessibilityLabel="Dismiss permission explanation" />
      <View style={[styles.sheetCard, { paddingBottom: Math.max(bottomInset, 20) + 14 }]}>
        <BlurView
          blurTarget={blurTarget}
          intensity={Platform.OS === 'web' ? 50 : 64}
          tint="dark"
          blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : 'none'}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(53, 44, 31, 0.94)', 'rgba(29, 25, 20, 0.97)', 'rgba(22, 19, 15, 0.99)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.sheetHandle} />

        <View style={styles.heroRow}>
          <View style={styles.heroIconWrap}>
            <Bell size={24} color={C.black} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>LOCAL-ONLY ALARMS</Text>
            </View>
            <Text style={styles.sheetTitle}>Never miss an important promise</Text>
          </View>
        </View>

        <Text style={styles.sheetDescription}>
          Remindly triggers alerts locally from your device when tasks are due. Your messages and notes stay completely on your device without cloud sync.
        </Text>

        <View style={styles.channelCards}>
          <View style={styles.channelCard}>
            <View style={styles.channelIconStandard}>
              <Bell size={16} color={C.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.channelTitle}>Standard Reminders</Text>
              <Text style={styles.channelDetail}>Single pulse alert for normal tasks and advance nudges.</Text>
            </View>
          </View>

          <View style={styles.channelCard}>
            <View style={styles.channelIconUrgent}>
              <Flame size={16} color={C.lime} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.channelTitle}>Important Deadlines</Text>
              <Text style={styles.channelDetail}>Distinctive 2-pulse haptic alert right at the deadline.</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.8 }]}
            accessibilityLabel="Not now"
          >
            <Text style={styles.secondaryButtonText}>Not now</Text>
          </Pressable>

          <Pressable
            onPress={onEnable}
            style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
            accessibilityLabel="Enable notifications"
          >
            <Text style={styles.primaryButtonText}>Enable notifications</Text>
            <ArrowRight size={15} color={C.black} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 110,
    justifyContent: 'flex-end',
  },
  sheetScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 5, 4, 0.72)',
  },
  sheetCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 22,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 20,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignSelf: 'center',
    marginBottom: 18,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.lime,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.lime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.green,
  },
  badgeText: {
    color: C.green,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sheetTitle: {
    color: C.ink,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 23,
  },
  sheetDescription: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  channelCards: {
    gap: 10,
    marginBottom: 22,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  channelIconStandard: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(120, 212, 160, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelIconUrgent: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(224, 243, 74, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelTitle: {
    color: C.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  channelDetail: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  secondaryButtonText: {
    color: C.ink2,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.lime,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: C.lime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: C.black,
    fontSize: 13,
    fontWeight: '800',
  },
});
