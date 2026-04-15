// NeuroMotion AI — Shared Screens Layout
import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

export default function SharedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgPrimary }, animation: 'slide_from_right' }}>
      <Stack.Screen name="profile" />
      <Stack.Screen name="unified-report" />
      <Stack.Screen name="nearby-clinics" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
