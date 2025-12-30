import Deal from "../models/Deal.js";

const dealExpiryChecker = async () => {
  try {
    const now = new Date();

    const expiredDeals = await Deal.find({
      status: "ACCEPTED",
      acceptExpiresAt: { $lt: now }
    });

    for (const deal of expiredDeals) {
      deal.status = "APPROVED";
      deal.acceptedBy = null;
      deal.acceptExpiresAt = null;
      await deal.save();
    }

    if (expiredDeals.length > 0) {
      console.log(`⏱️ ${expiredDeals.length} deal(s) auto-expired`);
    }
  } catch (err) {
    console.error("Deal expiry error:", err.message);
  }
};

export default dealExpiryChecker;
