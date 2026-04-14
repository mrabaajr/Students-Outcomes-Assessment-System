import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { loginWithEmail } from "../services/auth";
import { attachAccessToken } from "../services/apiClient";
import { fetchCurrentUser } from "../services/usersMobile";
import {
  clearSession,
  getStoredSession,
  saveSession,
} from "../services/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState({
    accessToken: null,
    refreshToken: null,
    userRole: null,
  });
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const storedSession = await getStoredSession();
        setSession(storedSession);
        attachAccessToken(storedSession.accessToken);
        if (storedSession.accessToken) {
          try {
            const currentUser = await fetchCurrentUser();
            setUser(currentUser);
          } catch (error) {
            const isAuthError =
              error.response?.status === 401 ||
              String(error.response?.data?.detail || error.message || "").toLowerCase().includes("token not valid");

            if (isAuthError) {
              await clearSession();
              attachAccessToken(null);
              setSession({
                accessToken: null,
                refreshToken: null,
                userRole: null,
              });
              setUser(null);
              return;
            }

            // Keep session if the failure is unrelated to authentication.
          }
        }
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrap();
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      isBootstrapping,
      isAuthenticated: Boolean(session.accessToken),
      async signIn(email, password) {
        const loginResult = await loginWithEmail(email, password);
        const nextSession = {
          accessToken: loginResult.accessToken,
          refreshToken: loginResult.refreshToken,
          userRole: String(loginResult.user.role || "").toLowerCase(),
        };

        await saveSession(nextSession);
        attachAccessToken(nextSession.accessToken);
        setSession(nextSession);
        setUser(loginResult.user);
        return loginResult.user;
      },
      async signOut() {
        await clearSession();
        attachAccessToken(null);
        setSession({
          accessToken: null,
          refreshToken: null,
          userRole: null,
        });
        setUser(null);
      },
    }),
    [isBootstrapping, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
