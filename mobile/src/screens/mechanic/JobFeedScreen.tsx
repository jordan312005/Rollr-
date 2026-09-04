import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useAuth } from '../../hooks/useAuth';
import { useJobsLive } from '../../hooks/useJobsLive';
import { acceptJob, listOpenJobs, type Job } from '../../services/jobs';
import { formatDistance, haversineKm, timeAgo } from '../../utils/format';
import { colors, radius, spacing } from '../../theme';
import type { MechanicStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MechanicStackParamList, 'JobFeed'>;

export function JobFeedScreen({ navigation }: Props) {
  const { api } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Grab the mechanic's location once (best-effort) so we can show distances.
  useEffect(() => {
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setMyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        /* distance is optional — ignore */
      }
    })();
  }, []);

  const load = useCallback(async () => {
    try {
      setJobs(await listOpenJobs(api));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // New requests (and accepted-elsewhere removals) appear without a refresh.
  useJobsLive({ channelName: 'jobs-feed', onChange: load });

  const onAccept = async (job: Job) => {
    setAccepting(job.id);
    try {
      await acceptJob(api, job.id);
      navigation.navigate('JobDetail', { jobId: job.id });
    } catch (e: any) {
      Alert.alert('Could not accept', e.message);
      load(); // refresh — it was likely taken by another mechanic
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return (
      <ScreenContainer style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBright} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" variant="secondary" onPress={load} />
        </View>
      )}

      {jobs.length === 0 && !error ? (
        <Card>
          <Text style={styles.emptyTitle}>No open requests right now</Text>
          <Text style={styles.desc}>New jobs will appear here automatically.</Text>
        </Card>
      ) : (
        jobs.map((job) => {
          const dist =
            myCoords && job.location ? haversineKm(myCoords, job.location) : null;
          return (
            <Card key={job.id} style={styles.jobCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.vehicle}>{job.vehicleLabel}</Text>
                <Text style={styles.time}>{timeAgo(job.createdAt)}</Text>
              </View>
              {job.customerName && <Text style={styles.meta}>{job.customerName}</Text>}
              <Text style={styles.desc} numberOfLines={3}>
                {job.description}
              </Text>
              {job.photoUrl && <Image source={{ uri: job.photoUrl }} style={styles.photo} />}
              <View style={styles.distanceRow}>
                <Feather name="map-pin" size={13} color={colors.accent} />
                <Text style={styles.distance}>{formatDistance(dist)}</Text>
              </View>
              <Button
                title="Accept Job"
                loading={accepting === job.id}
                disabled={accepting != null && accepting !== job.id}
                onPress={() => onAccept(job)}
              />
            </Card>
          );
        })
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  jobCard: { marginBottom: spacing(2) },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vehicle: { fontSize: 20, fontWeight: '800', color: colors.text },
  time: { fontSize: 13, color: colors.muted },
  meta: { fontSize: 14, color: colors.muted, marginTop: spacing(0.5) },
  desc: { fontSize: 15, color: colors.text, marginTop: spacing(1), lineHeight: 21 },
  photo: { width: '100%', height: 160, borderRadius: radius.md, marginTop: spacing(1.5) },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(0.5), marginTop: spacing(1.5) },
  distance: { fontSize: 14, fontWeight: '600', color: colors.accent },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  errorCard: { backgroundColor: colors.danger + '1A', borderWidth: 1, borderColor: colors.danger, borderRadius: radius.md, padding: spacing(2), marginBottom: spacing(2) },
  errorText: { color: colors.danger, fontSize: 14, marginBottom: spacing(1) },
});
