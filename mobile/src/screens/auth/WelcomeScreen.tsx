import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Button } from '../../components/Button';
import { colors, radius, spacing } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';
import { isSupabaseConfigured } from '../../config/env';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.hero}>
        <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.tagline}>On-demand repair for bikes & scooters, right on campus.</Text>
      </View>

      {!isSupabaseConfigured && (
        <View style={styles.warn}>
          <Feather name="alert-triangle" size={16} color={colors.warning} />
          <Text style={styles.warnText}>
            Supabase keys not configured yet. Add them to mobile/.env to enable sign in.
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button title="Sign In" onPress={() => navigation.navigate('SignIn')} />
        <Button
          title="New here? Create an account"
          variant="ghost"
          onPress={() => navigation.navigate('CustomerRegister')}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: spacing(5) },
  logo: { width: 220, height: 147 },
  tagline: { fontSize: 16, color: colors.muted, textAlign: 'center', marginTop: spacing(1.5), paddingHorizontal: spacing(2) },
  actions: { gap: spacing(0.5) },
  warn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    backgroundColor: colors.warning + '1A',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.sm,
    padding: spacing(1.5),
    marginBottom: spacing(2),
  },
  warnText: { flex: 1, color: colors.warning, fontSize: 13 },
});
