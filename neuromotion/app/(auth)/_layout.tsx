import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgPrimary }, animation: 'slide_from_right' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="login-special" />
      <Stack.Screen name="register-select" />
      <Stack.Screen name="register-patient" />
      <Stack.Screen name="register-doctor" />
    </Stack>
  );
}
