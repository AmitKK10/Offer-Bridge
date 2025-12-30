import express from "express";
import {
  createDeal,
  getPendingDeals,
  updateDealStatus,
  getApprovedDeals,
  getMerchantApprovedDeals,
  acceptDeal,
  uploadOrderProof,
  updateTrackingId,
  submitDeliveryOTP,
  verifyOrderProof,
  getOrderedDealsForAdmin,
  getMyActiveDeal,
  cancelDealByCustomer,
  merchantEditDeal,
  requestDealModification,
  deleteMerchantDeal,
  handleModificationReview
} from "../controllers/dealController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

/* =========================================================
   CUSTOMER ROUTES (Placed early to avoid :id collisions)
   ========================================================= */

// Customer views available approved deals
router.get(
  "/approved",
  protect,
  authorizeRoles("CUSTOMER"),
  getApprovedDeals
);

// Customer gets active deal
router.get(
  "/my-active",
  protect,
  authorizeRoles("CUSTOMER"),
  getMyActiveDeal
);

/* =========================================================
   MERCHANT ROUTES
   ========================================================= */

// Merchant creates deal
router.post(
  "/",
  protect,
  authorizeRoles("MERCHANT"),
  createDeal
);

// Unified route for Merchant and Admin to view deals (Fixes 403)
router.get(
  "/merchant/approved",
  protect,
  authorizeRoles("MERCHANT", "ADMIN"),
  getMerchantApprovedDeals
);

// Merchant requests a modification
router.put(
  "/:id/request-modify", 
  protect, 
  authorizeRoles("MERCHANT"), 
  requestDealModification
);

// Merchant deletes deal (instant refund)
router.delete(
  "/:id/delete", 
  protect,
  authorizeRoles("MERCHANT"),
  deleteMerchantDeal
);

// Merchant simple edit (advance paid)
router.put(
  "/:id/merchnat-edit",
  protect,
  authorizeRoles("MERCHANT"),
  merchantEditDeal
);

/* =========================================================
   ADMIN ROUTES
   ========================================================= */

// Admin views pending deals
router.get(
  "/pending",
  protect,
  authorizeRoles("ADMIN"),
  getPendingDeals
);

// Admin views ORDERED deals
router.get(
  "/admin/ordered",
  protect,
  authorizeRoles("ADMIN"),
  getOrderedDealsForAdmin
);

// Admin approves merchant modification
router.put(
  "/:id/approve-modify", 
  protect,
  authorizeRoles("ADMIN"),
  handleModificationReview
);

// Admin verifies order proof
router.put(
  "/:id/verify-proof",
  protect,
  authorizeRoles("ADMIN"),
  verifyOrderProof
);

/* =========================================================
   CUSTOMER ACTION ROUTES
   ========================================================= */

router.put(
  "/:id/accept",
  protect,
  authorizeRoles("CUSTOMER"),
  acceptDeal
);

router.put(
  "/:id/order",
  protect,
  authorizeRoles("CUSTOMER"),
  uploadOrderProof
);

router.put(
  "/:id/tracking",
  protect,
  authorizeRoles("CUSTOMER"),
  updateTrackingId
);

router.put(
  "/:id/deliver",
  protect,
  authorizeRoles("CUSTOMER"),
  submitDeliveryOTP
);

router.put(
  "/:id/cancel",
  protect,
  authorizeRoles("CUSTOMER"),
  cancelDealByCustomer
);

/* =========================================================
   GENERIC ADMIN UPDATE (Placed at the very bottom)
   ========================================================= */

// Generic Admin approve / reject deal
router.put(
  "/:id",
  protect,
  authorizeRoles("ADMIN"),
  updateDealStatus
);

export default router;