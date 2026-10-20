import axios from "axios";

const API_BASE = "/api/queue";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

// ----- Patient -----
export const getQueueStatus = async (appointmentId, token) => {
  const { data } = await axios.get(`${API_BASE}/appointment/${appointmentId}`, authHeaders(token));
  return data;
};

export const checkIn = async (appointmentId, token) => {
  const { data } = await axios.post(`${API_BASE}/appointment/${appointmentId}/check-in`, {}, authHeaders(token));
  return data;
};

// ----- Doctor -----
export const getTodayQueue = async (token) => {
  const { data } = await axios.get(`${API_BASE}/doctor/today`, authHeaders(token));
  return data;
};

export const updateQueueStatus = async (appointmentId, status, token) => {
  const { data } = await axios.put(
    `${API_BASE}/doctor/appointment/${appointmentId}/status`,
    { status },
    authHeaders(token)
  );
  return data;
};

export const callNextPatient = async (token) => {
  const { data } = await axios.post(`${API_BASE}/doctor/call-next`, {}, authHeaders(token));
  return data;
};
