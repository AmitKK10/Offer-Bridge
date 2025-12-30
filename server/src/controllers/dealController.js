import mongoose from "mongoose";
import Deal from "../models/Deal.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";

/* =========================================================
    ESCROW RELEASE (SAFE + REAL-TIME)
========================================================= */
export const releaseEscrow = async (deal) => {
  try {
    if (deal.escrowReleased) return;

    // Calculate Payouts
    const customerAmount = deal.priceWithCard + deal.customerCommission;
    const adminAmount = deal.adminCommission;

    // Use findOneAndUpdate with $inc for atomic safety
    await Wallet.findOneAndUpdate(
      { user: deal.acceptedBy },
      { $inc: { balance: customerAmount } }
    );
    
    await Wallet.findOneAndUpdate(
      { user: process.env.ADMIN_USER_ID },
      { $inc: { balance: adminAmount } }
    );

    await Wallet.findOneAndUpdate(
      { user: deal.merchant },
      { $inc: { lockedBalance: -deal.merchantPayAmount } }
    );

    deal.escrowReleased = true;
    await deal.save();

    await Transaction.create([
      {
        user: deal.acceptedBy,
        deal: deal._id,
        amount: customerAmount,
        type: "CREDIT",
        description: "Customer payout after delivery"
      },
      {
        user: process.env.ADMIN_USER_ID,
        deal: deal._id,
        amount: adminAmount,
        type: "COMMISSION",
        description: "Admin commission"
      }
    ]);

    global.io.to(`USER_${deal.acceptedBy}`).emit("wallet:updated");
    global.io.to(`USER_${deal.merchant}`).emit("wallet:updated");
    global.io.to("ADMIN").emit("wallet:updated");
  } catch (error) {
    console.error("❌ Escrow release error:", error.message);
  }
};

/* =========================================================
    MERCHANT → CREATE DEAL
========================================================= */
export const createDeal = async (req, res) => {
  try {
    const {
      productName,
      productUrl,
      priceWithoutCard,
      priceWithCard,
      merchantPayAmount,
      totalCommission,
      requiredCard,
      deliveryDetails
    } = req.body;

    const deal = await Deal.create({
      merchant: req.user.id,
      productName,
      productUrl,
      priceWithoutCard,
      priceWithCard,
      merchantPayAmount,
      totalCommission,
      requiredCard,
      deliveryDetails,
      status: "PENDING"
    });

    global.io.to("ADMIN").emit("deal:updated");
    global.io.to(`USER_${req.user.id}`).emit("deal:updated");

    res.status(201).json({
      message: "Deal created successfully. Waiting for admin approval.",
      deal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================================
    ADMIN → VIEW & UPDATE
========================================================= */
export const getPendingDeals = async (req, res) => {
  const deals = await Deal.find({ status: "PENDING" })
    .populate("merchant", "name email")
    .select("productName totalCommission merchantPayAmount advancePaid createdAt");

  res.json(deals);
};

export const getOrderedDealsForAdmin = async (req, res) => {
  const deals = await Deal.find({ status: { $in: ["ORDERED"] } })
    .populate("merchant", "name email")
    .populate("acceptedBy", "name email");

  res.json(deals);
};

export const updateDealStatus = async (req, res) => {
  try {
    const { status, adminCommission, customerCommission, adminPhone } = req.body;
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ message: "Deal not found" });

    if (status === "APPROVED") {
      if (!deal.merchantPayAmount || deal.merchantPayAmount <= 0) {
        return res.status(400).json({ message: "Merchant advance amount is invalid." });
      }

      const totalSplit = (adminCommission || 0) + (customerCommission || 0);
      if (totalSplit > deal.totalCommission) {
        return res.status(400).json({ message: "Split exceeds total commission" });
      }

      deal.adminCommission = adminCommission || 0;
      deal.customerCommission = customerCommission || 0;
      if (adminPhone) {
        deal.adminPhone = adminPhone;
        deal.adminEdited = true;
      }
      deal.status = "APPROVED";
    }

    if (status === "REJECTED") deal.status = "REJECTED";

    await deal.save();
    global.io.to("ADMIN").emit("deal:updated");
    global.io.to(`USER_${deal.merchant}`).emit("deal:updated");
    res.json({ message: "Deal updated successfully", deal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
    ADMIN → VERIFY ORDER + OTP
========================================================= */

export const verifyOrderProof = async (req, res) => {
  try {
    const { approved } = req.body;
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ message: "Deal not found" });

    if (approved) {
      deal.status = "ADMIN_VERIFIED";
      // Ensure OTP is generated and saved
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      deal.deliveryOTP = otp;
    } else {
      deal.status = "APPROVED"; // Reset so customer can try again or someone else accepts
      deal.acceptedBy = null;
      deal.orderId = null;
    }

    await deal.save();

    // 🔔 REAL-TIME: Notify specific Merchant and Admin
    // Using deal.merchant (ID) to target the specific room
    global.io.to(`USER_${deal.merchant}`).emit("deal:updated");
    global.io.to("ADMIN").emit("deal:updated");

    res.json({ message: "Verification processed", deal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
    MERCHANT → ACTIONS & VIEWS
========================================================= */
export const getMerchantApprovedDeals = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "MERCHANT") {
      query.merchant = req.user.id;
    } else if (req.user.role === "ADMIN" && req.query.all === "true") {
      query = {}; 
    }

    const deals = await Deal.find({
      ...query,
      status: { $in: ["APPROVED", "ACCEPTED", "ORDERED", "ADMIN_VERIFIED", "DELIVERED"] }
    })
    .populate("acceptedBy", "name email")
    .sort({ updatedAt: -1 });

    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const merchantEditDeal = async (req, res) => {
  try {
    const { totalCommission } = req.body;
    const deal = await Deal.findOne({
      _id: req.params.id,
      merchant: req.user.id,
      status: "APPROVED",
      acceptedBy: null,
      advancePaid: true
    });

    if (!deal) return res.status(400).json({ message: "Deal cannot be edited." });
    if (totalCommission < 0) return res.status(400).json({ message: "Invalid commission." });

    deal.totalCommission = totalCommission;
    deal.merchantPayAmount = deal.priceWithCard + totalCommission;
    await deal.save();

    global.io.emit("deal:updated");
    res.json({ message: "Deal updated successfully", deal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const requestDealModification = async (req, res) => {
  try {
    const deal = await Deal.findOne({
      _id: req.params.id,
      merchant: req.user.id,
      status: "APPROVED",
      acceptedBy: null 
    });

    if (!deal) return res.status(400).json({ message: "Deal cannot be modified." });

    deal.modificationRequest = {
      isPending: true,
      data: req.body, 
      requestedAt: new Date()
    };

    await deal.save();
    global.io.to("ADMIN").emit("deal:updated");
    res.json({ message: "Modification request sent to Admin.", deal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const handleModificationReview = async (req, res) => {
  try {
    const { approved, adminCommission, customerCommission } = req.body;
    const deal = await Deal.findById(req.params.id);

    if (!deal || !deal.modificationRequest?.isPending) {
      return res.status(400).json({ message: "No pending modification found." });
    }

    if (approved) {
      // 🛑 BLOCKER: If commission increased but extra hasn't been paid via Razorpay
      if (deal.modificationRequest.extraPayRequired > 0 && !deal.modificationRequest.extraPaid) {
        return res.status(400).json({ message: "Merchant must pay the extra commission escrow first!" });
      }

      const newData = deal.modificationRequest.data;
      // Update the LIVE fields that the Customer and Merchant see
      deal.productName = newData.productName || deal.productName;
      deal.totalCommission = newData.totalCommission || deal.totalCommission;
      deal.priceWithCard = newData.priceWithCard || deal.priceWithCard;
      deal.adminCommission = Number(adminCommission);
      deal.customerCommission = Number(customerCommission);
      deal.merchantPayAmount = deal.priceWithCard + deal.totalCommission;
    }

    deal.modificationRequest.isPending = false;
    deal.modificationRequest.data = null;
    await deal.save();

    // 🔔 REAL-TIME: Update everyone
    global.io.emit("deal:updated"); 
    res.json({ message: approved ? "Deal updated live!" : "Rejected." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const deleteMerchantDeal = async (req, res) => {
  try {
    const deal = await Deal.findOne({ _id: req.params.id, merchant: req.user.id, acceptedBy: null });
    if (!deal) return res.status(400).json({ message: "Cannot delete accepted deal." });

    if (deal.advancePaid) {
      await Wallet.findOneAndUpdate(
        { user: deal.merchant },
        { $inc: { balance: deal.merchantPayAmount, lockedBalance: -deal.merchantPayAmount } }
      );
    }

    deal.status = "CANCELLED";
    await deal.save();

    global.io.to("ADMIN").emit("deal:updated");
    global.io.to(`USER_${deal.merchant}`).emit("wallet:updated");
    global.io.emit("deal:updated");

    res.json({ message: "Deal deleted & funds refunded." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================================================
    CUSTOMER → ACTIONS & VIEWS
========================================================= */
export const getApprovedDeals = async (req, res) => {
  const deals = await Deal.find({ status: "APPROVED", advancePaid: true });
  for (const deal of deals) { await releaseIfExpired(deal); }

  res.json(
    deals
      .filter(d => !d.acceptedBy)
      .map(d => ({ ...d.toObject(), commission: d.customerCommission }))
  );
};

export const acceptDeal = async (req, res) => {
  const deal = await Deal.findOne({ _id: req.params.id, status: "APPROVED", advancePaid: true, acceptedBy: null });
  if (!deal) return res.status(400).json({ message: "Unavailable" });

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);

  deal.acceptedBy = req.user.id;
  deal.acceptExpiresAt = expiresAt;
  deal.status = "ACCEPTED";

  await deal.save();
  global.io.to("ADMIN").emit("deal:updated");
  global.io.to(`USER_${deal.merchant}`).emit("deal:updated");
  global.io.to(`USER_${req.user.id}`).emit("deal:updated");

  res.json({ message: "Deal accepted", acceptExpiresAt });
};

export const uploadOrderProof = async (req, res) => {
  const deal = await Deal.findOne({ _id: req.params.id, acceptedBy: req.user.id, status: "ACCEPTED" });
  if (!deal) return res.status(400).json({ message: "Invalid state" });

  deal.orderId = req.body.orderId;
  deal.orderScreenshot = req.body.orderScreenshot;
  deal.status = "ORDERED";
  deal.tracking.orderedAt = new Date();

  await deal.save();
  global.io.to("ADMIN").emit("deal:updated");
  res.json({ message: "Order proof uploaded" });
};

export const submitDeliveryOTP = async (req, res) => {
  const deal = await Deal.findOne({ _id: req.params.id, acceptedBy: req.user.id, status: { $in: ["ADMIN_VERIFIED", "ORDERED"] } });
  if (!deal) return res.status(400).json({ message: "Invalid deal" });

  deal.deliveryOTP = String(req.body.deliveryOTP || "").trim();
  deal.status = "DELIVERED";
  await deal.save();

  global.io.to("ADMIN").emit("deal:updated");
  global.io.to(`USER_${deal.merchant}`).emit("deal:updated");
  global.io.to(`USER_${deal.acceptedBy}`).emit("wallet:updated");

  await releaseEscrow(deal);
  res.json({ message: "Delivered & Escrow released" });
};



export const getMyActiveDeal = async (req, res) => {
  try {
    // 🔥 We populate 'merchant' and specifically ask for 'merchantAddress' from the User model
    const deal = await Deal.findOne({ 
      acceptedBy: req.user.id, 
      status: { $in: ["ACCEPTED", "ORDERED", "PENDING_VERIFICATION", "ADMIN_VERIFIED"] } 
    }).populate("merchant", "name email merchantAddress"); 

    if (!deal) return res.json(null);

    // Map the address to a top-level property for the frontend
    const dealData = deal.toObject();
    dealData.commission = deal.customerCommission;
    
    // Ensure merchantAddress exists even if nesting fails
    dealData.merchantAddress = deal.merchant?.merchantAddress || deal.deliveryDetails?.address || "Address not found";

    res.json(dealData);
  } catch (error) {
    console.error("Error in getMyActiveDeal:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const cancelDealByCustomer = async (req, res) => {
  const deal = await Deal.findOne({ _id: req.params.id, acceptedBy: req.user.id, status: "ACCEPTED" });
  if (!deal) return res.status(400).json({ message: "Not cancellable" });

  deal.status = "APPROVED";
  deal.acceptedBy = null;
  deal.acceptExpiresAt = null;

  await deal.save();
  global.io.to("ADMIN").emit("deal:updated");
  global.io.to(`USER_${deal.merchant}`).emit("deal:updated");
  global.io.to(`USER_${req.user.id}`).emit("deal:updated");

  res.json({ message: "Cancelled" });
};

const releaseIfExpired = async (deal) => {
  if (deal.status === "ACCEPTED" && deal.acceptExpiresAt && new Date() > deal.acceptExpiresAt) {
    deal.acceptedBy = null;
    deal.status = "APPROVED";
    await deal.save();
    global.io.to("ADMIN").emit("deal:updated");
  }
};

export const updateTrackingId = async (req, res) => {
  try {
    const deal = await Deal.findOne({ 
      _id: req.params.id, 
      acceptedBy: req.user.id, 
      status: { $in: ["ADMIN_VERIFIED", "ORDERED"] } 
    });

    if (!deal) return res.status(400).json({ message: "Deal not found or invalid state" });

    deal.trackingId = req.body.trackingId;
    deal.trackingUpdatedAt = new Date();
    await deal.save();

    global.io.emit("deal:updated");
    res.json({ message: "Tracking updated", deal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};