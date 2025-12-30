import API from "./api";

/**
 * Create Razorpay order
 * @param {string} dealId 
 * @param {boolean} isModification - Set to true if paying extra commission for an edit
 */
export const createOrder = (dealId, isModification = false) => {
  return API.post("/payments/create-order", { dealId, isModification });
};

/**
 * Verify payment
 * @param {object} paymentData - Includes razorpay_order_id, razorpay_payment_id, razorpay_signature, dealId
 * @param {boolean} isModification - Must match the flag used in createOrder
 */
export const verifyPayment = (paymentData) => {
  // We spread the paymentData which now includes the isModification flag 
  // passed from the handleModificationPayment function in the Dashboard.
  return API.post("/payments/verify", paymentData);
};