// NeuroMotion AI — Doctor Module Layout
import React from 'react';
import { Stack } from 'expo-router';

export default function DoctorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="patient-detail" />
    </Stack>
  );
}
