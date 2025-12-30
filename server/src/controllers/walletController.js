import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";
/* ===============================
   GET MY WALLET
   =============================== */
export const getMyWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    // ✅ DO NOT BREAK OLD FLOW
    if (!wallet) {
      return res.json({
        balance: 0,
        lockedBalance: 0
      });
    }

    // ✅ Explicit response (safer for frontend)
    res.json({
      balance: wallet.balance,
      lockedBalance: wallet.lockedBalance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   GET MY TRANSACTIONS
   =============================== */
export const getMyTransactions = async (req, res) => {
  try {
    const txns = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(txns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getMyEarningsGraph = async (req, res) => {
  try {
    const earnings = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          type: "COMMISSION"
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(earnings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllWallets = async (req, res) => {
  const wallets = await Wallet.find().populate("user", "name role email");
  res.json(wallets);
};
