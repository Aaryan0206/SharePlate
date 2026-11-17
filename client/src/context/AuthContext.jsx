import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

function createOfflineUser(email, roleHint, extra = {}) {
  const normalized = (email || 'user@shareplate.org').toLowerCase().trim();
  let role = roleHint || 'recipient';
  let name = extra.name || 'Demo User';
  let org = extra.organizationType || 'Community Partner';

  if (normalized === 'admin@shareplate.org' || normalized.includes('admin')) {
    role = 'admin';
    name = extra.name || 'Platform Administrator';
    org = extra.organizationType || 'Platform Governance';
  } else if (normalized === 'donor@greenhearth.com' || normalized.includes('donor')) {
    role = 'donor';
    name = extra.name || 'Green Hearth Bakery';
    org = extra.organizationType || 'Artisan Bakery';
  } else if (normalized === 'recipient@metroshelter.org' || normalized.includes('recipient')) {
    role = 'recipient';
    name = extra.name || 'Hope Youth Shelter';
    org = extra.organizationType || 'Community Shelter';
  }

  return {
    _id: 'user-' + normalized.replace(/[^a-z0-9]/g, '-'),
    id: 'user-' + normalized.replace(/[^a-z0-9]/g, '-'),
    name,
    email: normalized,
    role,
    isActive: true,
    organizationType: org,
    phone: extra.phone || '+1-555-0199',
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }) {
  // Restore user immediately from localStorage so authentication persists across all reloads
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('shareplate_user');
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {
      // ignore
    }
    // Default to authenticated donor demo session if no session exists
    const defaultUser = createOfflineUser('donor@greenhearth.com', 'donor');
    try {
      localStorage.setItem('shareplate_user', JSON.stringify(defaultUser));
      localStorage.setItem('shareplate_token', 'shareplate-demo-token-active');
    } catch (e) {
      // ignore
    }
    return defaultUser;
  });

  const [token, setToken] = useState(() => localStorage.getItem('shareplate_token') || 'shareplate-demo-token-active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check live session on mount (GET /api/auth/me)
  const checkAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('shareplate_token');
      const headers = { 'Content-Type': 'application/json' };
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json().catch(() => null);
        if (res.ok && data?.success && data.user) {
          setUser(data.user);
          localStorage.setItem('shareplate_user', JSON.stringify(data.user));
          setError(null);
          return;
        } else if (!res.ok && res.status === 401 && data?.message) {
          // Token is explicitly invalidated by live backend
          // Only clear if live backend explicitly told us
          console.warn('[AuthContext] Backend reported token expired:', data.message);
        }
      }
    } catch (err) {
      // Backend is offline or static hosting (e.g. GitHub Pages) — maintain existing session!
      console.info('[AuthContext] Backend unreachable, preserving current session:', err.message);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      let isLiveSuccess = false;
      let liveUser = null;
      let liveToken = null;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.success) {
            isLiveSuccess = true;
            liveUser = data.user;
            liveToken = data.token;
          } else if (!res.ok && data?.message) {
            // Live backend responded with explicit credential error
            throw new Error(data.message);
          }
        }
      } catch (networkOrParseErr) {
        // If it's an explicit credential error from live server, rethrow it
        if (networkOrParseErr.message && !networkOrParseErr.message.includes('JSON') && !networkOrParseErr.message.includes('fetch')) {
          throw networkOrParseErr;
        }
        // Otherwise (e.g. on GitHub Pages where /api/auth/login returns 404 HTML), fall through to offline authentication
      }

      if (isLiveSuccess && liveUser) {
        setUser(liveUser);
        if (liveToken) {
          setToken(liveToken);
          localStorage.setItem('shareplate_token', liveToken);
        }
        localStorage.setItem('shareplate_user', JSON.stringify(liveUser));
        return liveUser;
      }

      // Offline / GitHub Pages authentication fallback
      const fallbackUser = createOfflineUser(email);
      const fallbackToken = 'shareplate-demo-token-' + Date.now();
      setUser(fallbackUser);
      setToken(fallbackToken);
      localStorage.setItem('shareplate_token', fallbackToken);
      localStorage.setItem('shareplate_user', JSON.stringify(fallbackUser));
      return fallbackUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      let isLiveSuccess = false;
      let liveUser = null;
      let liveToken = null;

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(userData),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.success) {
            isLiveSuccess = true;
            liveUser = data.user;
            liveToken = data.token;
          } else if (!res.ok && data?.message) {
            throw new Error(data.message);
          }
        }
      } catch (networkOrParseErr) {
        if (networkOrParseErr.message && !networkOrParseErr.message.includes('JSON') && !networkOrParseErr.message.includes('fetch')) {
          throw networkOrParseErr;
        }
      }

      if (isLiveSuccess && liveUser) {
        setUser(liveUser);
        if (liveToken) {
          setToken(liveToken);
          localStorage.setItem('shareplate_token', liveToken);
        }
        localStorage.setItem('shareplate_user', JSON.stringify(liveUser));
        return liveUser;
      }

      const fallbackUser = createOfflineUser(userData.email, userData.role, {
        name: userData.name,
        organizationType: userData.organizationType,
        phone: userData.phone,
      });
      const fallbackToken = 'shareplate-demo-token-' + Date.now();
      setUser(fallbackUser);
      setToken(fallbackToken);
      localStorage.setItem('shareplate_token', fallbackToken);
      localStorage.setItem('shareplate_user', JSON.stringify(fallbackUser));
      return fallbackUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('shareplate_token');
      localStorage.removeItem('shareplate_user');
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
