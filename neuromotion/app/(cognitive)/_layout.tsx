// NeuroMotion AI — Cognitive Module Tab Layout
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../src/theme';
import { useApp } from '../../src/contexts/AppContext';

export default function CognitiveLayout() {
  const { dispatch } = useApp();
  
  React.useEffect(() => {
    dispatch({ type: 'SET_ACTIVE_MODULE', payload: 'cognitive' });
  }, []);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(10, 14, 39, 0.95)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 107, 157, 0.15)',
          height: 65, paddingBottom: 8, paddingTop: 6,
        },
        tabBarActiveTintColor: colors.cognitive,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontFamily: typography.fonts.bodyMedium, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Analysis', tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="tests" options={{ title: 'Tests', tabBarIcon: ({ color, size }) => <Ionicons name="game-controller-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="memory-game" options={{ href: null }} />
      <Tabs.Screen name="reaction-test" options={{ href: null }} />
      <Tabs.Screen name="attention-game" options={{ href: null }} />
      <Tabs.Screen name="story-game" options={{ href: null }} />
    </Tabs>
  );
}
