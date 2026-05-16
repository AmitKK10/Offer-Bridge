import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import dealRoutes from "./routes/dealRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();

/* ===============================
   CORS CONFIG
================================ */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://offer-bridge.vercel.app"
    ],
    credentials: true
  })
);

/* ===============================
   MIDDLEWARE
================================ */
app.use(express.json());

/* ===============================
   ROUTES
================================ */
app.use("/api/auth", authRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/test", testRoutes);

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.send("🚀 Offer Bridge API is running");
});

export default app;
