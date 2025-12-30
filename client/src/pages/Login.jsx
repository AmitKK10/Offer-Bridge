import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });

      const role = localStorage.getItem("role");
      // Standardizing role check to match your dashbaord logic
      if (role === "ADMIN") navigate("/admin");
      else if (role === "MERCHANT") navigate("/merchant");
      else navigate("/customer");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-blue-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-purple-600/20 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            OFFER BRIDGE
          </h1>
          <p className="text-slate-400 text-sm tracking-widest uppercase">Escrow Secured Marketplace</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
            <p className="text-slate-400 text-xs font-medium">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl">
              <p className="text-red-400 text-xs text-center font-bold">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <span
              className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 transition-colors font-medium"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "Authenticating..." : "Login to Dashboard"}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-slate-500 font-bold">New Member?</span></div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/register")}
            className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 p-4 rounded-2xl font-bold transition-all"
          >
            Create New Account
          </button>
        </form>

        <p className="text-center text-slate-600 text-[10px] mt-8 uppercase tracking-[0.2em]">
          &copy; 2025 Offer Bridge Security Systems
        </p>
      </div>
    </div>
  );
};

export default Login;