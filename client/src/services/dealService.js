import API from "./api";

/* ===============================
   CUSTOMER
   =============================== */

// View approved deals
export const getApprovedDeals = () => {
  return API.get("/deals/approved");
};

// Accept a deal (30-min lock)
export const acceptDeal = (dealId) => {
  return API.put(`/deals/${dealId}/accept`);
};

// Upload order proof
export const uploadOrderProof = (dealId, data) => {
  return API.put(`/deals/${dealId}/order`, data);
};

// Submit delivery OTP
export const submitDeliveryOTP = (dealId, data) => {
  return API.put(`/deals/${dealId}/deliver`, data);
};

/* ===============================
   MERCHANT
   =============================== */

// Merchant creates deal
export const createDeal = (data) => {
  return API.post("/deals", data);
};

// Merchant views own approved deals
export const getMerchantApprovedDeals = () => {
  return API.get("/deals/merchant/approved");
};

/* ===============================
   ADMIN
   =============================== */

// View pending deals
export const getPendingDeals = () => {
  return API.get("/deals/pending");
};

// ✅ UPDATED: Approve / Reject deal (supports full payload)
export const updateDealStatus = (dealId, payload) => {
  /**
   * payload can be:
   * { status: "REJECTED" }
   * OR
   * {
   *   status: "APPROVED",
   *   adminCommission,
   *   customerCommission,
   *   deliveryDetails
   * }
   */
  return API.put(`/deals/${dealId}`, payload);
};

// Admin verifies order proof
export const verifyOrderProof = (dealId, approved) => {
  return API.put(`/deals/${dealId}/verify-proof`, { approved });
};


// View ALL merchant deals (pending + approved)
export const getMerchantDeals = () => {
  return API.get("/deals/merchant/approved?all=true");
};
