import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
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
import { completeJob, getMechanicJob, startJob, type Job } from '../../services/jobs';
import { colors, radius, spacing } from '../../theme';
import type { MechanicStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MechanicStackParamList, 'JobDetail'>;

export function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { api } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setJob(await getMechanicJob(api, jobId));
      setError(null);
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

  // Live updates to this specific job (e.g. customer cancels, or status syncs).
  useJobsLive({ channelName: `job-${jobId}`, filter: `id=eq.${jobId}`, onChange: load });

  // Reverse-geocode the customer's coordinates into a readable address.
  useEffect(() => {
    if (!job?.location) return;
    (async () => {
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: job.location!.lat,
          longitude: job.location!.lng,
        });
        const a = results[0];
        if (a) {
          const parts = [
            [a.streetNumber, a.street].filter(Boolean).join(' '),
            a.city,
            a.region,
            a.postalCode,
          ].filter(Boolean);
          setAddress(parts.join(', '));
        }
      } catch {
        /* address is best-effort */
      }
    })();
  }, [job?.location?.lat, job?.location?.lng]);

  const advance = async (action: 'start' | 'complete') => {
    setWorking(true);
    try {
      const updated = action === 'start' ? await startJob(api, jobId) : await completeJob(api, jobId);
      setJob(updated);
    } catch (e: any) {
      Alert.alert('Could not update', e.message);
    } finally {
      setWorking(false);
    }
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
        <Button title="Back" onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <Card style={styles.trackerCard}>
        <StatusTracker status={job.status} />
      </Card>

      {job.location ? (
        <MapView
          provider={PROVIDER_DEFAULT}
          userInterfaceStyle="dark"
          style={styles.map}
          initialRegion={{
            latitude: job.location.lat,
            longitude: job.location.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{ latitude: job.location.lat, longitude: job.location.lng }}
            title={job.customerName || 'Customer'}
            description={job.vehicleLabel}
          />
        </MapView>
      ) : (
        <View style={styles.noMap}>
          <Text style={styles.noMapText}>No location was shared for this request.</Text>
        </View>
      )}

      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.vehicle}>{job.vehicleLabel}</Text>
          <StatusBadge status={job.status} />
        </View>

        {job.customerName && (
          <>
            <Text style={styles.fieldLabel}>Customer</Text>
            <Text style={styles.fieldValue}>{job.customerName}</Text>
          </>
        )}

        <Text style={styles.fieldLabel}>Address</Text>
        {address || !job.location ? (
          <Text style={styles.fieldValue}>{address || 'Not available'}</Text>
        ) : (
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={14} color={colors.muted} />
            <Text style={[styles.fieldValue, { marginTop: 0 }]}>
              {job.location.lat.toFixed(5)}, {job.location.lng.toFixed(5)}
            </Text>
          </View>
        )}

        <Text style={styles.fieldLabel}>Problem</Text>
        <Text style={styles.fieldValue}>{job.description}</Text>

        {job.photoUrl && (
          <>
            <Text style={styles.fieldLabel}>Photo</Text>
            <Image source={{ uri: job.photoUrl }} style={styles.photo} />
          </>
        )}
      </Card>

      {/* Status actions — gated by current status. Completed is terminal/locked. */}
      {job.status === 'accepted' && (
        <Button title="Mark In Progress" loading={working} onPress={() => advance('start')} />
      )}
      {job.status === 'in_progress' && (
        <Button title="Mark Completed" loading={working} onPress={() => advance('complete')} />
      )}
      {job.status === 'completed' && (
        <View style={styles.doneCard}>
          <Feather name="check-circle" size={16} color={colors.success} />
          <Text style={styles.doneText}>Job completed — nicely done.</Text>
        </View>
      )}

      <Button title="Back" variant="ghost" onPress={() => navigation.goBack()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing(2) },
  error: { color: colors.danger, fontSize: 16, textAlign: 'center' },
  trackerCard: { marginBottom: spacing(2) },
  map: { width: '100%', height: 220, borderRadius: radius.lg, marginBottom: spacing(2) },
  noMap: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing(3), marginBottom: spacing(2), alignItems: 'center' },
  noMapText: { color: colors.muted, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(1) },
  vehicle: { fontSize: 22, fontWeight: '800', color: colors.text },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing(2) },
  fieldValue: { fontSize: 16, color: colors.text, marginTop: spacing(0.5), lineHeight: 22 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(0.75), marginTop: spacing(0.5) },
  photo: { width: '100%', height: 220, borderRadius: radius.md, marginTop: spacing(1) },
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1),
    backgroundColor: colors.success + '14',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.md,
    padding: spacing(2),
    marginTop: spacing(1.5),
  },
  doneText: { color: colors.success, fontWeight: '700', fontSize: 15 },
});
