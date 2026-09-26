import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('efir_token');
    const savedUser = localStorage.getItem('efir_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with server in background
        api.get('/auth/profile')
          .then((res) => {
            if (res.data.success && res.data.user) {
              setUser(res.data.user);
              localStorage.setItem('efir_user', JSON.stringify(res.data.user));
            }
          })
          .catch(() => {
            // If failed to verify, token might be invalid
          })
          .finally(() => setLoading(false));
      } catch (e) {
        localStorage.removeItem('efir_token');
        localStorage.removeItem('efir_user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      toast.warn('Session expired. Please log in again.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await api.post('/auth/login', { identifier, password });
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('efir_token', receivedToken);
        localStorage.setItem('efir_user', JSON.stringify(receivedUser));
        toast.success(`Welcome back, ${receivedUser.name}!`);
        return { success: true, user: receivedUser };
      }
      return { success: false, message: res.data.message };
    } catch (error) {
      toast.error(error.message);
      return { success: false, message: error.message };
    }
  };

  const register = async (citizenData) => {
    try {
      const res = await api.post('/auth/register', citizenData);
      if (res.data.success) {
        const { token: receivedToken, user: receivedUser } = res.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('efir_token', receivedToken);
        localStorage.setItem('efir_user', JSON.stringify(receivedUser));
        toast.success('Registration successful! Welcome to the E-FIR Portal.');
        return { success: true, user: receivedUser };
      }
      return { success: false, message: res.data.message };
    } catch (error) {
      toast.error(error.message);
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout').catch(() => {});
      }
    } finally {
      localStorage.removeItem('efir_token');
      localStorage.removeItem('efir_user');
      setUser(null);
      setToken(null);
      toast.info('You have been logged out.');
    }
  };

  const updateUser = (updatedData) => {
    const updated = { ...user, ...updatedData };
    setUser(updated);
    localStorage.setItem('efir_user', JSON.stringify(updated));
  };

  // Quick Switch for Demonstration / Evaluation
  const quickSwitchDemo = async (roleType) => {
    let email = 'citizen@example.com';
    if (roleType === 'police') email = 'police@example.com';
    if (roleType === 'admin') email = 'admin@example.com';

    await login(email, 'Password@123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        role: user?.role || null,
        login,
        register,
        logout,
        updateUser,
        quickSwitchDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
