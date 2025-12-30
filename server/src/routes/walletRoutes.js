import express from "express";
import {
  getMyWallet,
  getMyTransactions,
  getAllWallets
} from "../controllers/walletController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

/* ===============================
   CUSTOMER + MERCHANT
   =============================== */

// ✅ Allow BOTH CUSTOMER & MERCHANT
router.get(
  "/me",
  protect,
  authorizeRoles("CUSTOMER", "MERCHANT"),
  getMyWallet
);

router.get(
  "/transactions",
  protect,
  authorizeRoles("CUSTOMER", "MERCHANT"),
  getMyTransactions
);

/* ===============================
   ADMIN ONLY
   =============================== */

router.get(
  "/all",
  protect,
  authorizeRoles("ADMIN"),
  getAllWallets
);



export default router;
