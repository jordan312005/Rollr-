import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { getActiveJob, type Job } from '../../services/jobs';
import { colors, radius, spacing } from '../../theme';
import type { CustomerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerStackParamList, 'CustomerHome'>;

export function CustomerHomeScreen({ navigation }: Props) {
  const { user, api, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  // Re-check the active job every time this screen regains focus.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const job = await getActiveJob(api);
          if (!cancelled) setActiveJob(job);
        } catch (e: any) {
          if (!cancelled) setError(e.message);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [api])
  );

  return (
    <ScreenContainer scroll>
      <Text style={styles.greeting}>Hi {user?.fullName || 'there'}</Text>
      <Text style={styles.sub}>{user?.email}</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing(4) }} size="large" color={colors.primaryBright} />
      ) : error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : activeJob ? (
        <Card>
          <Text style={styles.cardTitle}>Your active request</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.vehicle}>{activeJob.vehicleLabel}</Text>
            <StatusBadge status={activeJob.status} />
          </View>
          <Text style={styles.desc} numberOfLines={3}>
            {activeJob.description}
          </Text>
          <Button title="View status" onPress={() => navigation.navigate('JobStatus', { jobId: activeJob.id })} />
        </Card>
      ) : (
        <Card>
          <Text style={styles.cardTitle}>No active requests</Text>
          <Text style={styles.desc}>Stuck with a flat or a dead battery? Get a mechanic to come to you.</Text>
          <Button title="Request Repair" onPress={() => navigation.navigate('RequestRepair')} />
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
  desc: { fontSize: 15, color: colors.text, marginTop: spacing(1), lineHeight: 21 },
  errorCard: { backgroundColor: colors.danger + '1A', borderWidth: 1, borderColor: colors.danger, borderRadius: radius.md, padding: spacing(2), marginTop: spacing(2) },
  errorText: { color: colors.danger, fontSize: 14 },
});
