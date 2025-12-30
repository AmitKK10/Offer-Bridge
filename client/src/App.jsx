import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import socket from "./socket/socket";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Pages
import AboutDeveloper from "./pages/AboutDeveloper";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MerchantDashboard from "./pages/MerchantDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CreateDeal from "./pages/CreateDeal";
import ForgotPassword from "./pages/ForgotPassword";

// 🔒 Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-white/10 animate-spin"></div>
            <p className="font-black tracking-widest text-xs uppercase">Loading Offer Bridge...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;

  return children;
};

const App = () => {
  const { user } = useAuth();

  /* ===============================
      SOCKET AUTO-CONNECT LOGIC
      =============================== */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token && user) {
      socket.auth = { token };
      socket.connect();
      
      // Re-identify if connection drops
      socket.on("connect", () => {
        socket.emit("identify", { id: user.id, role: user.role });
      });
    }

    return () => {
      socket.off("connect");
      socket.disconnect();
    };
  }, [user]); 

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-slate-950">
        {/* Global Navbar - Handles its own visibility based on auth */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-grow pt-24 pb-10">
          <Routes>
            {/* ================= PUBLIC ROUTES ================= */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* 🔥 About Developer (Publicly Accessible) */}
            <Route path="/about" element={<AboutDeveloper />} />

            {/* ================= MERCHANT ROUTES ================= */}
            <Route
              path="/merchant"
              element={
                <ProtectedRoute role="MERCHANT">
                  <MerchantDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/merchant/create"
              element={
                <ProtectedRoute role="MERCHANT">
                  <CreateDeal />
                </ProtectedRoute>
              }
            />

            {/* ================= CUSTOMER ROUTES ================= */}
            <Route
              path="/customer"
              element={
                <ProtectedRoute role="CUSTOMER">
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            {/* ================= ADMIN ROUTES ================= */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* ================= FALLBACK ================= */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;