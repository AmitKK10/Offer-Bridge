import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";

const releaseEscrow = async (deal) => {
  // ===== MERCHANT =====
  const merchantWallet = await Wallet.findOne({ user: deal.merchant });

  if (merchantWallet) {
    // 🔒 SAFETY CHECK
    if (merchantWallet.lockedBalance >= deal.merchantPayAmount) {
      merchantWallet.lockedBalance -= deal.merchantPayAmount;
    } else {
      merchantWallet.lockedBalance = 0;
    }

    await merchantWallet.save();
  }

  // ===== CUSTOMER COMMISSION =====
  if (deal.customerCommission > 0 && deal.acceptedBy) {
    const customerWallet = await Wallet.findOne({ user: deal.acceptedBy });

    if (customerWallet) {
      customerWallet.balance += deal.customerCommission;
      await customerWallet.save();

      await Transaction.create({
        user: deal.acceptedBy,
        deal: deal._id,
        amount: deal.customerCommission,
        type: "COMMISSION",
        description: "Deal commission credited"
      });
    }
  }

  // ===== ADMIN COMMISSION =====
  if (deal.adminCommission > 0) {
    const adminWallet = await Wallet.findOne({ user: deal.admin });

    if (adminWallet) {
      adminWallet.balance += deal.adminCommission;
      await adminWallet.save();

      await Transaction.create({
        user: deal.admin,
        deal: deal._id,
        amount: deal.adminCommission,
        type: "COMMISSION",
        description: "Admin commission credited"
      });
    }
  }

  // 🔔 REAL-TIME WALLET UPDATES
  global.io.to("ADMIN").emit("wallet:updated");
  global.io.to(`USER_${deal.merchant}`).emit("wallet:updated");
  global.io.to(`USER_${deal.acceptedBy}`).emit("wallet:updated");
};

export default releaseEscrow;
