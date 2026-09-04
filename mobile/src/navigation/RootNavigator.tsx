import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme';
import type {
  AdminStackParamList,
  AuthStackParamList,
  CustomerStackParamList,
  MechanicStackParamList,
} from './types';

// Auth screens
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { CustomerRegisterScreen } from '../screens/auth/CustomerRegisterScreen';

// Role home screens
import { CustomerHomeScreen } from '../screens/customer/CustomerHomeScreen';
import { RequestRepairScreen } from '../screens/customer/RequestRepairScreen';
import { JobStatusScreen } from '../screens/customer/JobStatusScreen';
import { MechanicHomeScreen } from '../screens/mechanic/MechanicHomeScreen';
import { JobFeedScreen } from '../screens/mechanic/JobFeedScreen';
import { JobDetailScreen } from '../screens/mechanic/JobDetailScreen';
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';

const Auth = createNativeStackNavigator<AuthStackParamList>();
const Customer = createNativeStackNavigator<CustomerStackParamList>();
const Mechanic = createNativeStackNavigator<MechanicStackParamList>();
const Admin = createNativeStackNavigator<AdminStackParamList>();

const headerStyle = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' as const, color: colors.text },
  headerShadowVisible: false,
};

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primaryBright,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
  },
};

function AuthStack() {
  return (
    <Auth.Navigator screenOptions={headerStyle}>
      <Auth.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Auth.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign In' }} />
      <Auth.Screen name="CustomerRegister" component={CustomerRegisterScreen} options={{ title: 'Create Account' }} />
    </Auth.Navigator>
  );
}

function CustomerStack() {
  return (
    <Customer.Navigator screenOptions={headerStyle}>
      <Customer.Screen name="CustomerHome" component={CustomerHomeScreen} options={{ title: 'Rollr' }} />
      <Customer.Screen name="RequestRepair" component={RequestRepairScreen} options={{ title: 'Request Repair' }} />
      <Customer.Screen name="JobStatus" component={JobStatusScreen} options={{ title: 'Job Status' }} />
    </Customer.Navigator>
  );
}

function MechanicStack() {
  return (
    <Mechanic.Navigator screenOptions={headerStyle}>
      <Mechanic.Screen name="MechanicHome" component={MechanicHomeScreen} options={{ title: 'Rollr — Mechanic' }} />
      <Mechanic.Screen name="JobFeed" component={JobFeedScreen} options={{ title: 'Open Requests' }} />
      <Mechanic.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Detail' }} />
    </Mechanic.Navigator>
  );
}

function AdminStack() {
  return (
    <Admin.Navigator screenOptions={headerStyle}>
      <Admin.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Rollr — Admin' }} />
    </Admin.Navigator>
  );
}

export function RootNavigator() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBright} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {!user ? (
        <AuthStack />
      ) : user.role === 'customer' ? (
        <CustomerStack />
      ) : user.role === 'mechanic' ? (
        <MechanicStack />
      ) : (
        <AdminStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
