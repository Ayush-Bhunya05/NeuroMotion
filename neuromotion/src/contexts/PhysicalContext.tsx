// NeuroMotion AI — Physical Module Context with Firebase Sync
import React, { createContext, useContext, useReducer, ReactNode, useRef, useEffect } from 'react';
import { ExerciseSession, PhysicalScore, JointAngles } from '../types/physical';
import { generateId } from '../utils/formatting';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface PhysicalState {
  sessions: ExerciseSession[];
  currentScore: PhysicalScore;
  recentAngles: JointAngles | null;
  isTracking: boolean;
  hasHydrated: boolean; // For sync safety
}

type PhysicalAction =
  | { type: 'ADD_SESSION'; payload: Omit<ExerciseSession, 'id' | 'timestamp'> }
  | { type: 'UPDATE_ANGLES'; payload: JointAngles }
  | { type: 'SET_TRACKING'; payload: boolean }
  | { type: 'UPDATE_SCORE'; payload: Partial<PhysicalScore> }
  | { type: 'HYDRATE_FROM_DB'; payload: any };

const initialState: PhysicalState = {
  sessions: [],
  hasHydrated: false,
  currentScore: {
    overall: 0,
    accuracy: 0,
    stability: 0,
    consistency: 0,
    rangeOfMotion: 0,
    trend: 'stable',
    sessionsCompleted: 0,
    lastSessionDate: new Date().toISOString().split('T')[0],
  },
  recentAngles: null,
  isTracking: false,
};

function physicalReducer(state: PhysicalState, action: PhysicalAction): PhysicalState {
  switch (action.type) {
    case 'ADD_SESSION': {
      const newSession: ExerciseSession = {
        ...action.payload,
        id: generateId(),
        timestamp: new Date().toISOString(),
      };
      const sessions = [newSession, ...state.sessions];
      const avgScore = sessions.slice(0, 5).reduce((s, sess) => s + sess.score, 0) / Math.min(sessions.length, 5);
      return {
        ...state,
        sessions,
        currentScore: {
          ...state.currentScore,
          overall: Math.round(avgScore),
          sessionsCompleted: sessions.length,
          lastSessionDate: new Date().toISOString().split('T')[0],
        },
      };
    }
    case 'UPDATE_ANGLES':
      return { ...state, recentAngles: action.payload };
    case 'SET_TRACKING':
      return { ...state, isTracking: action.payload };
    case 'UPDATE_SCORE':
      return { ...state, currentScore: { ...state.currentScore, ...action.payload } };
    case 'HYDRATE_FROM_DB':
      return { ...state, ...action.payload, hasHydrated: true };
    default:
      return state;
  }
}

const PhysicalContext = createContext<{
  state: PhysicalState;
  dispatch: React.Dispatch<PhysicalAction>;
} | null>(null);

export function PhysicalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(physicalReducer, initialState);
  const isHydrating = useRef(false);

  // 📥 Sync FROM Firebase on Load
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        isHydrating.current = true;
        try {
          const docRef = doc(db, 'users', user.uid, 'moduleData', 'physical');
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            dispatch({ type: 'HYDRATE_FROM_DB', payload: snap.data() });
          } else {
            dispatch({ type: 'HYDRATE_FROM_DB', payload: { sessions: [], currentScore: initialState.currentScore } });
          }
        } catch (e) {
          console.error("Physical hydration failed", e);
          dispatch({ type: 'HYDRATE_FROM_DB', payload: {} });
        } finally {
          isHydrating.current = false;
        }
      }
    });
    return unsub;
  }, []);

  // 📤 Sync TO Firebase on Changes
  useEffect(() => {
    if (!state.hasHydrated || isHydrating.current) return;
    
    if (auth.currentUser) {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'moduleData', 'physical');
      setDoc(docRef, {
        sessions: state.sessions,
        currentScore: state.currentScore,
        lastUpdated: new Date().toISOString(),
      }, { merge: true }).catch(err => console.error("Physical save failed", err));
    }
  }, [state.sessions, state.currentScore, state.hasHydrated]);

  return <PhysicalContext.Provider value={{ state, dispatch }}>{children}</PhysicalContext.Provider>;
}

export function usePhysical() {
  const ctx = useContext(PhysicalContext);
  if (!ctx) throw new Error('usePhysical must be used within PhysicalProvider');
  return ctx;
}
