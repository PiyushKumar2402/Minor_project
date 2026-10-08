import axios from "axios";

const API_BASE = "/api/appointments";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const bookAppointment = async (doctorId, slotId, mode, token) => {
  const { data } = await axios.post(API_BASE, { doctorId, slotId, mode }, authHeaders(token));
  return data;
};

export const getMyAppointments = async (token) => {
  const { data } = await axios.get(`${API_BASE}/me`, authHeaders(token));
  return data;
};

export const getDoctorAppointments = async (token) => {
  const { data } = await axios.get(`${API_BASE}/doctor/me`, authHeaders(token));
  return data;
};

export const cancelAppointment = async (id, token) => {
  const { data } = await axios.put(`${API_BASE}/${id}/cancel`, {}, authHeaders(token));
  return data;
};
