// NeuroMotion AI — Local JSON Database Simulator
// This acts as a mock backend to persist and retrieve user data locally 
// using AsyncStorage while maintaining a JSON structure.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { 
  collection, doc, setDoc, getDocs, query, 
  orderBy, limit, where 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import defaultUsers from './users.json';

const DB_KEY = '@neuromotion_db_v1';

// Types matches our users.json schema
export interface PatientData {
  id: string;
  name: string;
  email: string;
  contact: string;
  password?: string;
  role: 'user';
  physicalDoctorId?: string;
  cognitiveDoctorId?: string;
}

export interface DoctorData {
  id: string;
  name: string;
  email: string;
  contact: string;
  specialty: string;
  module: 'physical' | 'cognitive' | 'dual';
  password?: string;
  role: 'doctor';
}

export interface GuardianData {
  id: string;
  name: string;
  email: string;
  contact: string;
  patientId: string;
  password?: string;
  role: 'guardian';
}

export interface AppDatabase {
  patients: PatientData[];
  doctors: DoctorData[];
  guardians: GuardianData[];
}

class DBService {
  /**
   * Loads the current JSON database from local storage.
   */
  async getDatabase(): Promise<AppDatabase> {
    try {
      const jsonValue = await AsyncStorage.getItem(DB_KEY);
      if (jsonValue != null) {
        return JSON.parse(jsonValue) as AppDatabase;
      }
      await this.saveDatabase(defaultUsers as AppDatabase);
      return defaultUsers as AppDatabase;
    } catch (e) {
      console.error("Error reading database", e);
      return defaultUsers as AppDatabase;
    }
  }

  /**
   * Saves the entire JSON tree back to local storage.
   */
  async saveDatabase(db: AppDatabase): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(db);
      await AsyncStorage.setItem(DB_KEY, jsonValue);
      return true;
    } catch (e) {
      console.error("Error saving database", e);
      return false;
    }
  }

  /**
   * Generates a random 6-character ID for new users.
   */
  generateId(prefix: string) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${result}`;
  }

  // == Retrieval Helpers ==

  async getDoctorsByModule(module: 'physical' | 'cognitive'): Promise<DoctorData[]> {
    try {
      // Priority 1: Fetch live doctors from Firestore (include those with the specific module or 'dual')
      const q = query(
        collection(db, 'users'), 
        where('role', '==', 'doctor'), 
        where('specialty', 'in', [module, 'dual'])
      );
      const snap = await getDocs(q);
      const cloudDocs: DoctorData[] = [];
      
      snap.forEach(d => {
        const data = d.data();
        cloudDocs.push({
          id: d.id,
          name: data.name,
          email: data.email,
          contact: data.contact,
          specialty: data.specialty,
          module: data.module || data.specialty,
          role: 'doctor'
        });
      });
      
      if (cloudDocs.length > 0) return cloudDocs;
    } catch (e) {
      console.warn("Firestore doctors fetch failed, falling back to local seed", e);
    }
    
    // Priority 2: Fallback to local JSON seeding if cloud is empty or fails
    const dbLocal = await this.getDatabase();
    return dbLocal.doctors.filter(d => d.module === module || d.module === 'dual');
  }

  // == Registration & Mapping ==

  async registerPatient(data: Omit<PatientData, 'id' | 'role'>) {
    const db = await this.getDatabase();
    if (db.patients.find(u => u.email === data.email)) throw new Error('Email already exists');
    const newUser: PatientData = { ...data, id: this.generateId('NM'), role: 'user' };
    db.patients.push(newUser);
    await this.saveDatabase(db);
    return newUser;
  }

  async registerDoctor(data: Omit<DoctorData, 'id' | 'role'>) {
    const db = await this.getDatabase();
    if (db.doctors.find(u => u.email === data.email)) throw new Error('Email already exists');
    const newDoc: DoctorData = { ...data, id: this.generateId('DOC'), role: 'doctor' };
    db.doctors.push(newDoc);
    await this.saveDatabase(db);
    return newDoc;
  }

  async registerGuardian(data: Omit<GuardianData, 'id' | 'role'>) {
    const db = await this.getDatabase();
    if (db.guardians.find(u => u.email === data.email)) throw new Error('Email already exists');
    const newGuardian: GuardianData = { ...data, id: this.generateId('GRD'), role: 'guardian' };
    db.guardians.push(newGuardian);
    await this.saveDatabase(db);
    return newGuardian;
  }

  async assignDoctorToPatient(patientId: string, doctorId: string, moduleType: 'physical' | 'cognitive') {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const updateField = moduleType === 'cognitive' ? 'cognitiveDoctorId' : 'physicalDoctorId';
        await setDoc(userRef, { [updateField]: doctorId }, { merge: true });
        console.log(`[FIREBASE] Linked doctor ${doctorId} to ${moduleType}`);
      }
      
      // Doctor Notification Simulation
      Alert.alert("Success", `${moduleType.charAt(0).toUpperCase() + moduleType.slice(1)} Specialist registered. They have been notified and can now monitor your progress data.`);
      return true;
    } catch (e) {
      console.error('Failed to link doctor', e);
      Alert.alert("Error", "Clinical registration failed. Check your network.");
      return false;
    }
  }
}

export const dbService = new DBService();

// ==================== PHYSICAL SESSION PERSISTENCE ====================

const PHYSICAL_SESSIONS_KEY = '@neuromotion_physical_sessions';

export interface StoredPhysicalSession {
  id: string;
  userId?: string;
  exerciseName: string;
  joint: string;
  startTime: number;
  endTime?: number;
  totalReps: number;
  correctReps: number;
  reps: any[];
  avgAngle: number;
  maxAngle: number;
  minAngle: number;
  angleVariation: number;
  coachingEvents?: any[];
  scoreResult?: {
    accuracy: number;
    romScore: number;
    consistency: number;
    finalScore: number;
    grade: string;
    feedback: string[];
    riskLevel: string;
  };
  createdAt: string;
}

/**
 * Save a physical rehab session result to local storage + Cloud Firestore if connected.
 */
export async function savePhysicalSession(session: StoredPhysicalSession): Promise<boolean> {
  try {
    const existingSessions = await getPhysicalSessions(false); // Fetch local only
    existingSessions.push(session);
    await AsyncStorage.setItem(PHYSICAL_SESSIONS_KEY, JSON.stringify(existingSessions));
    
    const currentUser = auth.currentUser;
    if (currentUser) {
      if (!session.userId) session.userId = currentUser.uid;
      const docRef = doc(db, 'users', currentUser.uid, 'physicalSessions', session.id);
      await setDoc(docRef, session);
    }
    return true;
  } catch (e) {
    console.error('Error saving physical session:', e);
    return false;
  }
}

/**
 * Get all physical sessions. If authenticated, fetch from Cloud and sync locally.
 */
export async function getPhysicalSessions(fetchFromCloud: boolean = true): Promise<StoredPhysicalSession[]> {
  try {
    let cloudSessions: StoredPhysicalSession[] = [];
    const currentUser = auth.currentUser;
    if (fetchFromCloud && currentUser) {
      const q = query(collection(db, 'users', currentUser.uid, 'physicalSessions'));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        cloudSessions.push(doc.data() as StoredPhysicalSession);
      });
      if (cloudSessions.length > 0) {
        await AsyncStorage.setItem(PHYSICAL_SESSIONS_KEY, JSON.stringify(cloudSessions));
        return cloudSessions;
      }
    }
    const json = await AsyncStorage.getItem(PHYSICAL_SESSIONS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error('Error loading physical sessions:', e);
    const json = await AsyncStorage.getItem(PHYSICAL_SESSIONS_KEY);
    return json ? JSON.parse(json) : [];
  }
}

/**
 * Get physical sessions for a specific exercise.
 */
export async function getPhysicalSessionsByExercise(exerciseName: string): Promise<StoredPhysicalSession[]> {
  const all = await getPhysicalSessions();
  return all.filter(s => s.exerciseName.toLowerCase() === exerciseName.toLowerCase());
}

/**
 * Get the most recent N physical sessions.
 */
export async function getRecentPhysicalSessions(count: number = 10): Promise<StoredPhysicalSession[]> {
  const all = await getPhysicalSessions();
  return all
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, count);
}

// ==================== COGNITIVE SESSION PERSISTENCE ====================

const COGNITIVE_SESSIONS_KEY = '@neuromotion_cognitive_sessions';

export interface StoredCognitiveSession {
  id: string;
  userId?: string;
  gameType: 'memory' | 'attention' | 'reaction';
  score: number;
  accuracy: number;
  wrongAttempts?: number;
  timeTakenMs: number;
  createdAt: string;
}

/**
 * Save a cognitive rehab session result.
 */
export async function saveCognitiveSession(session: StoredCognitiveSession): Promise<boolean> {
  try {
    const existing = await getCognitiveSessions();
    existing.push(session);
    await AsyncStorage.setItem(COGNITIVE_SESSIONS_KEY, JSON.stringify(existing));
    
    const currentUser = auth.currentUser;
    if (currentUser) {
      if (!session.userId) session.userId = currentUser.uid;
      const docRef = doc(db, 'users', currentUser.uid, 'cognitiveSessions', session.id);
      await setDoc(docRef, session);
    }
    return true;
  } catch (e) {
    console.error('Error saving cognitive session:', e);
    return false;
  }
}

/**
 * Get all cognitive sessions.
 */
export async function getCognitiveSessions(): Promise<StoredCognitiveSession[]> {
  try {
    const json = await AsyncStorage.getItem(COGNITIVE_SESSIONS_KEY);
    const local = json ? JSON.parse(json) : [];
    
    const currentUser = auth.currentUser;
    if (currentUser) {
      const q = query(collection(db, 'users', currentUser.uid, 'cognitiveSessions'));
      const querySnapshot = await getDocs(q);
      const cloud: StoredCognitiveSession[] = [];
      querySnapshot.forEach((doc) => {
        cloud.push(doc.data() as StoredCognitiveSession);
      });
      if (cloud.length > 0) {
        await AsyncStorage.setItem(COGNITIVE_SESSIONS_KEY, JSON.stringify(cloud));
        return cloud;
      }
    }
    return local;
  } catch (e) {
    console.error('Error loading cognitive sessions:', e);
    return [];
  }
}
