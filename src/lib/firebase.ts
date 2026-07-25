import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  signInAnonymously
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const db = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

export { signInWithPopup, firebaseSignOut, onAuthStateChanged, signInAnonymously };
export type { User };

// Firestore Helper functions for User & Stats Persistence
export async function syncUserProfile(user: User) {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  const userData = {
    uid: user.uid,
    displayName: user.displayName || 'Studio Creator',
    email: user.email || '',
    photoURL: user.photoURL || '',
    lastLoginAt: new Date().toISOString(),
  };

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      ...userData,
      createdAt: new Date().toISOString(),
    });
  } else {
    await setDoc(userRef, userData, { merge: true });
  }
}

export async function saveUserWorkspaceStats(userId: string, stats: any) {
  if (!userId) return;
  try {
    const statsRef = doc(db, 'workspaceStats', userId);
    await setDoc(statsRef, {
      userId,
      ...stats,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Error persisting workspace stats to Firestore:', err);
  }
}

export function subscribeToWorkspaceStats(userId: string, callback: (stats: any) => void) {
  if (!userId) return () => {};
  const statsRef = doc(db, 'workspaceStats', userId);
  return onSnapshot(statsRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    }
  });
}
