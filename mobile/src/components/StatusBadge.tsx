import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, statusMeta } from '../theme';

export function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status] ?? { label: status, color: colors.muted };
  return (
    <View style={[styles.badge, { backgroundColor: meta.color + '22', borderColor: meta.color }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.text, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing(0.5),
    paddingHorizontal: spacing(1.25),
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing(0.75) },
  text: { fontSize: 13, fontWeight: '700' },
});
