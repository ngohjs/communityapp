import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  apiClient,
  configureAuthInterceptors,
  getAccessToken,
  setAccessToken,
  toApiError
} from "@/lib/api/client";

type UserSummary = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
};

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_at: string;
  user: UserSummary;
};

type AuthContextValue = {
  user: UserSummary | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: { email: string; password: string }) => Promise<TokenResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  lastError: string | null;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(getAccessToken());
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const handleAuthSuccess = useCallback((payload: TokenResponse) => {
    setUser(payload.user);
    setAccessToken(payload.access_token);
    setAccessTokenState(payload.access_token);
    setLastError(null);
    return payload;
  }, []);

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      try {
        const { data } = await apiClient.post<TokenResponse>("/auth/login", payload);
        return handleAuthSuccess(data);
      } catch (error) {
        const apiError = toApiError(error);
        setLastError(apiError.message);
        throw error;
      }
    },
    [handleAuthSuccess]
  );

  const refreshSession = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshPromiseRef.current = (async () => {
      const hadSession = Boolean(getAccessToken());
      try {
        const { data } = await apiClient.post<TokenResponse>("/auth/refresh");
        handleAuthSuccess(data);
        return data.access_token;
      } catch (error) {
        setUser(null);
        setAccessToken(null);
        setAccessTokenState(null);
        if (hadSession) {
          const apiError = toApiError(error);
          setLastError(apiError.message);
        }
        throw error;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [handleAuthSuccess]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      // Logging out should still clear local state even if the server returns an error.
    } finally {
      setUser(null);
      setAccessToken(null);
      setAccessTokenState(null);
      setLastError(null);
    }
  }, []);

  useEffect(() => {
    const eject = configureAuthInterceptors({
      refreshAccessToken: async () => {
        try {
          const token = await refreshSession();
          return token;
        } catch {
          await logout();
          return null;
        }
      },
      onUnauthorized: () => {
        setUser(null);
        setAccessToken(null);
        setAccessTokenState(null);
      }
    });

    return eject;
  }, [logout, refreshSession]);

  useEffect(() => {
    (async () => {
      try {
        await refreshSession();
      } catch {
        // no existing session; ignore
      } finally {
        setIsInitializing(false);
      }
    })();
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      user,
      accessToken: accessTokenState,
      isAuthenticated: Boolean(user && accessTokenState),
      isInitializing,
      login,
      logout,
      refreshSession,
      lastError,
      clearError: () => setLastError(null)
    }),
    [accessTokenState, isInitializing, lastError, login, logout, refreshSession, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
