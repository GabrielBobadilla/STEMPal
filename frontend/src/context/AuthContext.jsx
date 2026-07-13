import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword,
  sendPasswordResetEmail,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { authAPI, userAPI, preferenceAPI } from '../services/api';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

let firebaseApp;
let firebaseAuth;
try {
  firebaseApp = initializeApp(firebaseConfig);
  firebaseAuth = getAuth(firebaseApp);
} catch (e) {
  console.warn('Firebase init failed:', e.message);
}

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const token = await fbUser.getIdToken();
          try { localStorage.setItem('token', token); } catch {}

          try {
            const res = await userAPI.getProfile();
            const userData = { id: fbUser.uid, ...res.data };
            try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
            setUser(userData);
            checkPreferences();
          } catch {
            // Profile not found yet, use minimal data
            const userData = {
              id: fbUser.uid,
              fullname: fbUser.displayName || '',
              email: fbUser.email,
              role: 'student',
            };
            try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
            setUser(userData);
          }
        } catch (e) {
          console.error('Error getting token:', e);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        try { localStorage.removeItem('token'); } catch {}
        try { localStorage.removeItem('user'); } catch {}
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getIdToken = async () => {
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken(true);
      try { localStorage.setItem('token', token); } catch {}
      return token;
    }
    return null;
  };

  const checkPreferences = async () => {
    try {
      const res = await preferenceAPI.check();
      setHasPreferences(res.data.hasPreferences);
    } catch {
      setHasPreferences(false);
    }
  };

  const login = async (email, password) => {
    if (!firebaseAuth) throw new Error('Firebase not initialized');

    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const token = await userCredential.user.getIdToken();
    try { localStorage.setItem('token', token); } catch {}

    const res = await userAPI.getProfile();
    const userData = { id: userCredential.user.uid, ...res.data };
    try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
    setUser(userData);
    checkPreferences();
    return userData;
  };

  const register = async (data) => {
    if (!firebaseAuth) throw new Error('Firebase not initialized');

    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, data.email, data.password);
    const token = await userCredential.user.getIdToken();
    try { localStorage.setItem('token', token); } catch {}

    // Create user profile on backend
    await authAPI.register(data);

    const res = await userAPI.getProfile();
    const userData = { id: userCredential.user.uid, ...res.data };
    try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
    setUser(userData);
    setHasPreferences(false);
    return userData;
  };

  const logout = async () => {
    if (firebaseAuth) {
      try { await firebaseSignOut(firebaseAuth); } catch {}
    }
    try { localStorage.removeItem('token'); } catch {}
    try { localStorage.removeItem('user'); } catch {}
    setUser(null);
    setFirebaseUser(null);
    setHasPreferences(false);
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    try { localStorage.setItem('user', JSON.stringify(updated)); } catch {}
    setUser(updated);
  };

  const refreshProfile = async () => {
    try {
      // Refresh Firebase ID token first
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken(true);
        try { localStorage.setItem('token', token); } catch {}
      }
      const res = await userAPI.getProfile();
      const updated = { ...user, ...res.data };
      try { localStorage.setItem('user', JSON.stringify(updated)); } catch {}
      setUser(updated);
    } catch {}
  };

  const changePassword = async (newPassword) => {
    if (firebaseUser) {
      await updatePassword(firebaseUser, newPassword);
    }
  };

  const resetPassword = async (email) => {
    if (firebaseAuth) {
      await sendPasswordResetEmail(firebaseAuth, email);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, hasPreferences, firebaseUser,
      login, register, logout, updateUser, refreshProfile, checkPreferences,
      changePassword, resetPassword, getIdToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};
