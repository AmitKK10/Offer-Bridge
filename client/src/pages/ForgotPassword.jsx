import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  /* ================= UTILS ================= */
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match");
    }

    setIsLoading(true);

    try {
      await API.put("/auth/forgot-password", {
        email,
        newPassword
      });

      showToast("Access restored successfully!", "success");
      
      // Delay navigation so user can see success toast
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
      showToast("Verification failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-purple-600/10 rounded-full blur-[120px]"></div>

      {/* 🚀 PREMIUM TOAST NOTIFICATION */}
      <div className={`fixed top-10 right-6 z-[200] transition-all duration-500 transform ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0 pointer-events-none'}`}>
        <div className={`px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 ${
          toast.type === "error" ? "bg-red-500/10 border-red-500/50 text-red-400" : "bg-green-500/10 border-green-500/50 text-green-400"
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}></div>
          <p className="font-bold text-sm uppercase tracking-wider">{toast.message}</p>
        </div>
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            OFFER BRIDGE
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Security Protocol</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Reset Access</h2>
            <p className="text-slate-400 text-xs font-medium">Verify your email to establish a new secure password.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl">
              <p className="text-red-400 text-xs text-center font-bold">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-black ml-1">Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-blue-500/50 transition-all text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-black ml-1">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-blue-500/50 transition-all text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-black ml-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-blue-500/50 transition-all text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white p-4 rounded-2xl font-black shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 mt-2 uppercase tracking-widest text-xs"
          >
            {isLoading ? "Synchronizing..." : "Update Security Credentials"}
          </button>

          <div className="text-center">
            <span
              className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 transition-colors font-bold uppercase tracking-widest"
              onClick={() => navigate("/login")}
            >
              Back to Login
            </span>
          </div>
        </form>

        <p className="text-center text-slate-700 text-[10px] mt-10 uppercase tracking-[0.3em]">
          End-to-End Encryption Enabled
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;