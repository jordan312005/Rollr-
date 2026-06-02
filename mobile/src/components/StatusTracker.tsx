import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, STATUS_STEPS, statusMeta } from '../theme';

// Visual Pending → Accepted → In Progress → Completed tracker.
export function StatusTracker({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <View style={styles.cancelled}>
        <Text style={styles.cancelledText}>This request was cancelled.</Text>
      </View>
    );
  }
  const currentIndex = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);

  return (
    <View style={styles.row}>
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const active = i === currentIndex;
        const color = done ? statusMeta[step].color : colors.border;
        return (
          <React.Fragment key={step}>
            <View style={styles.step}>
              <View style={[styles.circle, { backgroundColor: done ? color : colors.white, borderColor: color }]}>
                <Text style={[styles.circleText, { color: done ? colors.white : colors.muted }]}>
                  {done ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>
                {statusMeta[step].label}
              </Text>
            </View>
            {i < STATUS_STEPS.length - 1 && (
              <View style={[styles.connector, { backgroundColor: i < currentIndex ? statusMeta[step].color : colors.border }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  step: { alignItems: 'center', width: 70 },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: { fontSize: 14, fontWeight: '700' },
  stepLabel: { fontSize: 11, color: colors.muted, marginTop: spacing(0.5), textAlign: 'center' },
  stepLabelActive: { color: colors.text, fontWeight: '700' },
  connector: { height: 2, flex: 1, marginTop: 16 },
  cancelled: { padding: spacing(1.5), backgroundColor: colors.border, borderRadius: 8 },
  cancelledText: { color: colors.muted, fontWeight: '600', textAlign: 'center' },
});
