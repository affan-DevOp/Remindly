import React from 'react';
import { StyleSheet, View, Text as RNText, Pressable, Platform, ScrollView, type TextProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Check, X, Bell } from 'lucide-react-native';
import { SelectorConfig } from './PopupTypes';

const C = {
  canvas: '#12100D',
  ink: '#F4EEDC',
  ink2: '#D2CBB9',
  muted: '#8E8779',
  lime: '#E0F34A',
  black: '#0D0B08',
};

function Text(props: TextProps) {
  return <RNText {...props} style={[{ fontFamily: 'PlusJakartaSans_500Medium' }, props.style]} />;
}

export function ContextualSelector({
  config,
  blurTarget,
  bottomInset = 20,
}: {
  config: SelectorConfig;
  blurTarget?: React.RefObject<any>;
  bottomInset?: number;
}) {
  return (
    <View style={styles.selectorOverlay}>
      <Pressable style={styles.selectorScrim} onPress={config.onClose} accessibilityLabel="Close selector" />
      <View style={[styles.selectorSheet, { paddingBottom: Math.max(bottomInset, 20) + 12 }]}>
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
        <View style={styles.selectorHandle} />

        <View style={styles.selectorHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectorTitle}>{config.title}</Text>
            {config.subtitle ? <Text style={styles.selectorSubtitle}>{config.subtitle}</Text> : null}
          </View>
          <Pressable onPress={config.onClose} style={styles.selectorCloseButton} accessibilityLabel="Close">
            <X size={17} color={C.muted} />
          </Pressable>
        </View>

        <ScrollView style={styles.selectorList} contentContainerStyle={styles.selectorListContent}>
          {config.options.map((option) => {
            const isSelected = Boolean(option.selected);
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  config.onSelect(option.value);
                  config.onClose();
                }}
                style={({ pressed }) => [
                  styles.selectorOption,
                  isSelected && styles.selectorOptionSelected,
                  pressed && { opacity: 0.8 },
                ]}
                accessibilityLabel={`${option.label}: ${option.detail || ''}`}
              >
                <View
                  style={[
                    styles.selectorOptionIconWrap,
                    isSelected && { backgroundColor: C.lime },
                  ]}
                >
                  {isSelected ? (
                    <Check size={14} color={C.black} strokeWidth={2.5} />
                  ) : (
                    <Bell size={13} color={option.accentColor || C.muted} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.selectorOptionLabel, isSelected && { color: C.lime }]}>
                    {option.label}
                  </Text>
                  {option.detail ? (
                    <Text style={styles.selectorOptionDetail}>{option.detail}</Text>
                  ) : null}
                </View>

                {isSelected ? (
                  <View style={styles.selectorActiveMark}>
                    <Text style={styles.selectorActiveText}>ACTIVE</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  selectorOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 115,
    justifyContent: 'flex-end',
  },
  selectorScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 5, 4, 0.7)',
  },
  selectorSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  selectorHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectorTitle: {
    color: C.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  selectorSubtitle: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  selectorCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectorList: {
    maxHeight: 380,
  },
  selectorListContent: {
    gap: 8,
    paddingBottom: 8,
  },
  selectorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectorOptionSelected: {
    backgroundColor: 'rgba(224, 243, 74, 0.06)',
    borderColor: 'rgba(224, 243, 74, 0.28)',
  },
  selectorOptionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectorOptionLabel: {
    color: C.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  selectorOptionDetail: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  selectorActiveMark: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(224, 243, 74, 0.12)',
  },
  selectorActiveText: {
    color: C.lime,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
