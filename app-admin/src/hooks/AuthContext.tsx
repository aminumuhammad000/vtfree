import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  admin: any;
  app: any;
  login: (token: string, admin: any, app: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [admin, setAdmin] = useState<any>(() => {
    const stored = localStorage.getItem('admin');
    return stored ? JSON.parse(stored) : null;
  });
  const [app, setApp] = useState<any>(() => {
    const stored = localStorage.getItem('appInfo');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (token: string, admin: any, app: any) => {
    setToken(token);
    setAdmin(admin);
    setApp(app);
    localStorage.setItem('token', token);
    localStorage.setItem('admin', JSON.stringify(admin));
    localStorage.setItem('appInfo', JSON.stringify(app));
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    setApp(null);
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    localStorage.removeItem('appInfo');
  };

  return (
    <AuthContext.Provider value={{ token, admin, app, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
};
