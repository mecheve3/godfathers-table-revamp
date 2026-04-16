import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  email: string;
  isGuest: boolean;
}

interface UserContextType {
  user: User | null;
  login: (email: string) => void;
  signup: (email: string) => void;
  loginAsGuest: () => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string) => {
    setUser({ email, isGuest: false });
  };

  const signup = (email: string) => {
    setUser({ email, isGuest: false });
  };

  const loginAsGuest = () => {
    setUser({ email: "guest", isGuest: true });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, signup, loginAsGuest, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
