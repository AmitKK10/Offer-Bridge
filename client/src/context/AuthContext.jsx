import { createContext, useContext, useEffect, useState } from "react";
import { loginUser } from "../services/authService";
import socket from "../socket/socket"; // Import socket here to handle identity

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const restoreUser = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        // Use _id or id consistently based on your JWT payload
        const userData = {
          id: payload.id || payload._id, 
          role: payload.role // Keep original casing from backend
        };
        setUser(userData);
        return userData;
      } catch (err) {
        localStorage.clear();
        setUser(null);
      }
    }
    return null;
  };

  useEffect(() => {
    restoreUser();
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const res = await loginUser(credentials);
    const { token, user: userData } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("role", userData.role);

    const loggedInUser = {
      id: userData.id || userData._id,
      role: userData.role
    };

    setUser(loggedInUser);

    // 🔥 IMMEDIATE SOCKET RE-AUTH
    socket.auth = { token };
    socket.disconnect().connect(); 
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    socket.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);