import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axiosInstance.js";

const AuthContext = createContext(null);

const storageKeys = {
  token: "stockifyToken",
  user: "stockifyUser"
};

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.user));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(storageKeys.token));
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(storageKeys.token)));

  const persistSession = (payload) => {
    localStorage.setItem(storageKeys.token, payload.token);
    localStorage.setItem(storageKeys.user, JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
  };

  const clearSession = () => {
    localStorage.removeItem(storageKeys.token);
    localStorage.removeItem(storageKeys.user);
    setToken(null);
    setUser(null);
  };

  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    persistSession(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    persistSession(data);
    return data;
  };

  const refreshProfile = async () => {
    if (!localStorage.getItem(storageKeys.token)) {
      setLoading(false);
      return null;
    }

    try {
      const { data } = await api.get("/auth/me");
      localStorage.setItem(storageKeys.user, JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === "admin",
      login,
      register,
      logout: clearSession,
      refreshProfile
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
