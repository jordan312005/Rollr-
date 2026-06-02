import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Button } from '../../components/Button';
import { colors, spacing } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';
import { isSupabaseConfigured } from '../../config/env';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🛞 Rollr</Text>
        <Text style={styles.tagline}>On-demand repair for bikes & scooters, right on campus.</Text>
      </View>

      {!isSupabaseConfigured && (
        <View style={styles.warn}>
          <Text style={styles.warnText}>
            ⚠️ Supabase keys not configured yet. Add them to mobile/.env to enable sign in.
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button title="I need a repair (Customer)" onPress={() => navigation.navigate('CustomerLogin')} />
        <Button title="I'm a Mechanic" variant="secondary" onPress={() => navigation.navigate('MechanicLogin')} />
        <Button title="Admin" variant="ghost" onPress={() => navigation.navigate('AdminLogin')} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: spacing(5) },
  logo: { fontSize: 44, fontWeight: '800', color: colors.primary },
  tagline: { fontSize: 16, color: colors.muted, textAlign: 'center', marginTop: spacing(1.5), paddingHorizontal: spacing(2) },
  actions: { gap: spacing(0.5) },
  warn: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: spacing(1.5), marginBottom: spacing(2) },
  warnText: { color: '#92400E', fontSize: 13, textAlign: 'center' },
});
