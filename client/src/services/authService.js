import API from "./api";

// Register
export const registerUser = (data) =>
  API.post("/auth/register", data);

// Login
export const loginUser = (data) =>
  API.post("/auth/login", data);
