// NeuroMotion AI — Settings Screen
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import Header from '../../src/components/shared/Header';

type SettingRowProps = { icon: string; label: string; value?: string; toggle?: boolean; toggleValue?: boolean; onToggle?: (v: boolean) => void; onPress?: () => void; danger?: boolean };

function SettingRow({ icon, label, value, toggle, toggleValue, onToggle, onPress, danger }: SettingRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.settingRow}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text style={[styles.settingLabel, danger && { color: colors.error }]}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {toggle && <Switch value={toggleValue} onValueChange={onToggle} trackColor={{ true: colors.primary }} thumbColor={colors.textPrimary} />}
      {!toggle && !value && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
    </Pressable>
  );
}

export default function Settings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [cameraQuality, setCameraQuality] = useState(true);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Settings" showBack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.groupLabel}>Notifications</Text>
          <GlassCard>
            <SettingRow icon="🔔" label="Session Reminders" toggle toggleValue={notifications} onToggle={setNotifications} />
            <SettingRow icon="📊" label="Weekly Progress Reports" toggle toggleValue={autoSave} onToggle={setAutoSave} />
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.groupLabel}>App Preferences</Text>
          <GlassCard>
            <SettingRow icon="📳" label="Haptic Feedback" toggle toggleValue={haptics} onToggle={setHaptics} />
            <SettingRow icon="📷" label="High Quality Camera" toggle toggleValue={cameraQuality} onToggle={setCameraQuality} />
            <SettingRow icon="🌙" label="Appearance" value="Dark Mode" />
            <SettingRow icon="🌐" label="Language" value="English" />
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.groupLabel}>Data & Privacy</Text>
          <GlassCard>
            <SettingRow icon="🔒" label="Data Collection" toggle toggleValue={true} onToggle={() => {}} />
            <SettingRow icon="📤" label="Export All Data" onPress={() => {}} />
            <SettingRow icon="🗑️" label="Clear Session History" onPress={() => {}} danger />
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.groupLabel}>Doctor Access</Text>
          <GlassCard>
            <SettingRow icon="👨‍⚕️" label="Assigned Doctor" value="Dr. Smith" />
            <SettingRow icon="📋" label="Share Reports Automatically" toggle toggleValue={true} onToggle={() => {}} />
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={styles.groupLabel}>About</Text>
          <GlassCard>
            <SettingRow icon="ℹ️" label="Version" value="1.0.0" />
            <SettingRow icon="📜" label="Privacy Policy" onPress={() => {}} />
            <SettingRow icon="⚖️" label="Terms of Service" onPress={() => {}} />
            <SettingRow icon="💬" label="Send Feedback" onPress={() => {}} />
          </GlassCard>
        </Animated.View>

        <Text style={styles.footer}>NeuroMotion AI v1.0.0 · All insights are AI-assisted, not medical diagnoses.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { padding: spacing.xl, paddingBottom: 100, gap: spacing.md },
  groupLabel: { fontSize: 12, fontFamily: typography.fonts.bodySemiBold, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm, marginLeft: spacing.xs },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: spacing.md },
  settingIcon: { fontSize: 18, width: 28 },
  settingLabel: { flex: 1, fontSize: 15, color: colors.textPrimary, fontFamily: typography.fonts.body },
  settingValue: { fontSize: 13, color: colors.textMuted },
  footer: { textAlign: 'center', fontSize: 11, color: colors.textMuted, marginTop: spacing.lg, lineHeight: 16 },
});
