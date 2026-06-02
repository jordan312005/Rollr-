import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { StatusTracker } from '../../components/StatusTracker';
import { useAuth } from '../../hooks/useAuth';
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setJob(await getJob(api, jobId));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api, jobId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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
        <ActivityIndicator size="large" color={colors.primary} />
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

  return (
    <ScreenContainer scroll>
      <View style={styles.trackerCard}>
        <StatusTracker status={job.status} />
      </View>

      <View style={styles.card}>
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
            <Text style={styles.fieldValue}>
              📍 {job.location.lat.toFixed(5)}, {job.location.lng.toFixed(5)}
            </Text>
          </>
        )}

        <Text style={styles.fieldLabel}>Submitted</Text>
        <Text style={styles.fieldValue}>{new Date(job.createdAt).toLocaleString()}</Text>
      </View>

      {/* Cancel is only available while the request is still Pending. */}
      {job.status === 'pending' && (
        <Button title="Cancel Request" variant="danger" loading={cancelling} onPress={onCancel} />
      )}

      <Button title="Back to Home" variant="ghost" onPress={() => navigation.navigate('CustomerHome')} />

      {/* TODO(Phase 3): subscribe to Supabase Realtime for live status updates
          instead of refetching on focus. */}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing(2) },
  error: { color: colors.danger, fontSize: 16, textAlign: 'center' },
  trackerCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing(2.5), borderWidth: 1, borderColor: colors.border, marginBottom: spacing(2) },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing(2.5), borderWidth: 1, borderColor: colors.border },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(1) },
  vehicle: { fontSize: 22, fontWeight: '800', color: colors.text },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing(2) },
  fieldValue: { fontSize: 16, color: colors.text, marginTop: spacing(0.5), lineHeight: 22 },
  photo: { width: '100%', height: 220, borderRadius: radius.md, marginTop: spacing(1) },
});
