import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'CustomerRegister'>;

export function CustomerRegisterScreen({ navigation }: Props) {
  const { registerCustomer } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!fullName || !email || !password) {
      return Alert.alert('Missing info', 'Please fill in all fields.');
    }
    if (password.length < 8) {
      return Alert.alert('Weak password', 'Use at least 8 characters.');
    }
    setLoading(true);
    try {
      await registerCustomer(email.trim(), password, fullName.trim());
      // Auto-signed-in → RootNavigator routes to customer home.
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <Text style={styles.heading}>Create your account</Text>
      <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Alex Rider" />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@school.edu"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="At least 8 characters"
      />
      <Button title="Create Account" onPress={onSubmit} loading={loading} />
      <Button title="I already have an account" variant="ghost" onPress={() => navigation.goBack()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: spacing(2) },
});
