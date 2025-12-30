import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import Deal from "../models/Deal.js";
import Wallet from "../models/Wallet.js";

/* =========================================================
   CREATE RAZORPAY ORDER (Supports Modification Pay Extra)
   ========================================================= */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { dealId, isModification } = req.body;

    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ message: "Deal not found" });

    let finalAmount = 0;

    if (isModification) {
      // 🛠 Case: Merchant is paying the commission difference for an edit
      if (!deal.modificationRequest?.isPending) {
        return res.status(400).json({ message: "No pending modification found." });
      }
      finalAmount = deal.modificationRequest.extraPayRequired;
    } else {
      // 🆕 Case: Standard initial advance payment
      finalAmount = deal.merchantPayAmount;
    }

    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({ message: "Invalid payment amount." });
    }

    const order = await razorpay.orders.create({
      amount: finalAmount * 100, // paise
      currency: "INR",
      receipt: `deal_${deal._id}_${isModification ? 'mod' : 'init'}`
    });

    res.json({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    res.status(500).json({ message: "Razorpay order creation failed", error: err.message });
  }
};

/* =========================================================
   VERIFY PAYMENT & LOCK ESCROW
   ========================================================= */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      dealId,
      isModification 
    } = req.body;

    // Verify Signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ message: "Deal not found" });

    // Handle Escrow Locking with Atomic Increment
    if (isModification) {
      // 🛠 MODIFICATION FLOW: Add extra amount to locked balance
      if (deal.modificationRequest.extraPaid) {
         return res.json({ message: "Extra amount already paid" });
      }

      const extra = deal.modificationRequest.extraPayRequired;
      
      await Wallet.findOneAndUpdate(
        { user: deal.merchant },
        { $inc: { lockedBalance: extra } }
      );

      deal.modificationRequest.extraPaid = true;
    } else {
      // 🆕 INITIAL FLOW: Lock full amount
      if (deal.advancePaid) return res.status(400).json({ message: "Advance already paid" });

      await Wallet.findOneAndUpdate(
        { user: deal.merchant },
        { $inc: { lockedBalance: deal.merchantPayAmount } }
      );

      deal.advancePaid = true;
    }

    await deal.save();

    // 🔔 REAL-TIME UPDATES: This informs Admin to show "Extra Escrow Verified"
    global.io.to("ADMIN").emit("deal:updated");
    global.io.to(`USER_${deal.merchant}`).emit("deal:updated");
    global.io.to(`USER_${deal.merchant}`).emit("wallet:updated");

    res.json({ message: "Payment verified & escrow updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};