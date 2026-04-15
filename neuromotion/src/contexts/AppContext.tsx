// NeuroMotion AI — App Context (Module Selection, User State)
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ModuleType, UserProfile } from '../types/user';
import { DUMMY_USER } from '../utils/constants';

interface AppState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  activeModule: ModuleType;
  isModuleSelectVisible: boolean;
}

type AppAction =
  | { type: 'LOGIN'; payload: UserProfile }
  | { type: 'LOGOUT' }
  | { type: 'SET_ACTIVE_MODULE'; payload: ModuleType }
  | { type: 'TOGGLE_MODULE_SELECT'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: Partial<UserProfile> }
  | { type: 'ADD_MODULE'; payload: ModuleType }
  | { type: 'ADD_GUARDIAN'; payload: { name: string; email: string; relationship: string } };

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  activeModule: 'physical',
  isModuleSelectVisible: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false };
    case 'SET_ACTIVE_MODULE':
      return { ...state, activeModule: action.payload };
    case 'TOGGLE_MODULE_SELECT':
      return { ...state, isModuleSelectVisible: action.payload };
    case 'UPDATE_USER':
      if (!state.user) return state;
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'ADD_GUARDIAN':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          guardians: [
            ...state.user.guardians,
            { ...action.payload, id: `g_${Date.now()}`, addedAt: new Date().toISOString() },
          ],
        },
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Sync Firebase state with global app state
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as UserProfile;
            dispatch({ type: 'LOGIN', payload: { ...userData, id: firebaseUser.uid } });
          } else {
            // Fallback if data hasn't propagated or it's a basic login
            console.warn("No user profile found in Firestore. Using default profile.");
            dispatch({ 
              type: 'LOGIN', 
              payload: { ...DUMMY_USER, id: firebaseUser.uid, name: firebaseUser.displayName || 'User', email: firebaseUser.email || '' } 
            });
          }
        } catch (err) {
          console.error("Error fetching user session", err);
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useActiveModule() {
  const { state } = useApp();
  return state.activeModule;
}

export function useUser() {
  const { state } = useApp();
  return state.user;
}
