import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER"
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await API.post("/auth/register", form);
      setSuccess(true);
      // Wait 2 seconds so user sees the success state before redirecting
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-blue-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-green-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 mb-2">
            JOIN THE BRIDGE
          </h1>
          <p className="text-slate-400 text-sm tracking-widest uppercase">Start your secure deal journey</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl space-y-5"
        >
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white text-center">Create Account</h2>
            <p className="text-slate-500 text-[10px] text-center uppercase font-bold tracking-tighter">Enter details to get started</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl animate-shake">
              <p className="text-red-400 text-xs text-center font-bold">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/50 p-3 rounded-xl">
              <p className="text-green-400 text-xs text-center font-bold">Registration Successful! Redirecting...</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Full Name</label>
              <input
                name="name"
                placeholder="John Doe"
                className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-blue-500/50 transition-all text-sm"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="john@example.com"
                className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-blue-500/50 transition-all text-sm"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Password</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-blue-500/50 transition-all text-sm"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Select Your Role</label>
              <select
                name="role"
                className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-blue-500/50 transition-all text-sm appearance-none cursor-pointer"
                value={form.role}
                onChange={handleChange}
              >
                <option value="CUSTOMER" className="bg-slate-900">Have Card? / Customer</option>
                <option value="MERCHANT" className="bg-slate-900">Don't Have Card? / Merchant</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 mt-2"
          >
            {loading ? "Establishing Connection..." : "Create Account"}
          </button>

          <p className="text-center text-slate-400 text-xs mt-4">
            Already a member?{" "}
            <span
              className="text-green-400 font-bold cursor-pointer hover:text-green-300 transition-colors"
              onClick={() => navigate("/login")}
            >
              Sign In
            </span>
          </p>
        </form>

        <p className="text-center text-slate-600 text-[10px] mt-8 uppercase tracking-[0.2em]">
          Secured by Offer Bridge 256-bit Encryption
        </p>
      </div>
    </div>
  );
};

export default Register;