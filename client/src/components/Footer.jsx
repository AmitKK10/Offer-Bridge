import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="w-full py-16 px-6 border-t border-white/5 bg-slate-950 mt-auto relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center font-black text-white italic text-sm">
                B
              </div>
              <span className="font-black text-xl text-white tracking-tighter">
                OFFER<span className="text-blue-500">BRIDGE</span>
              </span>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed max-w-xs mb-3">
              A revolutionary P2P escrow platform democratizing credit card discounts through secure, real-time intermediation.
            </p>

            {/* 🔥 NEW: Project Brief */}
            <p className="text-slate-600 text-[11px] leading-relaxed max-w-xs">
              OfferBridge connects merchants without credit cards to trusted cardholders, enabling secure purchases,
              transparent commission sharing, and escrow-backed transactions — all in real time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">
              Platform
            </h4>
            <ul className="space-y-4 text-[11px] text-slate-500 font-bold uppercase tracking-tight">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Marketplace</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Safety Center</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Merchant Guide</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Customer Guide</a></li>
            </ul>
          </div>

          {/* Legal / Info */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-6">
              Legal
            </h4>
            <ul className="space-y-4 text-[11px] text-slate-500 font-bold uppercase tracking-tight">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Escrow Rules</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Dispute Policy</a></li>
            </ul>
          </div>

          {/* Developer Section */}
          <div>
            <h4 className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-6 underline underline-offset-8 decoration-blue-500/30">
              The Developer
            </h4>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <p className="text-slate-300 text-[11px] font-bold mb-3 italic">
                "Built from the ground up to redefine digital commerce."
              </p>

              <button 
                onClick={() => navigate("/about")}
                className="text-white text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-all w-full mb-3"
              >
                Meet Amit Kiran Kar
              </button>

              <div className="flex gap-4 justify-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                <a href="https://github.com/AmitKK10" target="_blank" rel="noreferrer" title="GitHub" className="text-white text-lg">💻</a>
                <a href="https://www.linkedin.com/in/amit-kiran-kar-975744277" target="_blank" rel="noreferrer" title="LinkedIn" className="text-white text-lg">🔗</a>
                <a href="https://youtube.com/@amitkk-jz3ji" target="_blank" rel="noreferrer" title="YouTube" className="text-white text-lg">📺</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <p className="text-slate-600 text-[10px] uppercase font-black tracking-[0.2em]">
              &copy; 2025 Offer Bridge Systems
            </p>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-500/5 border border-green-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[8px] text-green-500 uppercase font-black tracking-tighter">
                All Systems Operational
              </span>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <span className="text-[9px] text-slate-700 font-black uppercase tracking-widest">
              Powered by MERN Stack
            </span>
            <div className="h-4 w-px bg-white/5"></div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span>Support:</span>
              <a href="tel:9563574862" className="text-white font-bold hover:text-blue-400 transition-colors">
                9563574862
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
