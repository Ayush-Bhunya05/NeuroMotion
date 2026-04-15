// NeuroMotion AI — Nearby Clinics (Google Maps placeholder)
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import StatusBadge from '../../src/components/ui/StatusBadge';
import Header from '../../src/components/shared/Header';

// Sample clinic data (replace with Google Places API response)
const SAMPLE_CLINICS = [
  {
    id: '1', name: 'NeuroRehab Center', specialization: 'Neurological Rehabilitation',
    address: '123 Medical Drive, Healthcare District', phone: '+1 (555) 100-2000',
    rating: 4.8, distance: '0.8 km', isOpen: true, type: 'physical',
  },
  {
    id: '2', name: 'BrainBoost Clinic', specialization: 'Cognitive Therapy',
    address: '456 Wellness Ave, Midtown', phone: '+1 (555) 200-3000',
    rating: 4.6, distance: '1.2 km', isOpen: true, type: 'cognitive',
  },
  {
    id: '3', name: 'PhysioPlus Hospital', specialization: 'Physical Therapy & Sports Medicine',
    address: '789 Recovery Blvd, Eastside', phone: '+1 (555) 300-4000',
    rating: 4.9, distance: '2.1 km', isOpen: false, type: 'physical',
  },
  {
    id: '4', name: 'MindCare Institute', specialization: 'Memory & Attention Disorders',
    address: '321 Therapy Lane, West End', phone: '+1 (555) 400-5000',
    rating: 4.7, distance: '3.5 km', isOpen: true, type: 'cognitive',
  },
  {
    id: '5', name: 'Orthopedic & Spine Center', specialization: 'Joint & Spine Rehabilitation',
    address: '654 Health Pkwy, Northgate', phone: '+1 (555) 500-6000',
    rating: 4.5, distance: '4.0 km', isOpen: true, type: 'physical',
  },
];

type FilterType = 'all' | 'physical' | 'cognitive';

export default function NearbyClinics() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);

  const filtered = SAMPLE_CLINICS.filter(c => filter === 'all' || c.type === filter);
  const selected = SAMPLE_CLINICS.find(c => c.id === selectedClinic);

  const callClinic = (phone: string) => Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
  const openMap = (address: string) => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Nearby Clinics" subtitle="Rehabilitation centers near you" showBack />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Map Placeholder */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapIcon}>🗺️</Text>
            <Text style={styles.mapTitle}>Map View</Text>
            <Text style={styles.mapSub}>Add Google Maps API key to enable interactive map</Text>
            <Pressable onPress={() => openMap('rehabilitation clinics near me')} style={styles.openMapBtn}>
              <Text style={styles.openMapText}>Open in Google Maps →</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.filterRow}>
            {(['all', 'physical', 'cognitive'] as FilterType[]).map(f => (
              <Pressable
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive, filter === f && {
                  backgroundColor: f === 'physical' ? 'rgba(0,217,166,0.2)' : f === 'cognitive' ? 'rgba(255,107,157,0.2)' : 'rgba(108,99,255,0.2)',
                  borderColor: f === 'physical' ? colors.physical : f === 'cognitive' ? colors.cognitive : colors.primary,
                }]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && { color: f === 'physical' ? colors.physical : f === 'cognitive' ? colors.cognitive : colors.primary }]}>
                  {f === 'all' ? '🏥 All' : f === 'physical' ? '💪 Physical' : '🧠 Cognitive'}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Clinics List */}
        <Text style={styles.resultCount}>{filtered.length} clinics found</Text>
        {filtered.map((clinic, i) => (
          <Animated.View key={clinic.id} entering={FadeInDown.delay(150 + i * 80).duration(400)}>
            <GlassCard
              onPress={() => setSelectedClinic(selectedClinic === clinic.id ? null : clinic.id)}
              variant={clinic.type === 'physical' ? 'physical' : 'cognitive'}
              style={styles.clinicCard}
            >
              <View style={styles.clinicHeader}>
                <View style={styles.clinicInfo}>
                  <Text style={styles.clinicName}>{clinic.name}</Text>
                  <Text style={styles.clinicSpec}>{clinic.specialization}</Text>
                </View>
                <View style={styles.clinicBadges}>
                  <StatusBadge label={clinic.isOpen ? 'Open' : 'Closed'} variant={clinic.isOpen ? 'success' : 'error'} />
                  <Text style={styles.clinicDistance}>{clinic.distance}</Text>
                </View>
              </View>

              <View style={styles.clinicMeta}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={styles.clinicAddress}>{clinic.address}</Text>
              </View>

              <View style={styles.clinicRating}>
                <Text style={styles.ratingStars}>{'⭐'.repeat(Math.round(clinic.rating))}</Text>
                <Text style={styles.ratingText}>{clinic.rating}</Text>
              </View>

              {selectedClinic === clinic.id && (
                <Animated.View entering={FadeInDown.duration(300)} style={styles.clinicActions}>
                  <Pressable onPress={() => callClinic(clinic.phone)} style={[styles.actionBtn, { borderColor: colors.physical }]}>
                    <Ionicons name="call-outline" size={16} color={colors.physical} />
                    <Text style={[styles.actionBtnText, { color: colors.physical }]}>Call</Text>
                  </Pressable>
                  <Pressable onPress={() => openMap(clinic.address)} style={[styles.actionBtn, { borderColor: colors.primary }]}>
                    <Ionicons name="navigate-outline" size={16} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>Directions</Text>
                  </Pressable>
                </Animated.View>
              )}
            </GlassCard>
          </Animated.View>
        ))}

        <Text style={styles.apiNote}>🔑 Connect Google Maps API for live location search & real map view.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { padding: spacing.xl, paddingBottom: 100, gap: spacing.md },
  mapPlaceholder: { height: 160, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  mapIcon: { fontSize: 36 },
  mapTitle: { fontSize: 16, fontFamily: typography.fonts.heading, fontWeight: '600', color: colors.textPrimary },
  mapSub: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.xxl },
  openMapBtn: { marginTop: spacing.sm },
  openMapText: { fontSize: 13, color: colors.primary, fontFamily: typography.fonts.bodySemiBold, fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  filterTab: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.round, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center' },
  filterTabActive: {},
  filterText: { fontSize: 12, color: colors.textMuted, fontFamily: typography.fonts.bodyMedium, fontWeight: '500' },
  resultCount: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.xs },
  clinicCard: {},
  clinicHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  clinicInfo: { flex: 1 },
  clinicName: { fontSize: 15, fontFamily: typography.fonts.bodySemiBold, fontWeight: '600', color: colors.textPrimary },
  clinicSpec: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  clinicBadges: { alignItems: 'flex-end', gap: 4 },
  clinicDistance: { fontSize: 11, color: colors.textMuted },
  clinicMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  clinicAddress: { flex: 1, fontSize: 12, color: colors.textMuted },
  clinicRating: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingStars: { fontSize: 12 },
  ratingText: { fontSize: 13, color: colors.warning, fontFamily: typography.fonts.bodyMedium, fontWeight: '500' },
  clinicActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1 },
  actionBtnText: { fontSize: 14, fontFamily: typography.fonts.bodySemiBold, fontWeight: '600' },
  apiNote: { textAlign: 'center', fontSize: 11, color: colors.textMuted, fontStyle: 'italic', marginTop: spacing.md },
});
