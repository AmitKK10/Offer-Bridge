import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
  {
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    productName: String,
    productUrl: { type: String, required: true },
    priceWithoutCard: Number,
    priceWithCard: Number,
    merchantPayAmount: Number,
    totalCommission: Number, 
    adminCommission: { type: Number, default: 0 },
    customerCommission: { type: Number, default: 0 },
    requiredCard: String,
    deliveryDetails: Object,
    adminPhone: { type: String, default: null },
    adminEdited: { type: Boolean, default: false },
    status: {
      type: String,
      enum: [
        "PENDING", "APPROVED", "REJECTED", "ACCEPTED", "ADVANCE_PAID",
        "ORDERED", "ADMIN_VERIFIED", "DELIVERED", "CANCELLED"
      ],
      default: "PENDING"
    },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    acceptExpiresAt: Date,
    orderId: String,
    orderScreenshot: String,
    orderedAt: Date,
    trackingId: String,
    trackingUpdatedAt: Date,
    deliveryOTP: String,
    otpVerifiedAt: Date,
    escrowReleased: { type: Boolean, default: false },
    advancePaid: { type: Boolean, default: false },

    // 🔥 NEW: MODIFICATION REQUEST STORAGE
    modificationRequest: {
      isPending: { type: Boolean, default: false },
      data: Object, // Stores productName, priceWithCard, totalCommission, etc.
      requestedAt: Date
    },

    tracking: {
      orderedAt: Date,
      verifiedAt: Date,
      otpGeneratedAt: Date,
      deliveredAt: Date
    }
  },
  { timestamps: true }
);

export default mongoose.model("Deal", dealSchema);