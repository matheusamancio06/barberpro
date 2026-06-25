import React, { createContext, useContext, useState, useEffect } from 'react';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: string;
  clienteId?: number;
  barbeiroId?: number;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (token: string, usuario: Usuario) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBarbeiro: boolean;
  isCliente: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUsuario = localStorage.getItem('usuario');
    if (savedToken && savedUsuario) {
      try {
        setToken(savedToken);
        setUsuario(JSON.parse(savedUsuario));
      } catch {}
    }
  }, []);

  const login = (newToken: string, newUsuario: Usuario) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('usuario', JSON.stringify(newUsuario));
    setToken(newToken);
    setUsuario(newUsuario);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{
      usuario, token, login, logout,
      isAuthenticated: !!token,
      isAdmin: usuario?.role === 'admin',
      isBarbeiro: usuario?.role === 'barbeiro',
      isCliente: usuario?.role === 'cliente',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
