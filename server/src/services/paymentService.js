import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const createOrder = (dealId) =>
  API.post("/payments/create-order", { dealId });

export const verifyPayment = (data) =>
  API.post("/payments/verify", data);
