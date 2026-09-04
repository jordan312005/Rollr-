import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useJobsLive } from '../../hooks/useJobsLive';
import { getMechanicActiveJob, type Job } from '../../services/jobs';
import { colors, radius, spacing } from '../../theme';
import type { MechanicStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MechanicStackParamList, 'MechanicHome'>;

export function MechanicHomeScreen({ navigation }: Props) {
  const { user, api, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  const load = useCallback(async () => {
    try {
      const job = await getMechanicActiveJob(api);
      setActiveJob(job);
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

  // Live-refresh the active job (e.g. if it changes elsewhere).
  useJobsLive({ channelName: 'mechanic-home', onChange: load });

  return (
    <ScreenContainer scroll>
      <Text style={styles.greeting}>Hi {user?.fullName || 'there'}</Text>
      <Text style={styles.sub}>{user?.email}</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing(4) }} size="large" color={colors.primaryBright} />
      ) : error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Retry" variant="secondary" onPress={load} />
        </View>
      ) : activeJob ? (
        <Card>
          <Text style={styles.cardTitle}>Your current job</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.vehicle}>{activeJob.vehicleLabel}</Text>
            <StatusBadge status={activeJob.status} />
          </View>
          {activeJob.customerName && (
            <Text style={styles.meta}>Customer: {activeJob.customerName}</Text>
          )}
          <Text style={styles.desc} numberOfLines={3}>
            {activeJob.description}
          </Text>
          <Button
            title="Open job"
            onPress={() => navigation.navigate('JobDetail', { jobId: activeJob.id })}
          />
        </Card>
      ) : (
        <Card>
          <Text style={styles.cardTitle}>No active job</Text>
          <Text style={styles.desc}>
            You're free. Browse open repair requests and accept one to get started.
          </Text>
          <Button title="View Job Feed" onPress={() => navigation.navigate('JobFeed')} />
        </Card>
      )}

      <View style={{ height: spacing(4) }} />
      <Button title="Log Out" variant="ghost" onPress={signOut} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 26, fontWeight: '800', color: colors.text },
  sub: { fontSize: 14, color: colors.muted, marginTop: spacing(0.25), marginBottom: spacing(3) },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing(1) },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vehicle: { fontSize: 20, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.muted, marginTop: spacing(0.75) },
  desc: { fontSize: 15, color: colors.text, marginTop: spacing(1), lineHeight: 21 },
  errorCard: { backgroundColor: colors.danger + '1A', borderWidth: 1, borderColor: colors.danger, borderRadius: radius.md, padding: spacing(2), marginTop: spacing(2) },
  errorText: { color: colors.danger, fontSize: 14, marginBottom: spacing(1) },
});
