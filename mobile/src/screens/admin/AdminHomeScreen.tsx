import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing } from '../../theme';

export function AdminHomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <ScreenContainer style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.roleRow}>
          <Feather name="shield" size={22} color={colors.primaryBright} />
          <Text style={styles.role}>Admin</Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.body}>
          The admin dashboard arrives in a later phase.{'\n'}
          {/* TODO(Future — Admin dashboard): issue mechanic credentials, view all jobs,
              manage users/subscriptions, analytics. */}
        </Text>
      </Card>
      <Button title="Log Out" variant="danger" onPress={signOut} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingVertical: spacing(3) },
  card: { padding: spacing(3) },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  role: { fontSize: 24, fontWeight: '800', color: colors.text },
  email: { fontSize: 15, color: colors.muted, marginTop: spacing(0.5) },
  body: { fontSize: 15, color: colors.text, marginTop: spacing(2), lineHeight: 22 },
});
