import axios from "axios";

const API_BASE = "/api/auth";

export const registerUser = async (payload) => {
  const { data } = await axios.post(`${API_BASE}/register`, payload);
  return data;
};

export const loginUser = async (payload) => {
  const { data } = await axios.post(`${API_BASE}/login`, payload);
  return data;
};

export const getCurrentUser = async (token) => {
  const { data } = await axios.get(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
