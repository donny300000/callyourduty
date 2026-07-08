import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext<{ userId: string | null, login: (id: string) => void, logout: () => void }>({ userId: null, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('cyd_userId'));
  
  const login = (id: string) => {
    setUserId(id);
    localStorage.setItem('cyd_userId', id);
  };
  
  const logout = () => {
    setUserId(null);
    localStorage.removeItem('cyd_userId');
  };

  return (
    <AuthContext.Provider value={{ userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);