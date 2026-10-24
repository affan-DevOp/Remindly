import React from 'react';
import { StyleSheet, View, Text as RNText, Pressable, Platform, type TextProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react-native';
import { ConfirmationConfig } from './PopupTypes';

const C = {
  canvas: '#12100D',
  ink: '#F4EEDC',
  ink2: '#D2CBB9',
  muted: '#8E8779',
  lime: '#E0F34A',
  black: '#0D0B08',
  red: '#EB5E55',
};

function Text(props: TextProps) {
  return <RNText {...props} style={[{ fontFamily: 'PlusJakartaSans_500Medium' }, props.style]} />;
}

export function ConfirmationDialog({
  config,
  onClose,
}: {
  config: ConfirmationConfig;
  onClose: () => void;
}) {
  const handleConfirm = () => {
    config.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    config.onCancel?.();
    onClose();
  };

  const isDestructive = config.isDestructive ?? false;

  return (
    <View style={styles.dialogOverlay}>
      <Pressable style={styles.dialogScrim} onPress={handleCancel} accessibilityLabel="Cancel dialog" />
      <View style={styles.dialogCardWrap}>
        <View style={styles.dialogCard}>
          <LinearGradient
            colors={
              isDestructive
                ? ['rgba(54, 30, 26, 0.98)', 'rgba(32, 22, 20, 0.99)']
                : ['rgba(44, 38, 29, 0.98)', 'rgba(28, 24, 19, 0.99)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View
            pointerEvents="none"
            style={[
              styles.dialogGlow,
              { backgroundColor: isDestructive ? 'rgba(235, 94, 85, 0.15)' : 'rgba(224, 243, 74, 0.12)' },
            ]}
          />

          <View style={styles.dialogHeader}>
            <View
              style={[
                styles.dialogIconWrap,
                { backgroundColor: isDestructive ? 'rgba(235, 94, 85, 0.14)' : 'rgba(224, 243, 74, 0.12)' },
              ]}
            >
              {isDestructive ? (
                <Trash2 size={20} color={C.red} />
              ) : (
                <AlertTriangle size={20} color={C.lime} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dialogTitle}>{config.title}</Text>
              <Text style={styles.dialogMessage}>{config.message}</Text>
            </View>
          </View>

          <View style={styles.dialogActions}>
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => [styles.dialogCancelButton, pressed && { opacity: 0.8 }]}
              accessibilityLabel={config.cancelLabel}
            >
              <Text style={styles.dialogCancelText}>{config.cancelLabel}</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => [
                styles.dialogConfirmButton,
                isDestructive ? styles.dialogConfirmDestructive : styles.dialogConfirmStandard,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityLabel={config.confirmLabel}
            >
              <Text
                style={[
                  styles.dialogConfirmText,
                  { color: isDestructive ? '#FFFFFF' : C.black },
                ]}
              >
                {config.confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dialogOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  dialogScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 5, 4, 0.76)',
  },
  dialogCardWrap: {
    width: '100%',
    maxWidth: 380,
  },
  dialogCard: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 16,
  },
  dialogGlow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  dialogIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dialogTitle: {
    color: C.ink,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  dialogMessage: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  dialogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 22,
  },
  dialogCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dialogCancelText: {
    color: C.ink2,
    fontSize: 13,
    fontWeight: '600',
  },
  dialogConfirmButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dialogConfirmStandard: {
    backgroundColor: C.lime,
  },
  dialogConfirmDestructive: {
    backgroundColor: C.red,
  },
  dialogConfirmText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
