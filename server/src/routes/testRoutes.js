import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Test merchant access
router.get(
  "/merchant",
  protect,
  authorizeRoles("MERCHANT"),
  (req, res) => {
    res.json({
      message: "Welcome Merchant! This is a protected route.",
      user: req.user
    });
  }
);

// Test admin access
router.get(
  "/admin",
  protect,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.json({
      message: "Welcome Admin! This is a protected route."
    });
  }
);

// Test customer access
router.get(
  "/customer",
  protect,
  authorizeRoles("CUSTOMER"),
  (req, res) => {
    res.json({
      message: "Welcome Customer! This is a protected route."
    });
  }
);

export default router;
