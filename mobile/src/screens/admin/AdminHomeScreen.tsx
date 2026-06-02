import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { colors, radius, spacing } from '../../theme';

export function AdminHomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.role}>🛡️ Admin</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.body}>
          The admin dashboard arrives in a later phase.{'\n'}
          {/* TODO(Future — Admin dashboard): issue mechanic credentials, view all jobs,
              manage users/subscriptions, analytics. */}
        </Text>
      </View>
      <Button title="Log Out" variant="danger" onPress={signOut} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingVertical: spacing(3) },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing(3), borderWidth: 1, borderColor: colors.border },
  role: { fontSize: 28, fontWeight: '800', color: colors.primary },
  email: { fontSize: 15, color: colors.muted, marginTop: spacing(0.5) },
  body: { fontSize: 15, color: colors.text, marginTop: spacing(2), lineHeight: 22 },
});
