// NeuroMotion AI — Cognitive Module Context
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CognitiveSession, CognitiveScore } from '../types/cognitive';
import { generateId } from '../utils/formatting';

interface CognitiveState {
  sessions: CognitiveSession[];
  currentScore: CognitiveScore;
  aiRecommendation?: any;
  hasHydrated: boolean;
}

type CognitiveAction =
  | { type: 'ADD_SESSION'; payload: Omit<CognitiveSession, 'id' | 'timestamp' | 'localDate'> }
  | { type: 'UPDATE_SCORE'; payload: Partial<CognitiveScore> }
  | { type: 'SET_AI_RECOMMENDATION'; payload: any }
  | { type: 'INITIALIZE_FROM_PROFILE'; payload: any }
  | { type: 'HYDRATE_FROM_DB'; payload: any };

const initialState: CognitiveState = {
  sessions: [],
  hasHydrated: false,
  currentScore: {
    overall: 0,
    memoryAccuracy: 0,
    attentionScore: 0,
    reactionSpeed: 0,
    functionalScore: 0,
    consistency: 0,
    trend: 'stable',
    sessionsCompleted: 0,
    lastSessionDate: new Date().toISOString().split('T')[0],
  },
};

function cognitiveReducer(state: CognitiveState, action: CognitiveAction): CognitiveState {
  switch (action.type) {
    case 'ADD_SESSION': {
      const newSession: CognitiveSession = {
        ...action.payload,
        id: generateId(),
        timestamp: new Date().toISOString(),
        localDate: new Date().toLocaleDateString('en-CA'),
      };
      const sessions = [newSession, ...state.sessions];
      
      let { memoryAccuracy, attentionScore, reactionSpeed, functionalScore, overall } = state.currentScore;
      
      if (action.payload.gameType === 'memory') {
        const recent = sessions.filter(s => s.gameType === 'memory').slice(0, 3);
        memoryAccuracy = Math.round(recent.reduce((s, r) => s + r.accuracy, 0) / recent.length);
      } else if (action.payload.gameType === 'reaction') {
        const recent = sessions.filter(s => s.gameType === 'reaction').slice(0, 3);
        const avg = recent.reduce((s, r) => s + r.responseTime, 0) / recent.length;
        reactionSpeed = Math.round(Math.max(0, 100 - (avg - 200) / 5));
      } else if (action.payload.gameType === 'attention') {
        const recent = sessions.filter(s => s.gameType === 'attention').slice(0, 3);
        attentionScore = Math.round(recent.reduce((s, r) => s + r.score, 0) / recent.length);
      } else if (action.payload.gameType === 'story') {
        const recent = sessions.filter(s => s.gameType === 'story').slice(0, 3);
        functionalScore = Math.round(recent.reduce((s, r) => s + r.score, 0) / recent.length);
      }
      
      overall = Math.round((memoryAccuracy + attentionScore + reactionSpeed + functionalScore) / 4);
      
      return {
        ...state,
        sessions,
        currentScore: {
          ...state.currentScore,
          overall,
          memoryAccuracy,
          attentionScore,
          reactionSpeed,
          functionalScore,
          sessionsCompleted: sessions.length,
          lastSessionDate: new Date().toISOString().split('T')[0],
        },
      };
    }
    case 'UPDATE_SCORE':
      return { ...state, currentScore: { ...state.currentScore, ...action.payload } };
    case 'INITIALIZE_FROM_PROFILE': {
      const baseline = action.payload;
      if (!baseline) return state;
      
      // Pure data mapping: No hardcoded estimates allowed
      const finalMem = Math.round(baseline.memory?.accuracy || 0);
      const finalAtt = Math.round(baseline.attentionScore || 0);
      const finalSpeed = baseline.reactionTimeMs > 0 ? Math.round(Math.max(0, 100 - (baseline.reactionTimeMs - 200) / 10)) : 0;
      const finalFunc = Math.round(baseline.functionalScore || 0);
      
      const metricsArr = [finalMem, finalAtt, finalSpeed, finalFunc].filter(m => m > 0);
      const finalOverall = metricsArr.length > 0 ? Math.round(metricsArr.reduce((a, b) => a + b, 0) / metricsArr.length) : 0;

      return {
        ...state,
        currentScore: {
          ...state.currentScore,
          memoryAccuracy: finalMem,
          attentionScore: finalAtt,
          reactionSpeed: finalSpeed,
          functionalScore: finalFunc,
          overall: finalOverall,
          sessionsCompleted: state.sessions.length 
        }
      };
    }
    case 'HYDRATE_FROM_DB':
      return { ...state, ...action.payload, hasHydrated: true };
    case 'SET_AI_RECOMMENDATION':
      return { ...state, aiRecommendation: action.payload };
    default:
      return state;
  }
}

const CognitiveContext = createContext<{
  state: CognitiveState;
  dispatch: React.Dispatch<CognitiveAction>;
} | null>(null);

import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function CognitiveProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cognitiveReducer, initialState);
  const isHydrating = React.useRef(false);

  // Sync from Firebase Database on load
  React.useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        isHydrating.current = true;
        try {
          const docRef = doc(db, 'users', user.uid, 'moduleData', 'cognitive');
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            dispatch({ type: 'HYDRATE_FROM_DB', payload: data });
          } else {
            // Confirm hydration even if empty so we can start saving
            dispatch({ type: 'HYDRATE_FROM_DB', payload: { sessions: [], currentScore: initialState.currentScore } });
          }
        } catch (e) {
          console.error("Failed to load cognitive data", e);
          // Allow fallback so app doesn't stay 'unhydrated' forever
          dispatch({ type: 'HYDRATE_FROM_DB', payload: {} });
        } finally {
          isHydrating.current = false;
        }
      }
    });
    return unsub;
  }, []);

  // Sync to Firebase Database on changes
  React.useEffect(() => {
    // PREVENT DATA LOSS: Only save if we have finished hydration from DB
    if (!state.hasHydrated || isHydrating.current) return;
    
    if (auth.currentUser) {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'moduleData', 'cognitive');
      setDoc(docRef, {
        sessions: state.sessions,
        currentScore: state.currentScore,
        lastUpdated: new Date().toISOString(),
      }, { merge: true }).catch(e => console.error("Failed to save cognitive data", e));
    }
  }, [state.sessions, state.currentScore, state.hasHydrated]);

  return <CognitiveContext.Provider value={{ state, dispatch }}>{children}</CognitiveContext.Provider>;
}

export function useCognitive() {
  const ctx = useContext(CognitiveContext);
  if (!ctx) throw new Error('useCognitive must be used within CognitiveProvider');
  return ctx;
}
