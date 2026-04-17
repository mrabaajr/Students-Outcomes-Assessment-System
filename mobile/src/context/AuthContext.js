import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { loginWithEmail } from "../services/auth";
import { attachAccessToken } from "../services/apiClient";
import { fetchCurrentUser } from "../services/usersMobile";
import { normalizeRole } from "../utils/roles";
import {
  clearSession,
  getStoredSession,
  saveSession,
} from "../services/storage";

const AuthContext = createContext(null);
const BOOTSTRAP_TIMEOUT_MS = 12000;

function withTimeout(promise, timeoutMs, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    }),
  ]);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState({
    accessToken: null,
    refreshToken: null,
    userRole: null,
  });
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState("");

  useEffect(() => {
    async function bootstrap() {
      try {
        const storedSession = await withTimeout(
          getStoredSession(),
          BOOTSTRAP_TIMEOUT_MS,
          "Session restore"
        );
        setSession(storedSession);
        attachAccessToken(storedSession.accessToken);
        if (storedSession.accessToken) {
          try {
            const currentUser = await withTimeout(
              fetchCurrentUser(),
              BOOTSTRAP_TIMEOUT_MS,
              "User fetch"
            );
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
      } catch (error) {
        setBootstrapError(
          "Startup timed out. Please sign in again."
        );
        await clearSession();
        attachAccessToken(null);
        setSession({
          accessToken: null,
          refreshToken: null,
          userRole: null,
        });
        setUser(null);
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
      bootstrapError,
      isAuthenticated: Boolean(session.accessToken),
      async signIn(email, password) {
        const loginResult = await loginWithEmail(email, password);
        const nextSession = {
          accessToken: loginResult.accessToken,
          refreshToken: loginResult.refreshToken,
          userRole: normalizeRole(loginResult.user.role),
        };

        await saveSession(nextSession);
        attachAccessToken(nextSession.accessToken);
        setSession(nextSession);
        setUser(loginResult.user);
        setBootstrapError("");
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
        setBootstrapError("");
      },
    }),
    [bootstrapError, isBootstrapping, session, user]
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
