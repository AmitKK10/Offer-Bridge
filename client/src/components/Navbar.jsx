import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { getMyWallet } from "../services/walletService";
import socket from "../socket/socket";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [balance, setBalance] = useState(0);

  const fetchBalance = async () => {
    try {
      const res = await getMyWallet();
      setBalance(res.data.balance);
    } catch (err) {
      console.error("Balance fetch failed");
    }
  };

  useEffect(() => {
    if (user) {
      fetchBalance();
      socket.on("wallet:updated", fetchBalance);
    }
    return () => socket.off("wallet:updated");
  }, [user]);

  const navLinks = {
    ADMIN: [{ name: "Dashboard", path: "/admin" }],
    MERCHANT: [
      { name: "Dashboard", path: "/merchant" },
      { name: "Create Deal", path: "/merchant/create" },
    ],
    CUSTOMER: [{ name: "Browse Deals", path: "/customer" }],
  };

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] px-6 py-4">
      <div className="max-w-7xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-6 py-3 flex items-center justify-between shadow-2xl">
        
        {/* Logo Section */}
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => navigate(user.role === "ADMIN" ? "/admin" : user.role === "MERCHANT" ? "/merchant" : "/customer")}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-black text-white italic">
            B
          </div>
          <span className="font-black text-xl tracking-tighter text-white hidden sm:block">
            OFFER<span className="text-blue-500">BRIDGE</span>
          </span>
        </div>

        {/* Dynamic Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks[user.role]?.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`text-xs font-bold uppercase tracking-widest transition-all ${
                location.pathname === link.path ? "text-blue-400" : "text-slate-400 hover:text-white"
              }`}
            >
              {link.name}
            </button>
          ))}
        </div>

        {/* Wallet & Profile */}
        <div className="flex items-center gap-4">
          <div className="hidden xs:flex flex-col items-end px-3 py-1 bg-black/40 rounded-2xl border border-white/5">
            <span className="text-[8px] text-slate-500 uppercase font-black">Balance</span>
            <span className="text-sm font-bold text-green-400">₹{balance}</span>
          </div>

          <div className="h-8 w-[1px] bg-white/10 hidden sm:block"></div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{user.name || "User"}</p>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">{user.role}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;