import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { StatusTracker } from '../../components/StatusTracker';
import { useAuth } from '../../hooks/useAuth';
import { useJobsLive } from '../../hooks/useJobsLive';
import { cancelJob, getJob, type Job } from '../../services/jobs';
import { colors, radius, spacing } from '../../theme';
import type { CustomerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerStackParamList, 'JobStatus'>;

export function JobStatusScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { api } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // `showSpinner` only on the first/explicit load — background refreshes
  // (focus, realtime, polling) update silently so the screen doesn't flicker.
  const load = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      try {
        setJob(await getJob(api, jobId));
        setError(null);
      } catch (e: any) {
        setError(e.message);
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [api, jobId]
  );

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load])
  );

  // Live status updates: re-fetch whenever this job row changes
  // (mechanic moves Pending → Accepted → In Progress → Completed).
  useJobsLive({ channelName: `job-${jobId}`, filter: `id=eq.${jobId}`, onChange: load });

  const onCancel = () => {
    Alert.alert('Cancel request?', 'This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel request',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const updated = await cancelJob(api, jobId);
            setJob(updated);
          } catch (e: any) {
            Alert.alert('Could not cancel', e.message);
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenContainer style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBright} />
      </ScreenContainer>
    );
  }

  if (error || !job) {
    return (
      <ScreenContainer style={styles.center}>
        <Text style={styles.error}>{error || 'Job not found'}</Text>
        <Button title="Back to Home" onPress={() => navigation.navigate('CustomerHome')} />
      </ScreenContainer>
    );
  }

  // Completed is terminal: the job is locked (no cancel / no further changes).
  // Show a simple confirmation screen instead of the normal tracker view.
  if (job.status === 'completed') {
    return (
      <ScreenContainer scroll>
        <View style={styles.completeCard}>
          <Feather name="check-circle" size={44} color={colors.success} />
          <Text style={styles.completeTitle}>Repair complete!</Text>
          <Text style={styles.completeBody}>
            Your {job.vehicleLabel.toLowerCase()} has been serviced. Thanks for using Rollr.
          </Text>

          {/* TODO(Phase 5 — Payments): payment trigger goes here
              (charge the customer / capture the saved payment method on completion). */}

          {/* TODO(Phase 7 — Ratings): ratings flow goes here
              (prompt the customer to rate the mechanic 1–5 for this job). */}
        </View>

        <Card>
          <Text style={styles.fieldLabel}>Problem</Text>
          <Text style={styles.fieldValue}>{job.description}</Text>
          <Text style={styles.fieldLabel}>Completed</Text>
          <Text style={styles.fieldValue}>{new Date(job.updatedAt).toLocaleString()}</Text>
        </Card>

        <Button title="Back to Home" onPress={() => navigation.navigate('CustomerHome')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <Card style={styles.trackerCard}>
        <StatusTracker status={job.status} />
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.vehicle}>{job.vehicleLabel}</Text>
          <StatusBadge status={job.status} />
        </View>

        <Text style={styles.fieldLabel}>Problem</Text>
        <Text style={styles.fieldValue}>{job.description}</Text>

        {job.photoUrl && (
          <>
            <Text style={styles.fieldLabel}>Photo</Text>
            <Image source={{ uri: job.photoUrl }} style={styles.photo} />
          </>
        )}

        {job.location && (
          <>
            <Text style={styles.fieldLabel}>Location</Text>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={14} color={colors.muted} />
              <Text style={[styles.fieldValue, { marginTop: 0 }]}>
                {job.location.lat.toFixed(5)}, {job.location.lng.toFixed(5)}
              </Text>
            </View>
          </>
        )}

        <Text style={styles.fieldLabel}>Submitted</Text>
        <Text style={styles.fieldValue}>{new Date(job.createdAt).toLocaleString()}</Text>
      </Card>

      {/* Cancel is only available while the request is still Pending. */}
      {job.status === 'pending' && (
        <Button title="Cancel Request" variant="danger" loading={cancelling} onPress={onCancel} />
      )}

      <Button title="Back to Home" variant="ghost" onPress={() => navigation.navigate('CustomerHome')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing(2) },
  error: { color: colors.danger, fontSize: 16, textAlign: 'center' },
  trackerCard: { marginBottom: spacing(2) },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(1) },
  vehicle: { fontSize: 22, fontWeight: '800', color: colors.text },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing(2) },
  fieldValue: { fontSize: 16, color: colors.text, marginTop: spacing(0.5), lineHeight: 22 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(0.75), marginTop: spacing(0.5) },
  photo: { width: '100%', height: 220, borderRadius: radius.md, marginTop: spacing(1) },
  completeCard: {
    backgroundColor: colors.success + '14',
    borderRadius: radius.lg,
    padding: spacing(3),
    borderWidth: 1,
    borderColor: colors.success,
    alignItems: 'center',
    marginBottom: spacing(2),
  },
  completeTitle: { fontSize: 24, fontWeight: '800', color: colors.success, marginTop: spacing(1.5) },
  completeBody: { fontSize: 15, color: colors.text, textAlign: 'center', marginTop: spacing(1), lineHeight: 22 },
});
