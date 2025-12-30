import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment
} from "../controllers/paymentController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post(
  "/create-order",
  protect,
  authorizeRoles("MERCHANT"),
  createRazorpayOrder
);

router.post(
  "/verify",
  protect,
  authorizeRoles("MERCHANT"),
  verifyRazorpayPayment
);

export default router;
