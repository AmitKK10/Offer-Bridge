import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createDeal } from "../services/dealService";

const CreateDeal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // NEW: Toast State
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  const [form, setForm] = useState({
    productName: "",
    productUrl: "",
    priceWithoutCard: "",
    priceWithCard: "",
    merchantPayAmount: 0, // Will be auto-calculated
    totalCommission: "",
    requiredCard: "",
    deliveryName: "",
    deliveryPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: ""
  });

  /* ================= UTILS ================= */
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 4000);
  };

  // Auto-calculate Merchant Pay Amount (Price + Commission)
  useEffect(() => {
    const total = Number(form.priceWithCard) + Number(form.totalCommission);
    setForm(prev => ({ ...prev, merchantPayAmount: total }));
  }, [form.priceWithCard, form.totalCommission]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Structure the data to match your Mongoose Schema exactly
      const dealData = {
        productName: form.productName,
        productUrl: form.productUrl,
        priceWithoutCard: Number(form.priceWithoutCard),
        priceWithCard: Number(form.priceWithCard),
        merchantPayAmount: Number(form.merchantPayAmount),
        totalCommission: Number(form.totalCommission),
        requiredCard: form.requiredCard,
        deliveryDetails: {
          name: form.deliveryName,
          phone: form.deliveryPhone,
          address: `${form.addressLine1}, ${form.addressLine2 ? form.addressLine2 + ', ' : ''}${form.city}, ${form.state} - ${form.pincode}`
        }
      };

      await createDeal(dealData);
      showToast("Deal created! Waiting for Admin approval.", "success");
      
      // Navigate after a delay so they see the success message
      setTimeout(() => navigate("/merchant/dashboard"), 2000);
    } catch (err) {
      showToast(err.response?.data?.message || "Deal creation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex justify-center relative">
      
      {/* TOAST SYSTEM */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl border transition-all animate-bounce-short ${
          toast.type === "error" ? "bg-red-600 border-red-400" : 
          toast.type === "success" ? "bg-green-600 border-green-400" : "bg-blue-600 border-blue-400"
        }`}>
          <p className="font-bold text-white">{toast.message}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl space-y-6"
      >
        <div className="border-b border-white/10 pb-4">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
            Launch New Deal
          </h1>
          <p className="text-slate-400 text-sm mt-1">Provide product and delivery details for the escrow contract.</p>
        </div>

        {/* SECTION 1: PRODUCT */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Product Information</h3>
          <input
            className="input w-full"
            name="productName"
            placeholder="Product Name (e.g., iPhone 15 Pro)"
            value={form.productName}
            onChange={handleChange}
            required
          />

          <input
            className="input w-full"
            name="productUrl"
            type="url"
            placeholder="Store Link (Amazon, Flipkart, etc.)"
            value={form.productUrl}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              className="input w-full"
              name="priceWithoutCard"
              type="number"
              placeholder="Market Price (₹)"
              value={form.priceWithoutCard}
              onChange={handleChange}
              required
            />
            <input
              className="input w-full"
              name="priceWithCard"
              type="number"
              placeholder="Card Offer Price (₹)"
              value={form.priceWithCard}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              className="input w-full"
              name="totalCommission"
              type="number"
              placeholder="Total Commission (₹)"
              value={form.totalCommission}
              onChange={handleChange}
              required
            />
            <select
              className="input w-full appearance-none"
              name="requiredCard"
              value={form.requiredCard}
              onChange={handleChange}
              required
            >
              <option value="">Select Required Card</option>
              <option value="ANY">Any Card</option>
              <option value="SBI">SBI Credit Card</option>
              <option value="HDFC">HDFC Bank</option>
              <option value="ICICI">ICICI Bank</option>
              <option value="AXIS">Axis Bank</option>
              <option value="KOTAK">Kotak Bank</option>
            </select>
          </div>
        </div>

        {/* ESCROW PREVIEW */}
        <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-2xl flex justify-between items-center">
            <div>
                <p className="text-[10px] text-blue-400 font-bold uppercase">Estimated Escrow Requirement</p>
                <p className="text-xs text-slate-400">Price + Total Commission</p>
            </div>
            <p className="text-2xl font-black text-blue-400">₹{form.merchantPayAmount || 0}</p>
        </div>

        <hr className="border-white/5" />

        {/* SECTION 2: DELIVERY */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Shipping Destination</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              className="input w-full"
              name="deliveryName"
              placeholder="Receiver Name"
              value={form.deliveryName}
              onChange={handleChange}
              required
            />
            <input
              className="input w-full"
              name="deliveryPhone"
              placeholder="Receiver Phone"
              value={form.deliveryPhone}
              onChange={handleChange}
              required
            />
          </div>

          <input
            className="input w-full"
            name="addressLine1"
            placeholder="Address Line 1 (Flat, House No, Building)"
            value={form.addressLine1}
            onChange={handleChange}
            required
          />

          <input
            className="input w-full"
            name="addressLine2"
            placeholder="Address Line 2 (Area, Landmark)"
            value={form.addressLine2}
            onChange={handleChange}
          />

          <div className="grid grid-cols-3 gap-4">
            <input
              className="input w-full"
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              required
            />
            <input
              className="input w-full"
              name="state"
              placeholder="State"
              value={form.state}
              onChange={handleChange}
              required
            />
            <input
              className="input w-full"
              name="pincode"
              placeholder="Pincode"
              value={form.pincode}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={loading}
                className="flex-[2] bg-green-500 hover:bg-green-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
            >
                {loading ? "PROCESSING..." : "CREATE DEAL"}
            </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDeal;