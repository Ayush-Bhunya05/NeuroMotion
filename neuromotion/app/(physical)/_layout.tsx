// NeuroMotion AI — Physical Module Tab Layout
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../src/theme';
import { glass } from '../../src/theme/glassmorphism';
import { useApp } from '../../src/contexts/AppContext';

export default function PhysicalLayout() {
  const { dispatch } = useApp();

  React.useEffect(() => {
    dispatch({ type: 'SET_ACTIVE_MODULE', payload: 'physical' });
  }, []);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(10, 14, 39, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 217, 166, 0.15)',
          height: 65,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#00D9A6',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: typography.fonts.bodyMedium,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarLabel: 'Analysis',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="exercise" options={{ href: null }} />
      <Tabs.Screen name="exercise-info" options={{ href: null }} />
      <Tabs.Screen name="summary" options={{ href: null }} />
    </Tabs>
  );
}
