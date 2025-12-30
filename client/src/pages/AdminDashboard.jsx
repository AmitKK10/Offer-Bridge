import { useEffect, useState } from "react";
import {
  getPendingDeals,
  updateDealStatus,
  verifyOrderProof
} from "../services/dealService";
import { getAllWallets } from "../services/walletService";
import API from "../services/api";
import socket from "../socket/socket";

const AdminDashboard = () => {
  const [pendingDeals, setPendingDeals] = useState([]);
  const [orderedDeals, setOrderedDeals] = useState([]);
  const [modRequests, setModRequests] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMap, setEditMap] = useState({});

  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  /* ================= UTILS ================= */
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 4000);
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied!`, "success");
  };

  /* ================= FETCH ================= */
  const fetchDeals = async () => {
    try {
      const pendingRes = await getPendingDeals();
      setPendingDeals(pendingRes.data || []);

      const orderedRes = await API.get("/deals/admin/ordered");
      setOrderedDeals(orderedRes.data || []);

      const allDealsRes = await API.get("/deals/merchant/approved?all=true");
      const modifications = (allDealsRes.data || []).filter(d => d.modificationRequest?.isPending);
      
      setModRequests(modifications);

      // 🔥 AUTO-SET 50/50 SPLIT DEFAULT FOR NEW REQUESTS
      const newEditMapUpdates = {};
      modifications.forEach(deal => {
        const total = Number(deal.modificationRequest.data.totalCommission);
        // We only set it if the user hasn't already started typing for this deal
        if (!editMap[deal._id]?.modAdmin) {
          newEditMapUpdates[deal._id] = {
            modAdmin: total / 2,
            modCust: total / 2
          };
        }
      });
      
      if (Object.keys(newEditMapUpdates).length > 0) {
        setEditMap(prev => ({ ...prev, ...newEditMapUpdates }));
      }

    } catch (err) {
      console.error("Fetch deals failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchWallets = async () => {
    try {
      const res = await getAllWallets();
      setWallets(res.data || []);
    } catch (err) {
      console.error("Wallet fetch failed");
    }
  };

  useEffect(() => {
    fetchDeals();
    fetchWallets();
  }, []);

  useEffect(() => {
    socket.on("deal:updated", fetchDeals);
    socket.on("wallet:updated", fetchWallets);
    return () => {
      socket.off("deal:updated");
      socket.off("wallet:updated");
    };
  }, [editMap]); // Added editMap to dependency to ensure split logic stays current

  /* ================= ACTIONS ================= */
  const handleApproveReject = async (dealId, status) => {
    const edit = editMap[dealId] || {};
    if (status === "APPROVED") {
      const total = pendingDeals.find(d => d._id === dealId)?.totalCommission || 0;
      const split = (edit.adminCommission || 0) + (edit.customerCommission || 0);
      if (split > total) return showToast("Error: Split exceeds Total Commission!", "error");
      if (!edit.adminPhone) return showToast("Error: Admin Phone is required!", "error");
    }

    try {
      await updateDealStatus(dealId, {
        status,
        adminCommission: edit.adminCommission || 0,
        customerCommission: edit.customerCommission || 0,
        adminPhone: edit.adminPhone || null
      });
      showToast(`Deal ${status.toLowerCase()} successfully`, "success");
      fetchDeals();
    } catch (err) { showToast("Update failed", "error"); }
  };

  const handleModReview = async (dealId, approved) => {
    const edit = editMap[dealId] || {};
    const deal = modRequests.find(d => d._id === dealId);

    if (approved) {
      const requestedTotal = Number(deal.modificationRequest.data.totalCommission);
      const adminShare = Number(edit.modAdmin || 0);
      const customerShare = Number(edit.modCust || 0);
      const currentSplitTotal = adminShare + customerShare;

      if (currentSplitTotal !== requestedTotal) {
        return showToast(`Error: Re-split (₹${currentSplitTotal}) must exactly equal requested total (₹${requestedTotal})`, "error");
      }
    }

    try {
      await API.put(`/deals/${dealId}/approve-modify`, { 
        approved,
        adminCommission: Number(edit.modAdmin),
        customerCommission: Number(edit.modCust)
      });
      showToast(approved ? "Modification Approved & Re-Split Live!" : "Modification Rejected", "success");
      fetchDeals();
    } catch (err) { showToast("Review failed", "error"); }
  };

  const updateEdit = (dealId, field, value) => {
    setEditMap((prev) => ({
      ...prev,
      [dealId]: { ...prev[dealId], [field]: value }
    }));
  };

  const handleVerify = async (dealId, approved) => {
    try {
      await verifyOrderProof(dealId, approved);
      showToast(approved ? "Order Verified!" : "Order Rejected", "info");
      fetchDeals();
    } catch (err) { showToast("Verification failed", "error"); }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-6 relative">
      
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl border transition-all animate-bounce-short ${
          toast.type === "error" ? "bg-red-600 border-red-400" : "bg-green-600 border-green-400"
        }`}><p className="font-bold">{toast.message}</p></div>
      )}

      <header className="mb-10">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Admin Control Center</h1>
        <p className="text-slate-400 text-sm">Real-time commission re-splitting and escrow management</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">

          {/* SECTION: MODIFICATION REQUESTS WITH RE-SPLIT */}
          <section>
            <h2 className="text-xl font-bold text-yellow-500 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
              Commission Re-Split Requests ({modRequests.length})
            </h2>

            {modRequests.length === 0 && <p className="text-slate-500 italic">No modifications pending.</p>}

            <div className="grid md:grid-cols-2 gap-4">
              {modRequests.map((deal) => (
                <div key={deal._id} className="bg-slate-900 border border-yellow-500/20 p-5 rounded-3xl shadow-lg space-y-4">
                  <h3 className="font-bold text-slate-100">{deal.productName}</h3>
                  
                  <div className="bg-black/40 p-3 rounded-2xl border border-white/5 space-y-1">
                    <div className="flex justify-between text-[10px]"><span className="text-slate-500">Old Total:</span><span>₹{deal.totalCommission}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-yellow-500 font-bold uppercase">New Total:</span><span className="text-yellow-400 font-black">₹{deal.modificationRequest.data.totalCommission}</span></div>
                  </div>

                  {/* RE-SPLIT INPUTS */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500 uppercase font-bold ml-1">New Admin Share</label>
                      <input 
                        type="number" 
                        className="input text-xs w-full" 
                        value={editMap[deal._id]?.modAdmin || ""} 
                        onChange={(e) => updateEdit(deal._id, "modAdmin", Number(e.target.value))} 
                        placeholder="Admin ₹"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 uppercase font-bold ml-1">New Cust Share</label>
                      <input 
                        type="number" 
                        className="input text-xs w-full" 
                        value={editMap[deal._id]?.modCust || ""} 
                        onChange={(e) => updateEdit(deal._id, "modCust", Number(e.target.value))} 
                        placeholder="Cust ₹"
                      />
                    </div>
                  </div>

                  {/* ESCROW WARNING */}
                  {deal.modificationRequest.extraPayRequired > 0 && !deal.modificationRequest.extraPaid ? (
                    <div className="bg-red-500/10 border border-red-500/30 p-2 rounded-xl text-center">
                      <p className="text-[10px] text-red-400 font-bold uppercase">Merchant hasn't paid extra ₹{deal.modificationRequest.extraPayRequired} yet</p>
                    </div>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/30 p-2 rounded-xl text-center">
                      <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Extra Escrow Verified ✅</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleModReview(deal._id, true)} 
                      disabled={deal.modificationRequest.extraPayRequired > 0 && !deal.modificationRequest.extraPaid}
                      className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:grayscale text-white font-bold py-2 rounded-xl text-xs transition-all"
                    >
                      Approve & Re-Split
                    </button>
                    <button onClick={() => handleModReview(deal._id, false)} className="flex-1 bg-red-600/20 text-red-500 border border-red-600/30 font-bold py-2 rounded-xl text-xs">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          {/* PENDING DEALS SECTION (REMAINS SAME) */}
          <section>
            <h2 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              New Deal Requests ({pendingDeals.length})
            </h2>
            {pendingDeals.map((deal) => (
              <div key={deal._id} className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-6 shadow-xl">
                 <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold">{deal.productName}</h3>
                  <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/30 uppercase">Reviewing</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-black/20 p-4 rounded-2xl">
                  <p><span className="text-slate-500 text-xs">Merchant:</span> {deal.merchant?.name}</p>
                  <p><span className="text-slate-500 text-xs">Commission:</span> <span className="text-yellow-400 font-bold">₹{deal.totalCommission}</span></p>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                   <input type="number" className="input text-xs" placeholder="Admin ₹" onChange={(e) => updateEdit(deal._id, "adminCommission", Number(e.target.value))} />
                   <input type="number" className="input text-xs" placeholder="Customer ₹" onChange={(e) => updateEdit(deal._id, "customerCommission", Number(e.target.value))} />
                   <input type="text" className="input text-xs" placeholder="Admin Phone" onChange={(e) => updateEdit(deal._id, "adminPhone", e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleApproveReject(deal._id, "APPROVED")} className="flex-1 bg-green-600 py-2 rounded-xl font-bold">Approve</button>
                  <button onClick={() => handleApproveReject(deal._id, "REJECTED")} className="px-6 bg-red-600/10 text-red-500 border border-red-500/20 py-2 rounded-xl">Reject</button>
                </div>
              </div>
            ))}
          </section>

          {/* VERIFICATION SECTION */}
          <section>
            <h2 className="text-xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
              Awaiting Proof Verification ({orderedDeals.length})
            </h2>

            {orderedDeals.map((deal) => (
              <div key={deal._id} className="bg-slate-800/50 border border-yellow-500/20 p-6 rounded-3xl mb-4">
                <div className="flex justify-between items-center mb-4">
                    <p className="font-bold">{deal.productName}</p>
                    <button onClick={() => copyToClipboard(deal.orderId, "Order ID")} className="text-xs bg-white/10 px-3 py-1 rounded hover:bg-white/20">📋 Copy Order ID</button>
                </div>
                
                <div className="space-y-2 text-sm text-slate-300 mb-6">
                  <p><b>Customer:</b> {deal.acceptedBy?.name}</p>
                  <p><b>Order ID:</b> <span className="font-mono text-white">{deal.orderId}</span></p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {deal.orderScreenshot && (
                    <a href={deal.orderScreenshot} target="_blank" rel="noopener noreferrer" className="bg-blue-600 px-4 py-2 rounded-xl text-xs font-bold">View Screenshot</a>
                  )}
                  <button onClick={() => handleVerify(deal._id, true)} className="bg-green-600 px-6 py-2 rounded-xl text-xs font-bold">Confirm Order</button>
                  <button onClick={() => handleVerify(deal._id, false)} className="bg-red-600/20 text-red-500 border border-red-600/30 px-6 py-2 rounded-xl text-xs font-bold">Reject Proof</button>
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* RIGHT COLUMN: LIVE WALLETS */}
        <div className="lg:col-span-1">
          <section className="bg-slate-900 border border-white/10 rounded-3xl p-6 sticky top-6">
            <h2 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-green-500 rounded-full"></span>
              Live Wallets
            </h2>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {wallets.map((w) => (
                <div key={w._id} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold truncate pr-2">{w.user?.name || "System"}</p>
                    <span className="text-[8px] uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/20">{w.user?.role}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-3">
                    <div>
                      <p className="text-slate-500">Balance</p>
                      <p className="text-green-400 font-bold">₹{w.balance}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500">Locked</p>
                      <p className="text-yellow-400 font-bold">₹{w.lockedBalance}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;