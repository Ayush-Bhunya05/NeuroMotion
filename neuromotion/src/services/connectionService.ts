// NeuroMotion AI — Doctor-Patient Connection Service
// Handles the full lifecycle: Request → Accept/Reject → Active Connection

import { 
  collection, doc, setDoc, getDoc, getDocs, 
  query, where, deleteDoc, updateDoc, serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Alert } from 'react-native';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export interface ConnectionRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  module: 'physical' | 'cognitive';
  status: ConnectionStatus;
  createdAt: string;
  respondedAt?: string;
}

// ==================== PATIENT SIDE ====================

/**
 * Patient sends a connection request to a doctor.
 * Creates a document in the 'connectionRequests' collection.
 */
export async function sendConnectionRequest(
  doctorId: string, 
  doctorName: string, 
  module: 'physical' | 'cognitive'
): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in.');
      return false;
    }

    // Fetch patient profile for name/email
    const patientDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const patientData = patientDoc.exists() ? patientDoc.data() : {};

    // Check if a request already exists (pending or accepted)
    const existingQ = query(
      collection(db, 'connectionRequests'),
      where('patientId', '==', currentUser.uid),
      where('doctorId', '==', doctorId),
      where('module', '==', module)
    );
    const existingSnap = await getDocs(existingQ);
    
    const activeRequest = existingSnap.docs.find(d => {
      const s = d.data().status;
      return s === 'pending' || s === 'accepted';
    });
    
    if (activeRequest) {
      const status = activeRequest.data().status;
      if (status === 'accepted') {
        Alert.alert('Already Connected', `You are already connected to ${doctorName}.`);
      } else {
        Alert.alert('Request Pending', `Your request to ${doctorName} is already pending.`);
      }
      return false;
    }

    // Create the connection request
    const requestId = `cr_${currentUser.uid}_${doctorId}_${Date.now()}`;
    const requestData: ConnectionRequest = {
      id: requestId,
      patientId: currentUser.uid,
      patientName: patientData.name || 'Patient',
      patientEmail: patientData.email || '',
      doctorId,
      doctorName,
      module,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'connectionRequests', requestId), requestData);

    Alert.alert(
      'Request Sent', 
      `Your connection request has been sent to ${doctorName}. You'll be connected once they accept.`
    );
    return true;
  } catch (e) {
    console.error('Failed to send connection request:', e);
    Alert.alert('Error', 'Failed to send request. Please try again.');
    return false;
  }
}

/**
 * Get the current connection status for a patient with a specific doctor.
 */
export async function getPatientConnectionStatus(
  doctorId: string, 
  module: 'physical' | 'cognitive'
): Promise<ConnectionStatus | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    const q = query(
      collection(db, 'connectionRequests'),
      where('patientId', '==', currentUser.uid),
      where('doctorId', '==', doctorId),
      where('module', '==', module)
    );
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    
    // Find the most recent non-rejected request
    let latest: any = null;
    snap.forEach(d => {
      const data = d.data();
      if (data.status !== 'rejected') {
        if (!latest || data.createdAt > latest.createdAt) {
          latest = data;
        }
      }
    });
    
    return latest?.status || null;
  } catch (e) {
    return null;
  }
}

// ==================== DOCTOR SIDE ====================

/**
 * Get all pending connection requests for the logged-in doctor.
 */
export async function getPendingRequests(): Promise<ConnectionRequest[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    const q = query(
      collection(db, 'connectionRequests'),
      where('doctorId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    const results: ConnectionRequest[] = [];
    snap.forEach(d => results.push(d.data() as ConnectionRequest));
    
    // Sort newest first
    return results.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (e) {
    console.error('Failed to fetch pending requests:', e);
    return [];
  }
}

/**
 * Get all accepted connections for the logged-in doctor.
 */
export async function getAcceptedConnections(): Promise<ConnectionRequest[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    const q = query(
      collection(db, 'connectionRequests'),
      where('doctorId', '==', currentUser.uid),
      where('status', '==', 'accepted')
    );
    const snap = await getDocs(q);
    const results: ConnectionRequest[] = [];
    snap.forEach(d => results.push(d.data() as ConnectionRequest));
    
    return results.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (e) {
    console.error('Failed to fetch accepted connections:', e);
    return [];
  }
}

/**
 * Doctor accepts a connection request.
 * Updates the request status AND writes the doctorId to the patient's profile.
 */
export async function acceptConnectionRequest(request: ConnectionRequest): Promise<boolean> {
  try {
    // 1. Update the request document
    const requestRef = doc(db, 'connectionRequests', request.id);
    await updateDoc(requestRef, { 
      status: 'accepted',
      respondedAt: new Date().toISOString()
    });

    // 2. Link the doctor to the patient's profile
    const updateField = request.module === 'cognitive' ? 'cognitiveDoctorId' : 'physicalDoctorId';
    const patientRef = doc(db, 'users', request.patientId);
    await updateDoc(patientRef, { [updateField]: request.doctorId });

    console.log(`[CONNECTION] Accepted: Doctor ${request.doctorId} → Patient ${request.patientId} (${request.module})`);
    return true;
  } catch (e) {
    console.error('Failed to accept connection:', e);
    Alert.alert('Error', 'Failed to accept. Please try again.');
    return false;
  }
}

/**
 * Doctor rejects a connection request.
 */
export async function rejectConnectionRequest(request: ConnectionRequest): Promise<boolean> {
  try {
    const requestRef = doc(db, 'connectionRequests', request.id);
    await updateDoc(requestRef, { 
      status: 'rejected',
      respondedAt: new Date().toISOString()
    });
    return true;
  } catch (e) {
    console.error('Failed to reject connection:', e);
    return false;
  }
}
