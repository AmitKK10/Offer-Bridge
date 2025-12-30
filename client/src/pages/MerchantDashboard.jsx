import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMerchantApprovedDeals } from "../services/dealService";
import { getMyWallet, getMyTransactions } from "../services/walletService";
import loadRazorpay from "../utils/loadRazorpay";
import { createOrder, verifyPayment } from "../services/paymentService";
import socket from "../socket/socket";
import API from "../services/api"; 
import { useAuth } from "../context/AuthContext"; // Added to ensure user identity

const MerchantDashboard = () => {
  const [deals, setDeals] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Access current user
  const navigate = useNavigate();
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  const [editingDealId, setEditingDealId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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
  const fetchAllData = async () => {
    try {
      const [dealsRes, walletRes, transRes] = await Promise.all([
        getMerchantApprovedDeals(),
        getMyWallet(),
        getMyTransactions()
      ]);
      setDeals(dealsRes.data || []);
      setWallet(walletRes.data);
      setTransactions(transRes.data || []);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  /* ================= REAL-TIME LISTENERS ================= */
  useEffect(() => {
    // Identity check: Tell server who we are to get private updates (OTP/Order ID)
    if (user?.id) {
      socket.emit("join", user.id);
    }

    // Refresh data on any deal update
    socket.on("deal:updated", () => {
      console.log("Real-time update received");
      fetchAllData();
    });

    // Handle specific OTP events
    socket.on("deal:otp", (data) => {
      showToast("Delivery OTP Received!", "success");
      fetchAllData();
    });

    socket.on("wallet:updated", fetchAllData);

    return () => {
      socket.off("deal:updated");
      socket.off("deal:otp");
      socket.off("wallet:updated");
    };
  }, [user]); // Re-bind if user identity changes

  /* ================= ACTIONS ================= */

  const handleDelete = async (dealId) => {
    try {
      await API.delete(`/deals/${dealId}/delete`);
      showToast("Deal deleted and funds refunded.", "success");
      setConfirmDeleteId(null);
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    }
  };

  const handleEditRequest = async (dealId) => {
    try {
      const res = await API.put(`/deals/${dealId}/request-modify`, editFormData);
      showToast(res.data.message, "success");
      setEditingDealId(null);
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.message || "Request failed", "error");
    }
  };

  /* ================= RAZORPAY HANDLERS ================= */

  const handlePayment = async (deal) => {
    const loaded = await loadRazorpay();
    if (!loaded) return showToast("Razorpay SDK failed", "error");
    try {
      const { data } = await createOrder(deal._id);
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Offer Bridge",
        description: `Advance for ${deal.productName}`,
        handler: async (response) => {
          await verifyPayment({ ...response, dealId: deal._id, isModification: false });
          showToast("Payment successful & escrow locked", "success");
          fetchAllData();
        }
      };
      new window.Razorpay(options).open();
    } catch (err) {
      showToast("Payment initiation failed", "error");
    }
  };

  const handleModificationPayment = async (deal) => {
    const loaded = await loadRazorpay();
    if (!loaded) return showToast("Razorpay SDK failed", "error");
    try {
      const { data } = await createOrder(deal._id, true); 
      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Offer Bridge",
        description: `Extra Escrow for ${deal.productName}`,
        handler: async (response) => {
          await verifyPayment({ ...response, dealId: deal._id, isModification: true });
          showToast("Extra funds locked successfully", "success");
          fetchAllData();
        }
      };
      new window.Razorpay(options).open();
    } catch (err) {
      showToast("Modification payment failed", "error");
    }
  };

  const startEditing = (deal) => {
    setEditingDealId(deal._id);
    setEditFormData({
      productName: deal.productName,
      totalCommission: deal.totalCommission,
      priceWithCard: deal.priceWithCard,
      productUrl: deal.productUrl
    });
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 relative">
      
      {/* GLASS CONFIRMATION MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 text-center">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl animate-fadeIn">
            <h2 className="text-2xl font-black mb-2">Delete Deal?</h2>
            <p className="text-slate-400 text-sm mb-6">Funds will be returned to your balance.</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold">Cancel</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 py-3 bg-red-600 rounded-xl font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST SYSTEM */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl border transition-all animate-bounce-short ${
          toast.type === "error" ? "bg-red-600 border-red-400" : "bg-green-600 border-green-400"
        }`}>
          <p className="font-bold text-white">{toast.message}</p>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-green-400">Merchant Dashboard</h1>
        <button onClick={() => navigate("/merchant/create")} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold transition-all active:scale-95">
          + Create Deal
        </button>
      </div>

      {/* WALLET CARDS */}
      {wallet && (
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl shadow-lg">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Available Balance</p>
            <p className="text-3xl font-black text-white">₹{wallet.balance}</p>
          </div>
          <div className="bg-yellow-500/5 border border-yellow-500/20 p-6 rounded-3xl shadow-lg">
            <p className="text-xs text-yellow-500 uppercase font-bold tracking-widest mb-1">Escrow Locked</p>
            <p className="text-3xl font-black text-yellow-400">₹{wallet.lockedBalance}</p>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-6 bg-green-500 rounded-full"></span>
        Manage Deals
      </h2>

      {/* DEAL GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {deals.map((deal) => (
          <div key={deal._id} className="bg-slate-900 border border-white/5 p-5 rounded-3xl space-y-3 shadow-xl relative overflow-hidden transition-all hover:border-white/20">
            
            {/* PENDING MODIFICATION BADGE */}
            {deal.modificationRequest?.isPending && (
              <div className="absolute top-0 left-0 w-full bg-yellow-500/20 text-yellow-500 text-[10px] text-center py-1 font-bold uppercase tracking-widest border-b border-yellow-500/20 z-10">
                Modification Pending Admin Approval
              </div>
            )}

            {editingDealId === deal._id ? (
              <div className="space-y-3 pt-4">
                <input className="input text-xs w-full" value={editFormData.productName} onChange={(e) => setEditFormData({...editFormData, productName: e.target.value})} placeholder="Product Name" />
                <input type="number" className="input text-xs w-full" value={editFormData.totalCommission} onChange={(e) => setEditFormData({...editFormData, totalCommission: e.target.value})} placeholder="Total Commission" />
                <div className="flex gap-2">
                  <button onClick={() => handleEditRequest(deal._id)} className="flex-1 bg-green-600 text-[10px] py-2 rounded-lg font-bold">Request Change</button>
                  <button onClick={() => setEditingDealId(null)} className="flex-1 bg-slate-700 text-[10px] py-2 rounded-lg font-bold">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start pt-2">
                  <h3 className="font-bold truncate max-w-[150px]">{deal.productName}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${deal.status === 'APPROVED' ? 'border-green-500 text-green-500' : 'border-blue-500 text-blue-400'}`}>
                    {deal.status}
                  </span>
                </div>
                
                <div className="bg-black/40 p-3 rounded-2xl text-sm border border-white/5 space-y-2">
                  <div className="flex justify-between"><span>Payable:</span><span className="font-bold">₹{deal.merchantPayAmount}</span></div>
                  <div className="flex justify-between text-yellow-400"><span className="text-slate-400">Commission:</span><span className="font-bold">₹{deal.totalCommission}</span></div>
                  
                  {/* REAL-TIME TRACKING SECTION (Order ID & Tracking) */}
                  {deal.orderId && (
                    <div className="pt-2 border-t border-white/10">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Order Details</p>
                        <div className="flex justify-between items-center bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                            <span className="text-xs font-mono text-blue-400 truncate pr-2">{deal.orderId}</span>
                            <button onClick={() => copyToClipboard(deal.orderId, "Order ID")} className="text-[9px] bg-blue-600 px-2 py-1 rounded font-bold">Copy</button>
                        </div>
                    </div>
                  )}
                </div>

                {/* OTP DISPLAY (Only shown when admin verified) */}
                {deal.deliveryOTP && (
                  <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-2xl text-center">
                    <p className="text-[10px] text-green-400 uppercase font-bold mb-1">Delivery OTP (Share with Customer)</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl font-black tracking-widest text-white">{deal.deliveryOTP}</span>
                      <button onClick={() => copyToClipboard(deal.deliveryOTP, "OTP")} className="text-[10px] bg-green-600 text-white px-2 py-1 rounded font-bold">Copy</button>
                    </div>
                  </div>
                )}

                {/* DYNAMIC MODIFICATION PAYMENT BUTTON */}
                {deal.modificationRequest?.isPending && deal.modificationRequest?.extraPayRequired > 0 && !deal.modificationRequest?.extraPaid && (
                  <button 
                    onClick={() => handleModificationPayment(deal)} 
                    className="w-full bg-orange-500 hover:bg-orange-400 text-white text-xs font-black py-2 rounded-xl shadow-lg shadow-orange-500/20 transition-all border border-orange-400/30"
                  >
                    Pay Extra Commission (₹{deal.modificationRequest.extraPayRequired})
                  </button>
                )}

                {/* ACTION BUTTONS */}
                {!deal.acceptedBy && (
                  <div className="flex gap-2">
                    <button onClick={() => startEditing(deal)} disabled={deal.modificationRequest?.isPending} className="flex-1 bg-white/5 hover:bg-white/10 text-[10px] py-2 rounded-lg border border-white/10 disabled:opacity-20 transition-all">EDIT</button>
                    <button onClick={() => setConfirmDeleteId(deal._id)} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] py-2 rounded-lg border border-red-500/20">DELETE</button>
                  </div>
                )}

                {deal.status === "APPROVED" && !deal.advancePaid && (
                  <button onClick={() => handlePayment(deal)} className="w-full bg-yellow-400 text-black font-black py-2 rounded-xl mt-2 hover:bg-yellow-300 shadow-lg shadow-yellow-400/20">
                    Pay Advance (Initial)
                  </button>
                )}
                
                {deal.advancePaid && <div className="text-center text-xs text-green-400 font-bold uppercase py-2 tracking-widest bg-green-500/5 rounded-xl border border-green-500/10">✓ Advance Paid</div>}
              </>
            )}
          </div>
        ))}
      </div>

      {/* TRANSACTION TABLE */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
        Wallet Transactions
      </h2>
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl mb-10 text-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-slate-400 text-[10px] uppercase font-black">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Description</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((t) => (
                <tr key={t._id} className="hover:bg-white/5 transition-all">
                  <td className="p-4 text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 font-medium">{t.description}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${t.type === 'CREDIT' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{t.type}</span>
                  </td>
                  <td className={`p-4 text-right font-black ${t.type === 'CREDIT' ? 'text-green-400' : 'text-white'}`}>
                    {t.type === 'CREDIT' ? '+' : '-'}₹{t.amount}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                    <td colSpan="4" className="p-10 text-center text-slate-500 italic">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboard;