// NeuroMotion AI — Header Component
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { colors, typography, spacing } from '../../theme';
import { useUser } from '../../contexts/AppContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  showModuleSwitcher?: boolean;
  onRightPress?: () => void;
  onBackPress?: () => void;
  moduleColor?: string;
  backIconColor?: string;
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  showModuleSwitcher = false,
  rightIcon,
  onRightPress,
  onBackPress,
  moduleColor,
  backIconColor,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const user = useUser();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {showBack && (
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={backIconColor || colors.textPrimary} />
          </Pressable>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, moduleColor ? { color: moduleColor } : undefined]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightIcon && (
          <Pressable onPress={onRightPress} style={styles.rightBtn}>
            <Ionicons name={rightIcon} size={22} color={colors.textSecondary} />
          </Pressable>
        )}
        {showModuleSwitcher && user?.rehabGoal === 'dual' && pathname !== '/(shared)/dashboard' && (
          <Pressable onPress={() => router.push('/(shared)/dashboard')} style={styles.rightBtn}>
            <Ionicons name="grid-outline" size={22} color={colors.primary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: spacing.md,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.h3,
    fontFamily: typography.fonts.heading,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    fontFamily: typography.fonts.body,
    marginTop: 2,
  },
  rightBtn: {
    padding: 4,
  },
});
