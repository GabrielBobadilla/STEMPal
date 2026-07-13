import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../supabase';
import { userAPI, preferenceAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSupabaseUser(session.user);
        try { localStorage.setItem('token', session.access_token); } catch {}
        try {
          const res = await userAPI.getProfile();
          const userData = { id: session.user.id, ...res.data };
          try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
          setUser(userData);
          checkPreferences();
        } catch {
          const userData = {
            id: session.user.id,
            fullname: session.user.user_metadata?.fullname || '',
            email: session.user.email,
            role: 'student',
          };
          try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
          setUser(userData);
        }
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setSupabaseUser(session.user);
        try { localStorage.setItem('token', session.access_token); } catch {}
        try {
          const res = await userAPI.getProfile();
          const userData = { id: session.user.id, ...res.data };
          try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
          setUser(userData);
          checkPreferences();
        } catch {
          const userData = {
            id: session.user.id,
            fullname: session.user.user_metadata?.fullname || '',
            email: session.user.email,
            role: 'student',
          };
          try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
          setUser(userData);
        }
      } else if (event === 'SIGNED_OUT') {
        setSupabaseUser(null);
        setUser(null);
        try { localStorage.removeItem('token'); } catch {}
        try { localStorage.removeItem('user'); } catch {}
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkPreferences = async () => {
    try {
      const res = await preferenceAPI.check();
      setHasPreferences(res.data.hasPreferences);
    } catch {
      setHasPreferences(false);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    try { localStorage.setItem('token', data.session.access_token); } catch {}

    const res = await userAPI.getProfile();
    const userData = { id: data.user.id, ...res.data };
    try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
    setUser(userData);
    setSupabaseUser(data.user);
    checkPreferences();
    return userData;
  };

  const register = async (regData) => {
    const { data, error } = await supabase.auth.signUp({
      email: regData.email,
      password: regData.password,
      options: { data: { fullname: regData.fullname } }
    });
    if (error) throw error;

    try { localStorage.setItem('token', data.session?.access_token || ''); } catch {}

    await fetch(`${process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : '/api')}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regData),
    });

    const res = await userAPI.getProfile();
    const userData = { id: data.user.id, ...res.data };
    try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
    setUser(userData);
    setSupabaseUser(data.user);
    setHasPreferences(false);
    return userData;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    try { localStorage.removeItem('token'); } catch {}
    try { localStorage.removeItem('user'); } catch {}
    setUser(null);
    setSupabaseUser(null);
    setHasPreferences(false);
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    try { localStorage.setItem('user', JSON.stringify(updated)); } catch {}
    setUser(updated);
  };

  const refreshProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        try { localStorage.setItem('token', session.access_token); } catch {}
      }
      const res = await userAPI.getProfile();
      const updated = { ...user, ...res.data };
      try { localStorage.setItem('user', JSON.stringify(updated)); } catch {}
      setUser(updated);
    } catch {}
  };

  const changePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user, loading, hasPreferences, supabaseUser,
      login, register, logout, updateUser, refreshProfile, checkPreferences,
      changePassword, resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
