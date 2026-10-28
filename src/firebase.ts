import { initializeApp } from 'firebase/app';
import { getAuth, signOut } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Silence benign connection retry/offline warnings in Firestore WebChannel
try {
  setLogLevel('error');
} catch (e) {
  // Ignore in environments where setLogLevel is unavailable
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId); 
export const auth = getAuth(app);
export const storage = getStorage(app);

export const FIRESTORE_UPGRADE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`;

let _isQuotaExceeded = false;
export function isQuotaActive(): boolean {
  if (_isQuotaExceeded) return true;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('nexamart_firestore_quota_exceeded') === 'true';
  }
  return false;
}

export function setQuotaActive(val: boolean) {
  _isQuotaExceeded = val;
  if (typeof window !== 'undefined') {
    if (val) {
      localStorage.setItem('nexamart_firestore_quota_exceeded', 'true');
      window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
    } else {
      localStorage.removeItem('nexamart_firestore_quota_exceeded');
    }
  }
}

export function isQuotaExceededError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  return (
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('daily read units') ||
    lower.includes('exceeded free quota')
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  
  if (isQuotaExceededError(error)) {
    setQuotaActive(true);
    console.warn(`[NexaMart Resilience] Firestore daily read quota exceeded at '${path}'. Operating seamlessly in cached/offline dataset mode.`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  const jsonError = JSON.stringify(errInfo);
  console.error('Firestore Error: ', jsonError);
  throw new Error(jsonError);
}

// Test connection as per guidelines with non-blocking timeout
async function testConnection() {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log("Network status: Offline. Skipping Firebase online connection test.");
    return;
  }
  if (isQuotaActive()) {
    console.log("Firestore quota active. Operating in resilient fallback mode.");
    return;
  }
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Backend connection check timed out')), 2500)
    );
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      timeoutPromise
    ]);
    console.log("Firebase connection successful");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('offline') || msg.includes('Failed to get document') || msg.includes('timed out') || msg.includes('Backend')) {
      console.log("Firebase is currently operating in offline cache mode.");
    } else {
      console.log("Firebase connection info:", msg);
    }
  }
}
testConnection();
