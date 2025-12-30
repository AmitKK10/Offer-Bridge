import { useEffect, useState } from "react";
import {
  getApprovedDeals,
  acceptDeal,
  uploadOrderProof,
  submitDeliveryOTP,
} from "../services/dealService";
import API from "../services/api";
import { getMyWallet, getMyTransactions } from "../services/walletService";
import socket from "../socket/socket";
import { useAuth } from "../context/AuthContext";
// Ensure you have run: npm install canvas-confetti
import confetti from "canvas-confetti";

const CustomerDashboard = () => {
  const { user } = useAuth();

  const [deals, setDeals] = useState([]);
  const [activeDeal, setActiveDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  const [orderId, setOrderId] = useState("");
  const [orderScreenshot, setOrderScreenshot] = useState("");
  const [deliveryOTP, setDeliveryOTP] = useState("");

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [acceptingDeal, setAcceptingDeal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [warned, setWarned] = useState(false);

  // Custom Toast State
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "info",
  });

  /* ================= UTILS ================= */

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "info" }),
      4000
    );
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied!`, "success");
  };

  /* ================= FETCH ================= */

  const fetchDeals = async () => {
    try {
      const res = await getApprovedDeals();
      setDeals(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveDeal = async () => {
    if (user?.role !== "CUSTOMER") return;
    try {
      const res = await API.get("/deals/my-active");
      if (res.data && res.data._id) {
        // Ensure address is accessible from populated merchant or direct field
        const dealData = res.data;
        dealData.merchantAddress =
          dealData.merchant?.merchantAddress ||
          dealData.deliveryDetails?.address ||
          dealData.merchantAddress;
        setActiveDeal(dealData);
        setWarned(false);
      } else {
        setActiveDeal(null);
      }
    } catch {
      setActiveDeal(null);
    }
  };

  const fetchWallet = async () => {
    if (user?.role !== "CUSTOMER") return;
    try {
      const res = await getMyWallet();
      setWallet(res.data);
    } catch {}
  };

  const fetchTransactions = async () => {
    if (user?.role !== "CUSTOMER") return;
    try {
      const res = await getMyTransactions();
      setTransactions(res.data);
    } catch {}
  };

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    if (user?.role === "CUSTOMER") {
      fetchDeals();
      fetchActiveDeal();
      fetchWallet();
      fetchTransactions();
    }
  }, [user]);

  /* ================= REAL TIME ================= */

  useEffect(() => {
    if (user?.role !== "CUSTOMER") return;

    socket.on("deal:updated", () => {
      fetchDeals();
      fetchActiveDeal();
    });

    socket.on("wallet:updated", () => {
      fetchWallet();
      fetchTransactions();
    });

    return () => {
      socket.off("deal:updated");
      socket.off("wallet:updated");
    };
  }, [user]);

  /* ================= COUNTDOWN ================= */

  useEffect(() => {
    if (!activeDeal?.acceptExpiresAt || activeDeal.status !== "ACCEPTED") {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const diff = new Date(activeDeal.acceptExpiresAt).getTime() - Date.now();

      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        setActiveDeal(null);
        fetchDeals();
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);

        if (minutes === 5 && !warned) {
          showToast("⚠️ Only 5 minutes left to place the order!", "error");
          setWarned(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeDeal, warned]);

  /* ================= ANIMATION ================= */

  const triggerSuccessAnimation = () => {
    const end = Date.now() + 3000;
    const colors = ["#22c55e", "#3b82f6", "#ffffff"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  /* ================= ACTIONS ================= */

  const handleAccept = async (deal) => {
    if (acceptingDeal) return;
    setAcceptingDeal(true);
    try {
      await acceptDeal(deal._id);
      await fetchActiveDeal();
      fetchDeals();
      showToast("Deal secured! Check your task board.", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Deal secured! Check your task board.", "success",
        "error"
      );
    } finally {
      setAcceptingDeal(false);
    }
  };

  const handleCancelDeal = async () => {
    try {
      await API.put(`/deals/${activeDeal._id}/cancel`);
      setActiveDeal(null);
      showToast("Deal released back to market.", "info");
      fetchDeals();
    } catch (err) {
      showToast("Cancellation failed.", "error");
    }
  };

  const handleOrderUpload = async () => {
    if (!orderId || !orderScreenshot)
      return showToast("Required: Order ID & Screenshot", "error");
    try {
      await uploadOrderProof(activeDeal._id, { orderId, orderScreenshot });
      await fetchActiveDeal();
      showToast("Evidence uploaded. Verifying...", "success");
    } catch (err) {
      showToast("Upload error. Try again.", "error");
    }
  };

  const handleOTPSubmit = async () => {
    if (!deliveryOTP || deliveryOTP.length < 4)
      return showToast("Enter valid OTP", "error");
    try {
      const reward = activeDeal.customerCommission;
      await submitDeliveryOTP(activeDeal._id, { deliveryOTP });
      triggerSuccessAnimation();
      showToast(`Payout Success: ₹${reward} added!`, "success");
      setActiveDeal(null);
      fetchDeals();
      fetchWallet();
      fetchTransactions();
    } catch (err) {
      showToast("Invalid OTP code.", "error");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 relative">
      {/* 🚀 PREMIUM TOAST NOTIFICATION */}
      <div
        className={`fixed top-24 right-6 z-[200] transition-all duration-500 transform ${
          toast.show
            ? "translate-x-0 opacity-100"
            : "translate-x-20 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 ${
            toast.type === "error"
              ? "bg-red-500/10 border-red-500/50 text-red-400"
              : toast.type === "success"
              ? "bg-green-500/10 border-green-500/50 text-green-400"
              : "bg-blue-500/10 border-blue-500/50 text-blue-400"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              toast.type === "error"
                ? "bg-red-500"
                : toast.type === "success"
                ? "bg-green-500"
                : "bg-blue-500"
            }`}
          ></div>
          <p className="font-bold text-sm uppercase tracking-wider">
            {toast.message}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-4">
        <header className="mb-10">
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Customer Hub
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Managed Escrow Rewards
          </p>
        </header>

        {/* WALLET SECTION */}
        {wallet && (
          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full"></div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">
                Total Payouts
              </p>
              <p className="text-4xl font-black text-white">
                ₹{wallet.balance}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[50px] rounded-full"></div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">
                Pending Escrow
              </p>
              <p className="text-4xl font-black text-yellow-400">
                ₹{wallet.lockedBalance}
              </p>
            </div>
          </div>
        )}

        {/* ACTIVE TASK */}
        {activeDeal ? (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-6 bg-purple-500 rounded-full animate-pulse"></div>
              <h2 className="text-xl font-black uppercase tracking-tight">
                Ongoing Escrow Task
              </h2>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-3xl font-black mb-2">
                      {activeDeal.productName}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-black rounded-full uppercase tracking-widest">
                        {activeDeal.status.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono">
                        #{activeDeal._id.slice(-8)}
                      </span>
                    </div>
                  </div>

                  {activeDeal.status === "ACCEPTED" && timeLeft && (
                    <div className="flex items-center gap-6 bg-black/40 p-6 rounded-[2rem] border border-white/5">
                      <div className="text-4xl font-mono font-black text-purple-400 tracking-tighter">
                        {timeLeft}
                      </div>
                      <div className="h-10 w-[1px] bg-white/10"></div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold leading-tight">
                        Time remaining
                        <br />
                        to place order
                      </p>
                    </div>
                  )}

                  {/* 🔥 MERCHANT DELIVERY ADDRESS SECTION */}
                  <div className="space-y-4">
                    <div className="p-5 bg-black/40 rounded-[2rem] border border-white/5 relative group">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] text-blue-400 uppercase font-black tracking-widest">
                          Delivery Address (Ship Here)
                        </p>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              activeDeal.merchantAddress,
                              "Merchant Address"
                            )
                          }
                          className="text-[10px] bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1 rounded-full font-bold transition-all active:scale-95"
                        >
                          COPY ADDRESS
                        </button>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">
                        {activeDeal.merchantAddress ||
                          "Address details not found. Please contact Admin."}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter italic">
                          Warning: Order only to this exact address.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-slate-500 uppercase font-black">
                            Admin Contact
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                activeDeal.adminPhone || "8654336734",
                                "Phone"
                              )
                            }
                            className="text-[9px] text-blue-400 font-bold hover:underline"
                          >
                            COPY
                          </button>
                        </div>
                        <p className="font-bold text-white tracking-wide">
                          {activeDeal.adminPhone || "8654336734"}
                        </p>
                      </div>
                      <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">
                          Your Reward
                        </span>
                        <p className="font-black text-2xl text-green-400">
                          ₹{activeDeal.customerCommission}
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href={activeDeal.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black transition-all active:scale-[0.98]"
                  >
                    BUY AT MERCHANT STORE
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>

                {/* RIGHT ACTION SIDE */}
                <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-center">
                  {activeDeal.status === "ACCEPTED" && (
                    <div className="space-y-5">
                      <div className="text-center mb-4">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                          Order Verification Form
                        </p>
                      </div>
                      <input
                        className="w-full p-4 rounded-2xl bg-slate-900 border border-white/10 text-sm outline-none focus:border-purple-500/50 transition-all"
                        placeholder="Enter Order ID"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                      />
                      <input
                        className="w-full p-4 rounded-2xl bg-slate-900 border border-white/10 text-sm outline-none focus:border-purple-500/50 transition-all"
                        placeholder="Screenshot Link (Imgur/Postimg)"
                        value={orderScreenshot}
                        onChange={(e) => setOrderScreenshot(e.target.value)}
                      />
                      <div className="flex gap-3 pt-2">
                        <button
                          className="flex-1 bg-purple-600 hover:bg-purple-500 py-4 rounded-2xl font-black transition-all shadow-lg shadow-purple-600/20"
                          onClick={handleOrderUpload}
                        >
                          SUBMIT PROOF
                        </button>
                        <button
                          className="px-6 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 py-4 rounded-2xl font-black transition-all"
                          onClick={handleCancelDeal}
                        >
                          EXIT
                        </button>
                      </div>
                    </div>
                  )}

                  {(activeDeal.status === "PENDING_VERIFICATION" ||
                    activeDeal.status === "ORDERED") && (
                    <div className="text-center py-10">
                      <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20 relative">
                        <div className="absolute inset-0 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                        <svg
                          className="w-8 h-8 text-yellow-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-2xl font-black text-yellow-500 mb-2 tracking-tight">
                        Verifying Order
                      </h4>
                      <p className="text-slate-500 text-sm max-w-[250px] mx-auto">
                        Our automated systems are matching your order ID with
                        merchant logs.
                      </p>
                    </div>
                  )}

                  {activeDeal.status === "ADMIN_VERIFIED" && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30 text-green-500">
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="3"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <h4 className="text-2xl font-black text-green-400 mb-1">
                          Step 2: Delivery OTP
                        </h4>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                          Enter code from package
                        </p>
                      </div>
                      <input
                        className="w-full p-5 rounded-3xl bg-slate-900 border-2 border-green-500/20 text-4xl text-center font-black tracking-[0.4em] outline-none focus:border-green-500/50 text-green-400 placeholder:text-slate-800"
                        maxLength={6}
                        placeholder="000000"
                        value={deliveryOTP}
                        onChange={(e) => setDeliveryOTP(e.target.value)}
                      />
                      <button
                        className="w-full bg-green-600 hover:bg-green-500 py-5 rounded-[2rem] font-black text-xl shadow-lg shadow-green-600/30 transition-all active:scale-95"
                        onClick={handleOTPSubmit}
                      >
                        CLAIM REWARD
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* MARKETPLACE SECTION */
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                Live Reward Marketplace
              </h2>
              <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Global Feed
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {deals.length > 0 ? (
                deals.map((deal) => (
                  <div
                    key={deal._id}
                    className="bg-white/5 border border-white/10 p-8 rounded-[3rem] hover:border-blue-500/40 hover:bg-white/[0.08] transition-all duration-500 group relative"
                  >
                    <h3 className="font-black text-xl mb-4 text-white line-clamp-1">
                      {deal.productName}
                    </h3>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">
                          Store Price
                        </span>
                        <span className="font-bold text-lg text-white">
                          ₹{deal.priceWithCard}
                        </span>
                      </div>
                      <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-slate-500 uppercase font-black block mb-1">
                          Required Card
                        </span>
                        <span className="font-bold text-sm text-blue-400 truncate block">
                          {deal.requiredCard}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-green-500/10 p-5 rounded-3xl border border-green-500/20 mb-8">
                      <span className="text-[10px] text-green-500/70 font-black uppercase tracking-widest">
                        Net Profit
                      </span>
                      <span className="text-2xl font-black text-green-400">
                        ₹{deal.customerCommission}
                      </span>
                    </div>

                    <button
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-20 text-white font-black py-5 rounded-3xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.97]"
                      disabled={acceptingDeal}
                      onClick={() => handleAccept(deal)}
                    >
                      {acceptingDeal ? "SECURING..." : "ACCEPT DEAL"}
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-28 text-center bg-white/5 border-2 border-dashed border-white/10 rounded-[4rem]">
                  <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">
                    Waiting for new merchants to post deals...
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* HISTORY SECTION */}
        <section className="mt-28 mb-20">
          <h2 className="text-2xl font-black tracking-tight mb-8 flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
            Transaction Ledger
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">
                  <tr>
                    <th className="p-8">Timestamp</th>
                    <th className="p-8">Details</th>
                    <th className="p-8 text-right">Net Settlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {transactions.map((t) => (
                    <tr
                      key={t._id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="p-8 text-slate-400 text-xs font-mono">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td className="p-8 font-black text-white text-sm">
                        {t.description}
                      </td>
                      <td
                        className={`p-8 text-right font-black text-lg ${
                          t.type === "CREDIT"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {t.type === "CREDIT" ? "+" : "-"}₹{t.amount}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="p-10 text-center text-slate-600 italic"
                      >
                        No history recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CustomerDashboard;
