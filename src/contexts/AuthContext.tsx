import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth.api';
import type { AuthResponse } from '../api/auth.api';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Inicializar estado desde localStorage usando función inicializadora
  const [user, setUser] = useState<AuthResponse['user'] | null>(() => {
    try {
      const savedUser = localStorage.getItem('gestiva_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('gestiva_token');
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar que el token y usuario coinciden
    const savedToken = localStorage.getItem('gestiva_token');
    const savedUser = localStorage.getItem('gestiva_user');

    if (!savedToken || !savedUser) {
      // Limpiar estado si no hay datos guardados
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(null);
    } else {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Sincronizar estado con localStorage al iniciar
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(parsedUser);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setToken(savedToken);
      } catch {
        // Si hay error parseando, limpiar
        localStorage.removeItem('gestiva_token');
        localStorage.removeItem('gestiva_user');
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setToken(null);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setToken(response.accessToken);
    setUser(response.user);
    localStorage.setItem('gestiva_token', response.accessToken);
    localStorage.setItem('gestiva_user', JSON.stringify(response.user));
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await authApi.register({ email, password, name });
    setToken(response.accessToken);
    setUser(response.user);
    localStorage.setItem('gestiva_token', response.accessToken);
    localStorage.setItem('gestiva_user', JSON.stringify(response.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('gestiva_token');
    localStorage.removeItem('gestiva_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

