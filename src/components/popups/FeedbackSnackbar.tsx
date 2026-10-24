import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text as RNText, Pressable, Animated, Platform, type TextProps } from 'react-native';
import { CheckCircle2, Clock3, Trash2, Info } from 'lucide-react-native';
import { SnackbarState } from './PopupTypes';

const C = {
  ink: '#F4EEDC',
  ink2: '#D2CBB9',
  lime: '#E0F34A',
  green: '#78D4A0',
  amber: '#D9B57D',
  red: '#EB5E55',
  black: '#0D0B08',
};

function Text(props: TextProps) {
  return <RNText {...props} style={[{ fontFamily: 'PlusJakartaSans_600SemiBold' }, props.style]} />;
}

export function FeedbackSnackbar({
  snackbar,
  onDismiss,
  bottomInset = 20,
}: {
  snackbar: SnackbarState | null;
  onDismiss: () => void;
  bottomInset?: number;
}) {
  const translateY = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (snackbar) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      const timeoutMs = snackbar.duration || (snackbar.actionLabel ? 5500 : 3200);
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 24,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDismiss();
        });
      }, timeoutMs);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(24);
      opacity.setValue(0);
    }
  }, [snackbar, onDismiss, translateY, opacity]);

  if (!snackbar) return null;

  const renderIcon = () => {
    switch (snackbar.icon) {
      case 'clock':
        return <Clock3 size={16} color={C.amber} />;
      case 'trash':
        return <Trash2 size={16} color={C.red} />;
      case 'info':
        return <Info size={16} color={C.ink2} />;
      case 'check':
      default:
        return <CheckCircle2 size={16} color={C.lime} />;
    }
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.snackbarWrap,
        {
          bottom: Math.max(bottomInset, 42) + 68,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.snackbar}>
        <View style={styles.snackbarIcon}>{renderIcon()}</View>
        <Text style={styles.snackbarText} numberOfLines={2}>
          {snackbar.message}
        </Text>
        {snackbar.actionLabel && snackbar.onAction ? (
          <Pressable
            onPress={() => {
              snackbar.onAction?.();
              onDismiss();
            }}
            style={({ pressed }) => [styles.snackbarAction, pressed && { opacity: 0.7 }]}
            accessibilityLabel={snackbar.actionLabel}
          >
            <Text style={styles.snackbarActionText}>{snackbar.actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  snackbarWrap: {
    position: 'absolute',
    left: 18,
    right: 18,
    zIndex: 90,
    alignItems: 'center',
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(32, 28, 22, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(224, 243, 74, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: 420,
    width: '100%',
  },
  snackbarIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snackbarText: {
    flex: 1,
    color: C.ink,
    fontSize: 12,
    lineHeight: 17,
  },
  snackbarAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(224, 243, 74, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(224, 243, 74, 0.25)',
  },
  snackbarActionText: {
    color: C.lime,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
