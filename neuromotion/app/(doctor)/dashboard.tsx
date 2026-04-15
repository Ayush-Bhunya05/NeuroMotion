// NeuroMotion AI — Doctor Dashboard (Connection-Based)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../src/services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import { useApp } from '../../src/contexts/AppContext';
import { 
  getPendingRequests, getAcceptedConnections,
  acceptConnectionRequest, rejectConnectionRequest,
  ConnectionRequest 
} from '../../src/services/connectionService';

export default function DoctorDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state: app } = useApp();
  
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [connectedPatients, setConnectedPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const docModule = (app.user as any)?.specialty || (app.user as any)?.module || 'physical';

  const fetchData = useCallback(async () => {
    try {
      const curUser = auth.currentUser;
      if (!curUser || !app.user) return;

      // 1. Fetch pending connection requests
      const pending = await getPendingRequests();
      setPendingRequests(pending);

      // 2. Fetch accepted connections and enrich with patient data
      const accepted = await getAcceptedConnections();
      
      const enrichedPatients = await Promise.all(
        accepted.map(async (conn) => {
          try {
            const patientDoc = await getDoc(doc(db, 'users', conn.patientId));
            const data = patientDoc.exists() ? patientDoc.data() : {};
            let score = 0;
            let sessionCount = 0;

            if (conn.module === 'cognitive') {
              score = data.score?.cognitive || 0;
              try {
                const cogQ = query(collection(db, 'users', conn.patientId, 'cognitiveSessions'));
                const cogSnap = await getDocs(cogQ);
                sessionCount = cogSnap.size;
              } catch {}
            } else {
              try {
                const physQ = query(collection(db, 'users', conn.patientId, 'physicalSessions'));
                const physSnap = await getDocs(physQ);
                sessionCount = physSnap.size;
                
                if (physSnap.size > 0) {
                  let romTot = 0, formTot = 0, count = 0;
                  physSnap.forEach(pd => {
                    const sData = pd.data();
                    if (sData.scoreResult) {
                      count++;
                      romTot += sData.scoreResult.romScore || 0;
                      formTot += sData.scoreResult.accuracy || 0;
                    }
                  });
                  if (count > 0) score = Math.round((romTot + formTot) / (count * 2));
                }
              } catch {}
            }

            return {
              id: conn.patientId,
              name: data.name || conn.patientName,
              email: data.email || conn.patientEmail,
              goal: data.rehabGoal || conn.module,
              module: conn.module,
              score,
              sessionCount,
              connectedAt: conn.respondedAt || conn.createdAt,
            };
          } catch {
            return {
              id: conn.patientId,
              name: conn.patientName,
              email: conn.patientEmail,
              goal: conn.module,
              module: conn.module,
              score: 0,
              sessionCount: 0,
              connectedAt: conn.createdAt,
            };
          }
        })
      );

      setConnectedPatients(enrichedPatients);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [app.user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAccept = async (request: ConnectionRequest) => {
    Alert.alert(
      'Accept Patient',
      `Accept connection from ${request.patientName}? You will be able to view their ${request.module} rehabilitation data and reports.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setProcessingId(request.id);
            const success = await acceptConnectionRequest(request);
            if (success) {
              setPendingRequests(prev => prev.filter(r => r.id !== request.id));
              fetchData(); // Refresh to show in connected list
            }
            setProcessingId(null);
          }
        }
      ]
    );
  };

  const handleReject = async (request: ConnectionRequest) => {
    Alert.alert(
      'Decline Request',
      `Decline connection from ${request.patientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(request.id);
            await rejectConnectionRequest(request);
            setPendingRequests(prev => prev.filter(r => r.id !== request.id));
            setProcessingId(null);
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        try { await auth.signOut(); router.replace('/(auth)/login'); } catch {}
      }}
    ]);
  };

  const avgScore = connectedPatients.length > 0 
    ? Math.round(connectedPatients.reduce((s, p) => s + p.score, 0) / connectedPatients.length) 
    : 0;

  const moduleColor = docModule === 'cognitive' ? colors.cognitive : '#00D9A6';
  const moduleLabel = docModule === 'cognitive' ? 'Cognitive' : 'Physical';

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.moduleBadge}>
                <View style={[styles.moduleDot, { backgroundColor: moduleColor }]} />
                <Text style={[styles.moduleText, { color: moduleColor }]}>{moduleLabel} Specialist</Text>
              </View>
              <Text style={styles.name}>{app.user?.name || 'Doctor'}</Text>
            </View>
            <Pressable onPress={handleLogout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={20} color={colors.textMuted} />
            </Pressable>
            <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.avatar}>
              <Text style={styles.avatarText}>{app.user?.name?.charAt(0) || 'D'}</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderColor: moduleColor + '20' }]}>
              <Ionicons name="people" size={22} color={moduleColor} />
              <Text style={styles.statVal}>{connectedPatients.length}</Text>
              <Text style={styles.statLbl}>Patients</Text>
            </View>
            <View style={[styles.statCard, { borderColor: '#F59E0B30' }]}>
              <Ionicons name="notifications" size={22} color="#F59E0B" />
              <Text style={styles.statVal}>{pendingRequests.length}</Text>
              <Text style={styles.statLbl}>Pending</Text>
            </View>
            <View style={[styles.statCard, { borderColor: colors.primary + '20' }]}>
              <Ionicons name="analytics" size={22} color={colors.primary} />
              <Text style={styles.statVal}>{avgScore}%</Text>
              <Text style={styles.statLbl}>Avg Score</Text>
            </View>
          </View>
        </Animated.View>

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBadge}>
                <Ionicons name="notifications" size={16} color="#F59E0B" />
                <Text style={styles.sectionBadgeText}>{pendingRequests.length}</Text>
              </View>
              <Text style={styles.sectionTitle}>Connection Requests</Text>
            </View>
            
            {pendingRequests.map((request, i) => (
              <Animated.View key={request.id} entering={FadeInDown.delay(250 + i * 60).duration(400)}>
                <View style={styles.requestCard}>
                  <View style={styles.requestTop}>
                    <View style={[styles.requestAvatar, { backgroundColor: moduleColor + '15' }]}>
                      <Text style={[styles.requestAvatarText, { color: moduleColor }]}>
                        {request.patientName.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestName}>{request.patientName}</Text>
                      <Text style={styles.requestEmail}>{request.patientEmail}</Text>
                      <View style={styles.requestMeta}>
                        <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                        <Text style={styles.requestTime}>
                          {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Actions */}
                  {processingId === request.id ? (
                    <ActivityIndicator color={moduleColor} style={{ marginTop: 12 }} />
                  ) : (
                    <View style={styles.requestActions}>
                      <Pressable 
                        style={[styles.actionBtn, styles.rejectBtn]} 
                        onPress={() => handleReject(request)}
                      >
                        <Ionicons name="close" size={16} color="#EF4444" />
                        <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Decline</Text>
                      </Pressable>
                      <Pressable 
                        style={[styles.actionBtn, styles.acceptBtn]} 
                        onPress={() => handleAccept(request)}
                      >
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={[styles.actionBtnText, { color: '#fff' }]}>Accept</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* Connected Patients Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={18} color={colors.textPrimary} />
            <Text style={styles.sectionTitle}>Connected Patients</Text>
          </View>

          {connectedPatients.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={56} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Connected Patients</Text>
              <Text style={styles.emptyDesc}>
                Patients will send you connection requests.{'\n'}Accept them to view their clinical data.
              </Text>
            </View>
          ) : (
            connectedPatients.map((patient, i) => (
              <Animated.View key={patient.id} entering={FadeInDown.delay(350 + i * 60).duration(400)}>
                <Pressable 
                  onPress={() => router.push({ pathname: '/(doctor)/patient-detail', params: { patientId: patient.id } })}
                  style={({ pressed }) => [styles.patientCard, pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] }]}
                >
                  <LinearGradient 
                    colors={patient.module === 'cognitive' ? [colors.cognitive, colors.cognitiveDark] : ['#00D9A6', '#009E79']} 
                    style={styles.patientAvatar}
                  >
                    <Text style={styles.patientAvatarText}>{patient.name.charAt(0)}</Text>
                  </LinearGradient>
                  
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <View style={styles.patientMetaRow}>
                      <View style={styles.metaChip}>
                        <Ionicons name="fitness-outline" size={12} color={moduleColor} />
                        <Text style={[styles.metaChipText, { color: moduleColor }]}>{patient.sessionCount} sessions</Text>
                      </View>
                    </View>
                  </View>

                  {/* Score */}
                  <View style={styles.scoreContainer}>
                    <Text style={[styles.scoreVal, { 
                      color: patient.score >= 75 ? '#10B981' : patient.score >= 50 ? '#F59E0B' : patient.score > 0 ? '#EF4444' : colors.textMuted 
                    }]}>
                      {patient.score > 0 ? patient.score : '--'}
                    </Text>
                    <Text style={styles.scoreLbl}>{patient.score > 0 ? 'score' : 'new'}</Text>
                  </View>
                  
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              </Animated.View>
            ))
          )}
        </Animated.View>

        <Text style={styles.footer}>Pull down to refresh · NeuroMotion AI</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { padding: spacing.xl, paddingBottom: 100 },
  
  // Header
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  moduleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  moduleDot: { width: 8, height: 8, borderRadius: 4 },
  moduleText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  name: { fontSize: 26, fontWeight: '700', color: colors.textPrimary },
  logoutBtn: { 
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)', 
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' 
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: { 
    flex: 1, alignItems: 'center', paddingVertical: 18, 
    backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1
  },
  statVal: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginTop: 6 },
  statLbl: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  // Section Headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionBadge: { 
    flexDirection: 'row', alignItems: 'center', gap: 4, 
    backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 
  },
  sectionBadgeText: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },

  // Request Cards
  requestCard: { 
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: '#FEF3C730'
  },
  requestTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  requestAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  requestAvatarText: { fontSize: 20, fontWeight: '700' },
  requestInfo: { flex: 1 },
  requestName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  requestEmail: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  requestMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  requestTime: { fontSize: 11, color: colors.textMuted },
  requestActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 6, paddingVertical: 12, borderRadius: 14 
  },
  rejectBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  acceptBtn: { backgroundColor: '#10B981' },
  actionBtnText: { fontSize: 14, fontWeight: '600' },

  // Patient Cards
  patientCard: { 
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 10
  },
  patientAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  patientAvatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  patientMetaRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.03)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  metaChipText: { fontSize: 11, fontWeight: '600' },

  // Score 
  scoreContainer: { alignItems: 'center', marginRight: 4 },
  scoreVal: { fontSize: 24, fontWeight: '700' },
  scoreLbl: { fontSize: 10, color: colors.textMuted },

  // Empty State
  emptyState: { 
    alignItems: 'center', paddingVertical: 48, backgroundColor: '#FFFFFF',
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', borderStyle: 'dashed'
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.textSecondary, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20, paddingHorizontal: 32 },

  // Footer
  footer: { textAlign: 'center', fontSize: 11, color: colors.textMuted, marginTop: 32 },
});
