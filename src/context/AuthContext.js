import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentUser,
  logoutUser,
  registerUser,
  requestLoginCode,
  verifyLoginCode,
} from "../services/authApi";

const TOKEN_KEY = "buildingSafety.auth.token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      if (!token) {
        if (isMounted) {
          setLoading(false);
        }

        return;
      }

      try {
        const response = await getCurrentUser(token);

        if (isMounted) {
          setUser(response.data.user);
          localStorage.setItem(TOKEN_KEY, response.data.token || token);
          setToken(response.data.token || token);
        }
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);

        if (isMounted) {
          setUser(null);
          setToken("");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    syncSession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      register: async (payload) => registerUser(payload),
      startLogin: async (payload) => requestLoginCode(payload),
      confirmLogin: async (payload) => {
        const response = await verifyLoginCode(payload);
        setUser(response.data.user);
        setToken(response.data.token);
        localStorage.setItem(TOKEN_KEY, response.data.token);
        return response;
      },
      logout: async () => {
        if (token) {
          try {
            await logoutUser(token);
          } catch (error) {
            // Ignore network issues during logout.
          }
        }

        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setToken("");
      },
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
