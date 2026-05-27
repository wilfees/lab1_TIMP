import axios from "axios";

const AUTH_API_URL = process.env.REACT_APP_AUTH_API_URL || "/api";

const client = axios.create({
  baseURL: AUTH_API_URL,
});

const authHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

export const registerUser = (payload) => {
  return client.post("/auth/register", payload);
};

export const requestLoginCode = (payload) => {
  return client.post("/auth/login/request-code", payload);
};

export const verifyLoginCode = (payload) => {
  return client.post("/auth/login/verify-code", payload);
};

export const getCurrentUser = (token) => {
  return client.get("/auth/me", authHeaders(token));
};

export const logoutUser = (token) => {
  return client.post("/auth/logout", {}, authHeaders(token));
};
