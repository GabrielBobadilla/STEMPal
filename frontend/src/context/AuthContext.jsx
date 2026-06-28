import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI, preferenceAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPreferences, setHasPreferences] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
        checkPreferences();
      }
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setLoading(false);
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
    const res = await authAPI.login({ email, password });
    const { token, user: userData } = res.data;
    try { localStorage.setItem('token', token); } catch {}
    try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
    setUser(userData);
    checkPreferences();
    return userData;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { token, user: userData } = res.data;
    try { localStorage.setItem('token', token); } catch {}
    try { localStorage.setItem('user', JSON.stringify(userData)); } catch {}
    setUser(userData);
    setHasPreferences(false);
    return userData;
  };

  const logout = () => {
    try { localStorage.removeItem('token'); } catch {}
    try { localStorage.removeItem('user'); } catch {}
    setUser(null);
    setHasPreferences(false);
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    try { localStorage.setItem('user', JSON.stringify(updated)); } catch {}
    setUser(updated);
  };

  const refreshProfile = async () => {
    try {
      const res = await userAPI.getProfile();
      const updated = { ...user, ...res.data };
      try { localStorage.setItem('user', JSON.stringify(updated)); } catch {}
      setUser(updated);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{
      user, loading, hasPreferences,
      login, register, logout, updateUser, refreshProfile, checkPreferences
    }}>
      {children}
    </AuthContext.Provider>
  );
};
