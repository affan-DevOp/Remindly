import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ExternalLink, Copy, Check, MessageSquare, Mail, Globe, Hash } from 'lucide-react-native';
import { useTheme } from '../theme';

export interface SourceProvenanceCardProps {
  sourceAppLabel?: string;
  sourceUrl?: string;
  sourceExcerpt?: string;
  senderLabel?: string;
  subject?: string;
  style?: ViewStyle;
  onOpenUrl?: (url: string) => void;
  onCopyExcerpt?: (text: string) => void;
}

export const SourceProvenanceCard: React.FC<SourceProvenanceCardProps> = ({
  sourceAppLabel,
  sourceUrl,
  sourceExcerpt,
  senderLabel,
  subject,
  style,
  onOpenUrl,
  onCopyExcerpt,
}) => {
  const { colors, typography, spacing, radii } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!sourceExcerpt && !sourceUrl && !sourceAppLabel) {
    return null;
  }

  const handleCopy = () => {
    if (sourceExcerpt) {
      onCopyExcerpt?.(sourceExcerpt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasValidUrl = !!sourceUrl && (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://'));

  const getSourceIcon = () => {
    const label = (sourceAppLabel || '').toLowerCase();
    if (label.includes('mail') || label.includes('gmail') || label.includes('outlook')) {
      return <Mail size={12} color={colors.textSecondary} strokeWidth={1.75} />;
    }
    if (label.includes('slack') || label.includes('teams')) {
      return <Hash size={12} color={colors.textSecondary} strokeWidth={1.75} />;
    }
    if (label.includes('chrome') || label.includes('browser') || label.includes('web')) {
      return <Globe size={12} color={colors.textSecondary} strokeWidth={1.75} />;
    }
    return <MessageSquare size={12} color={colors.textSecondary} strokeWidth={1.75} />;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgMuted,
          borderColor: colors.borderSubtle,
          borderLeftColor: colors.accentActive,
          borderLeftWidth: 3,
          borderRadius: radii.sm,
          padding: spacing.md,
        },
        style,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Source context from ${sourceAppLabel || 'shared message'}`}
    >
      {/* Header Row: Source Pill & Sender/Subject */}
      <View style={styles.headerRow}>
        <View style={styles.appBadgeRow}>
          {getSourceIcon()}
          <Text
            style={[
              styles.appBadgeText,
              {
                fontFamily: typography.fonts.bodySemiBold,
                color: colors.textPrimary,
                fontSize: typography.sizes.xs,
                marginLeft: spacing.xs,
              },
            ]}
          >
            {sourceAppLabel || 'Shared Note'}
          </Text>
        </View>

        {senderLabel ? (
          <Text
            style={[
              styles.senderText,
              {
                fontFamily: typography.fonts.bodyMedium,
                color: colors.textSecondary,
                fontSize: typography.sizes.xs,
              },
            ]}
            numberOfLines={1}
          >
            {senderLabel}
          </Text>
        ) : null}
      </View>

      {/* Subject Line if present */}
      {subject ? (
        <Text
          style={[
            styles.subjectText,
            {
              fontFamily: typography.fonts.bodySemiBold,
              color: colors.textPrimary,
              fontSize: typography.sizes.sm,
              marginTop: spacing.xs,
            },
          ]}
          numberOfLines={1}
        >
          {subject}
        </Text>
      ) : null}

      {/* Excerpt with tap-to-expand */}
      {sourceExcerpt ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setExpanded(!expanded)}
          style={{ marginTop: spacing.xs }}
          accessibilityRole="button"
          accessibilityLabel="Toggle excerpt expansion"
        >
          <Text
            style={[
              styles.excerptText,
              {
                fontFamily: typography.fonts.bodyRegular,
                color: colors.textSecondary,
                fontSize: typography.sizes.sm,
                lineHeight: typography.lineHeights.sm,
              },
            ]}
            numberOfLines={expanded ? undefined : 2}
          >
            "{sourceExcerpt}"
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Action Footer: Open Link (if valid URL) or Copy Excerpt fallback */}
      <View style={[styles.actionRow, { marginTop: spacing.sm }]}>
        {hasValidUrl ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderSubtle,
                borderRadius: radii.xs,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              },
            ]}
            onPress={() => onOpenUrl?.(sourceUrl)}
            accessibilityRole="button"
            accessibilityLabel="Open source URL"
          >
            <ExternalLink size={12} color={colors.accentActive} strokeWidth={1.75} />
            <Text
              style={[
                styles.actionButtonText,
                {
                  fontFamily: typography.fonts.bodyMedium,
                  color: colors.accentActive,
                  fontSize: typography.sizes.xs,
                  marginLeft: spacing.xs,
                },
              ]}
              numberOfLines={1}
            >
              Open Source URL
            </Text>
          </TouchableOpacity>
        ) : null}

        {sourceExcerpt ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderSubtle,
                borderRadius: radii.xs,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                marginLeft: hasValidUrl ? spacing.sm : 0,
              },
            ]}
            onPress={handleCopy}
            accessibilityRole="button"
            accessibilityLabel="Copy message excerpt"
          >
            {copied ? (
              <Check size={12} color={colors.status.completed.text} strokeWidth={1.75} />
            ) : (
              <Copy size={12} color={colors.textSecondary} strokeWidth={1.75} />
            )}
            <Text
              style={[
                styles.actionButtonText,
                {
                  fontFamily: typography.fonts.bodyMedium,
                  color: copied ? colors.status.completed.text : colors.textSecondary,
                  fontSize: typography.sizes.xs,
                  marginLeft: spacing.xs,
                },
              ]}
            >
              {copied ? 'Copied' : 'Copy Excerpt'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appBadgeText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  senderText: {
    maxWidth: '55%',
  },
  subjectText: {},
  excerptText: {
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  actionButtonText: {},
});
