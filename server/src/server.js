import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 FORCE dotenv to load correct .env
dotenv.config({ path: path.join(__dirname, "../.env") });

import app from "./app.js";
import connectDB from "./config/db.js";
import dealExpiryChecker from "./utils/dealExpiryChecker.js";
import walletRoutes from "./routes/walletRoutes.js";
import { initSocket } from "./socket/socket.js";

const PORT = process.env.PORT || 5000;

// Debug (TEMP)
console.log("ENV CHECK:", process.env.RAZORPAY_KEY_ID);

// DB + background jobs
connectDB();
setInterval(dealExpiryChecker, 60 * 1000);

// routes
app.use("/api/wallet", walletRoutes);

// ================= SOCKET + SERVER =================

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"]
  }
});

// make io accessible in controllers
global.io = io;

// 🔐 initialize socket auth + rooms
initSocket(io);

// start server
server.listen(PORT, () => {
  console.log(`✅ Server + Socket.IO running on port ${PORT}`);
});

