import axios from "axios";

const API_BASE = "/api/availability";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getMyAvailability = async (token) => {
  const { data } = await axios.get(`${API_BASE}/me`, authHeaders(token));
  return data;
};

export const updateMyAvailability = async (payload, token) => {
  const { data } = await axios.put(`${API_BASE}/me`, payload, authHeaders(token));
  return data;
};

export const getAvailabilityByDoctorId = async (doctorId) => {
  const { data } = await axios.get(`${API_BASE}/${doctorId}`);
  return data;
};
