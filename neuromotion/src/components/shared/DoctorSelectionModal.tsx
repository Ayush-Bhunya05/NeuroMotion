// NeuroMotion AI — Clinical Specialist Selection Modal (Simplistic Edition)
import React, { useState, useEffect } from 'react';
import { 
  View, Text, Modal, StyleSheet, FlatList, 
  Pressable, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors, spacing, borderRadius, typography } from '../../theme';
import GlassCard from '../ui/GlassCard';
import { dbService, DoctorData } from '../../services/dbService';
import { sendConnectionRequest, getPatientConnectionStatus, ConnectionStatus } from '../../services/connectionService';

interface Props {
  visible: boolean;
  onClose: () => void;
  module: 'physical' | 'cognitive';
}

interface DoctorWithStatus extends DoctorData {
  connectionStatus: ConnectionStatus | null;
}

export default function DoctorSelectionModal({ visible, onClose, module }: Props) {
  const [doctors, setDoctors] = useState<DoctorWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadDoctors();
    }
  }, [visible, module]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const list = await dbService.getDoctorsByModule(module);
      
      // Fetch connection status for each doctor
      const withStatus: DoctorWithStatus[] = await Promise.all(
        list.map(async (doc) => {
          const status = await getPatientConnectionStatus(doc.id, module);
          return { ...doc, connectionStatus: status };
        })
      );
      
      setDoctors(withStatus);
    } catch (e) {
      console.error('Failed to load doctors', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (doctor: DoctorWithStatus) => {
    if (doctor.connectionStatus === 'accepted') {
      Alert.alert('Already Connected', `You are already connected to ${doctor.name}.`);
      return;
    }
    if (doctor.connectionStatus === 'pending') {
      Alert.alert('Request Pending', `Your request to ${doctor.name} is still pending.`);
      return;
    }

    Alert.alert(
      "Send Connection Request",
      `Send a request to ${doctor.name}? They will be notified to monitor your progress once they accept.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Connect", 
          onPress: async () => {
            setSendingTo(doctor.id);
            const success = await sendConnectionRequest(doctor.id, doctor.name, module);
            if (success) {
              setDoctors(prev => prev.map(d => 
                d.id === doctor.id ? { ...d, connectionStatus: 'pending' } : d
              ));
            }
            setSendingTo(null);
          }
        }
      ]
    );
  };

  const getStatusAction = (status: ConnectionStatus | null) => {
    switch (status) {
      case 'accepted':
        return { icon: 'checkmark-circle' as const, color: '#10B981', label: 'Connected' };
      case 'pending':
        return { icon: 'time-outline' as const, color: '#F59E0B', label: 'Pending' };
      default:
        return { icon: 'add-circle-outline' as const, color: module === 'physical' ? colors.physical : colors.cognitive, label: 'Connect' };
    }
  };

  const accentColor = module === 'physical' ? '#00D9A6' : colors.cognitive;

  return (
    <Modal visible={visible} transparent={false} animationType="fade">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgPrimary }]}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Find {module === 'physical' ? 'Physical' : 'Cognitive'} Expert</Text>
              </View>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color="#64748B" />
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator color={accentColor} style={{ marginVertical: 40 }} />
            ) : (
              <FlatList
                data={doctors}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                  const action = getStatusAction(item.connectionStatus);
                  const isSending = sendingTo === item.id;
                  
                  return (
                    <Pressable 
                      onPress={() => handleConnect(item)}
                      disabled={isSending}
                      style={({ pressed }) => [
                        styles.doctorCard,
                        { borderColor: colors.glassBorderLight },
                        pressed && { opacity: 0.7 }
                      ]}
                    >
                      <View style={[styles.avatar, { backgroundColor: accentColor + '10' }]}>
                        <Text style={[styles.avatarText, { color: accentColor }]}>
                          {item.name.charAt(0)}
                        </Text>
                      </View>
                      
                      <View style={styles.info}>
                        <Text style={styles.docName}>{item.name}</Text>
                        <Text style={styles.docEmail} numberOfLines={1}>{item.email}</Text>
                        <Text style={styles.docSpec}>{item.specialty === 'dual' ? 'Dual Domain Specialist' : `${module.charAt(0).toUpperCase() + module.slice(1)} Specialist`}</Text>
                      </View>

                      {isSending ? (
                        <ActivityIndicator size="small" color={accentColor} />
                      ) : (
                        <View style={styles.actionBlock}>
                          <Ionicons name={action.icon} size={20} color={action.color} />
                          <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No specialists found for this domain.</Text>
                }
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalView: { width: '100%', maxHeight: '80%', padding: spacing.xl, borderRadius: 28, backgroundColor: colors.bgSecondary },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  title: { fontSize: 18, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: colors.textPrimary },
  list: { gap: 12 },
  doctorCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.02)', 
    padding: spacing.md, 
    borderRadius: 20,
    borderWidth: 1,
    gap: 12
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  info: { flex: 1 },
  docName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, fontFamily: typography.fonts.bodySemiBold },
  docEmail: { fontSize: 12, color: colors.textSecondary, fontFamily: typography.fonts.body, marginTop: 2 },
  docSpec: { fontSize: 11, color: colors.textMuted, marginTop: 4, fontFamily: typography.fonts.body, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionBlock: { alignItems: 'center', gap: 2 },
  actionLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginVertical: 40, fontSize: 13 }
});
