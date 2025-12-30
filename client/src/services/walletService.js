import API from "./api";

/* ===============================
   WALLET
   =============================== */

// Get wallet balance
export const getMyWallet = () => {
  return API.get("/wallet/me");
};

// Get transactions
export const getMyTransactions = () => {
  return API.get("/wallet/transactions");
};

export const getAllWallets = () => {
  return API.get("/wallet/all");
};

export const getMyEarningsGraph = () => {
  return API.get("/wallet/earnings");
};
