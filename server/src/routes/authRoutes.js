import express from "express";
import {
  registerUser,
  loginUser,
  forgotPasswordSimple
} from "../controllers/authController.js";

const router = express.Router();

/* ===============================
   AUTH ROUTES
   =============================== */

router.post("/register", registerUser);
router.post("/login", loginUser);

// ✅ SIMPLE FORGOT PASSWORD (PUBLIC)
router.put("/forgot-password", forgotPasswordSimple);

export default router;
