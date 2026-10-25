import type { AppTheme } from '@/theme';
import type { DesignStyle } from '@/lib/preferences';

import { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

import { neu, FONT, makeTheme, useAppTheme } from '@/theme';

import { Icon } from './ui';

// ----------------------------------------------------------------------

export const DESIGN_STYLE_OPTIONS: { value: DesignStyle; label: string; caption: string }[] = [
  { value: 'neumorphism', label: 'Neumorphism', caption: 'Soft & extruded' },
  { value: 'glassmorphism', label: 'Glassmorphism', caption: 'Frosted glass' },
  { value: 'claymorphism', label: 'Claymorphism', caption: 'Puffy clay' },
  { value: 'skeuomorphism', label: 'Skeuomorphism', caption: 'Real materials' },
];

/**
 * 2×2 grid of design-style cards. Each card shows a tiny scene (a raised card, a pressed-in
 * field and a button) drawn in that style, in the current light/dark mode.
 */
export function DesignStylePicker({ value, onChange }: { value: DesignStyle; onChange: (style: DesignStyle) => void }) {
  const theme = useAppTheme();
  const previews = useMemo(
    () => Object.fromEntries(DESIGN_STYLE_OPTIONS.map((o) => [o.value, makeTheme(theme.dark, o.value)])),
    [theme.dark]
  ) as Record<DesignStyle, AppTheme>;

  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {DESIGN_STYLE_OPTIONS.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${o.label} — ${o.caption}`}
            style={({ pressed }) => [
              styles.option,
              neu(theme, pressed ? 'inset' : 'raised', pressed ? 3 : 5),
              // Constant width so selecting doesn't shift the layout
              { borderWidth: 2, borderColor: active ? theme.colors.primary : 'transparent' },
            ]}
          >
            <StylePreview t={previews[o.value]} />
            <View style={styles.caption}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontFamily: FONT.bold, fontSize: theme.fonts.labelLarge.fontSize, color: active ? theme.colors.primary : theme.colors.onSurface }}>
                  {o.label}
                </Text>
                <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                  {o.caption}
                </Text>
              </View>
              {active && <Icon source="check-circle" size={20} color={theme.colors.primary} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Miniature scene in a given style's palette. */
function StylePreview({ t }: { t: AppTheme }) {
  const p = t.custom.surface;
  return (
    <View style={[styles.preview, { backgroundColor: p.background }]}>
      {p.backdrop && <LinearGradient colors={p.backdrop} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
      <View style={[styles.miniCard, neu(t, 'raised', 4)]}>
        <View style={[styles.miniAvatar, { backgroundColor: t.colors.primary }]} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={[styles.line, { width: '75%', backgroundColor: p.onSurface, opacity: 0.75 }]} />
          <View style={[styles.line, { width: '50%', backgroundColor: p.onSurfaceVariant, opacity: 0.5 }]} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={[styles.miniWell, neu(t, 'inset', 3)]} />
        <View style={[styles.miniButton, neu(t, 'raised', 3), { backgroundColor: t.colors.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  option: { flexBasis: '45%', flexGrow: 1, padding: 8, borderRadius: 22 },
  preview: { height: 104, padding: 12, gap: 10, borderRadius: 15, overflow: 'hidden', justifyContent: 'center' },
  miniCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 12 },
  miniAvatar: { width: 18, height: 18, borderRadius: 9 },
  line: { height: 5, borderRadius: 3 },
  miniWell: { flex: 1, height: 20, borderRadius: 10 },
  miniButton: { width: 34, height: 20, borderRadius: 10 },
  caption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6, paddingTop: 10, paddingBottom: 4 },
});
