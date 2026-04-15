// NeuroMotion AI — Exercise Session Screen (WebView + MediaPipe Pose Detection)
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { calculateScore } from '../../src/utils/scoringEngine';
import { PhysicalSessionData, UserMetrics } from '../../src/types/physical';
import { WEB_APP_HTML } from '../../src/config/webAppHtml';
import { recordSession } from '../../src/utils/streakTracker';
import { usePhysical } from '../../src/contexts/PhysicalContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPhysicalSessions, savePhysicalSession } from '../../src/services/dbService';
import { getRecommendedPhysicalSettings } from '../../src/utils/adaptiveLogic';

export default function ExerciseScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { dispatch } = usePhysical();

  const exerciseId = (id as string) || 'squats';

  const EXERCISE_MAP: Record<string, { name: string; joint: string; defaultReps: number; defaultSets: number }> = {
    squats: { name: 'Squat', joint: 'Knee', defaultReps: 10, defaultSets: 3 },
    arm_raises: { name: 'Lateral Raise', joint: 'Shoulder', defaultReps: 12, defaultSets: 3 },
    shoulder_rotation: { name: 'Shoulder Rotation', joint: 'Shoulder', defaultReps: 10, defaultSets: 2 },
    knee_bends: { name: 'Knee Bend', joint: 'Knee', defaultReps: 15, defaultSets: 2 },
    lunges: { name: 'Lunge', joint: 'Knee', defaultReps: 8, defaultSets: 3 },
  };

  const [injectionScript, setInjectionScript] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(true);
  const [sessionKey, setSessionKey] = useState(Date.now().toString());

  useFocusEffect(
    React.useCallback(() => {
      setIsFocused(true);
      setSessionKey(Date.now().toString());
      return () => setIsFocused(false);
    }, [])
  );

  useEffect(() => {
    (async () => {
      await Camera.requestCameraPermissionsAsync();

      const baseExercise = EXERCISE_MAP[exerciseId] || EXERCISE_MAP.squats;
      const history = await getPhysicalSessions(false); // Local history only for speed
      
      // 🧠 Logic-Based Adaptability: Adjust target reps/sets based on history
      const { reps, sets } = getRecommendedPhysicalSettings(history, exerciseId, {
        reps: baseExercise.defaultReps,
        sets: baseExercise.defaultSets
      });

      let rehabData = null;
      try {
        const rehabJson = await AsyncStorage.getItem('user_rehab_data');
        rehabData = rehabJson ? JSON.parse(rehabJson) : null;
      } catch (e) { console.log('Error loading rehab data', e); }

      const exerciseConfig = JSON.stringify({
        id: exerciseId,
        name: baseExercise.name,
        joint: baseExercise.joint,
        defaultReps: reps,
        defaultSets: sets,
      });

      let script = `window.EXERCISE_CONFIG = ${exerciseConfig}; `;
      if (rehabData) {
        script += `window.USER_REHAB_CONFIG = ${JSON.stringify(rehabData)}; `;
      } else {
        script += `window.USER_REHAB_CONFIG = null; `;
      }
      script += 'true;';
      setInjectionScript(script);
    })();
  }, [exerciseId]);

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'HAPTIC') {
        if (data.payload === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else if (data.payload === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (data.type === 'SESSION_COMPLETE') {
        const { totalReps, correctReps, timerSeconds, allReps, avgAngle, angles, coachingEvents } = data.payload;
        const currentEx = EXERCISE_MAP[exerciseId] || EXERCISE_MAP.squats;

        const session: PhysicalSessionData = {
          exerciseName: currentEx.name,
          joint: currentEx.joint?.toLowerCase() as any || 'knee',
          startTime: Date.now() - timerSeconds * 1000,
          endTime: Date.now(),
          totalReps,
          correctReps,
          reps: allReps,
          avgAngle: Math.round(avgAngle * 10) / 10,
          maxAngle: angles.length > 0 ? Math.round(Math.max(...angles) * 10) / 10 : 0,
          minAngle: angles.length > 0 ? Math.round(Math.min(...angles) * 10) / 10 : 0,
          angleVariation: 0,
          coachingEvents,
        };

        const scoreResult = calculateScore(session, undefined);
        await savePhysicalSession({
          id: Date.now().toString(),
          exerciseName: session.exerciseName,
          joint: session.joint,
          startTime: session.startTime,
          endTime: session.endTime,
          totalReps: session.totalReps,
          correctReps: session.correctReps,
          reps: session.reps,
          avgAngle: session.avgAngle,
          maxAngle: session.maxAngle,
          minAngle: session.minAngle,
          angleVariation: session.angleVariation,
          coachingEvents: session.coachingEvents,
          scoreResult,
          createdAt: new Date().toISOString()
        });
        await recordSession();

        const sessionId = Date.now().toString();
        dispatch({ type: 'ADD_SESSION', payload: { ...session, id: sessionId, score: scoreResult.finalScore, exerciseType: exerciseId } as any });

        setTimeout(() => {
          router.replace({ pathname: '/(physical)/summary', params: { sessionId, id: exerciseId } });
        }, 1500);
      }
    } catch (e) { console.log('WebView message parsing error:', e); }
  };

  if (injectionScript === null || !isFocused) {
    return (
      <SafeAreaView style={[styles.safeArea, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color="#00D9A6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <WebView
        key={sessionKey}
        originWhitelist={['*']}
        source={{ html: WEB_APP_HTML, baseUrl: 'https://localhost/' }}
        style={styles.webview}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        injectedJavaScript={injectionScript}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020412' },
  webview: { flex: 1, backgroundColor: '#020412' },
});
