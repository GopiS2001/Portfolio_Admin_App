import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { neu, FONT, useAppTheme } from '@/theme';
import { FONT_SIZE_MAX, FONT_SIZE_MIN, FONT_SIZE_DEFAULT } from '@/lib/preferences';

import { Icon, Button } from './ui';

// ----------------------------------------------------------------------

const STEPS = Array.from({ length: FONT_SIZE_MAX - FONT_SIZE_MIN + 1 }, (_, i) => FONT_SIZE_MIN + i);
const NODE = 22;
const CURRENT = 34;

/**
 * Text-size picker styled like an order-tracking timeline: passed steps are filled with a
 * check, the current step is enlarged with a halo, later steps are hollow. Tap a step or
 * use Smaller / Larger.
 */
export function FontSizeTracker({ value, onChange }: { value: number; onChange: (size: number) => void }) {
  const theme = useAppTheme();
  const index = STEPS.indexOf(value);
  const progress = index / (STEPS.length - 1);
  const half = `${50 / STEPS.length}%` as const;

  return (
    <View style={{ gap: 18 }}>
      {/* Heading + live preview */}
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall">Text size</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Applies to the whole app
          </Text>
        </View>
        <View style={[styles.valuePill, neu(theme, 'inset', 3)]}>
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            {value} px{value === FONT_SIZE_DEFAULT ? ' · default' : ''}
          </Text>
        </View>
      </View>

      <View style={[styles.preview, neu(theme, 'inset', 5)]}>
        <Text style={{ fontFamily: FONT.bold, fontSize: value * 1.6, lineHeight: value * 2, color: theme.colors.onSurface }}>Aa</Text>
        <Text style={{ flex: 1, fontFamily: FONT.regular, fontSize: value, lineHeight: value * 1.45, color: theme.colors.onSurfaceVariant }}>
          This is how text will look across the app.
        </Text>
      </View>

      {/* Tracker */}
      <View accessibilityRole="adjustable" accessibilityLabel={`Text size ${value} pixels`}>
        <View style={styles.trackRow}>
          {/* Engraved groove behind the nodes + filled part up to the current step */}
          <View style={[styles.line, neu(theme, 'inset', 2), { left: half, right: half }]}>
            <View style={[styles.lineFill, { width: `${progress * 100}%`, backgroundColor: theme.colors.primary }]} />
          </View>

          {STEPS.map((size, i) => {
            const done = i < index;
            const current = i === index;
            return (
              <Pressable
                key={size}
                onPress={() => onChange(size)}
                hitSlop={{ top: 10, bottom: 10 }}
                accessibilityRole="button"
                accessibilityLabel={`${size} pixels`}
                accessibilityState={{ selected: current }}
                style={styles.step}
              >
                <View style={styles.nodeBox}>
                  {current ? (
                    <View style={[styles.halo, neu(theme, 'raised', 4)]}>
                      <View style={[styles.currentNode, neu(theme, 'inset', 2), { backgroundColor: theme.colors.primary }]}>
                        <Text style={{ color: theme.colors.onPrimary, fontFamily: FONT.bold, fontSize: 11 }}>Aa</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.node, neu(theme, 'raised', 2), done && { backgroundColor: theme.colors.primary }]}>
                      {done && <Icon source="check" size={13} color={theme.colors.onPrimary} />}
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    marginTop: 6,
                    fontFamily: current ? FONT.bold : FONT.medium,
                    fontSize: 12,
                    color: current ? theme.colors.primary : done ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                  }}
                >
                  {size}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.ends}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Smallest
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Largest
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          size="small"
          variant="soft"
          icon="format-font-size-decrease"
          label="Smaller"
          disabled={value <= FONT_SIZE_MIN}
          onPress={() => onChange(value - 1)}
          style={{ flex: 1 }}
        />
        <Button
          size="small"
          variant="soft"
          icon="format-font-size-increase"
          label="Larger"
          disabled={value >= FONT_SIZE_MAX}
          onPress={() => onChange(value + 1)}
          style={{ flex: 1 }}
        />
        {value !== FONT_SIZE_DEFAULT && (
          <Button size="small" variant="text" tone="default" icon="restore" label="Reset" onPress={() => onChange(FONT_SIZE_DEFAULT)} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  valuePill: { paddingHorizontal: 12, height: 30, borderRadius: 15, justifyContent: 'center' },
  preview: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18 },
  trackRow: { flexDirection: 'row', alignItems: 'flex-start' },
  line: { position: 'absolute', top: CURRENT / 2 + 4 - 4, height: 8, borderRadius: 4, padding: 2, overflow: 'hidden' },
  lineFill: { height: 4, borderRadius: 2 },
  step: { flex: 1, alignItems: 'center' },
  nodeBox: { height: CURRENT + 8, justifyContent: 'center', alignItems: 'center' },
  node: { width: NODE, height: NODE, borderRadius: NODE / 2, alignItems: 'center', justifyContent: 'center' },
  halo: { width: CURRENT + 8, height: CURRENT + 8, borderRadius: (CURRENT + 8) / 2, alignItems: 'center', justifyContent: 'center' },
  currentNode: {
    width: CURRENT,
    height: CURRENT,
    borderRadius: CURRENT / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
});
