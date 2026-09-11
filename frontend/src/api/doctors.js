import axios from "axios";

const API_BASE = "/api/doctors";

const authHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getDoctors = async (specialization) => {
  const params = specialization ? { specialization } : {};
  const { data } = await axios.get(API_BASE, { params });
  return data;
};

export const getSpecializations = async () => {
  const { data } = await axios.get(`${API_BASE}/specializations`);
  return data;
};

export const getDoctorById = async (id) => {
  const { data } = await axios.get(`${API_BASE}/${id}`);
  return data;
};

export const createDoctor = async (payload, token) => {
  const { data } = await axios.post(API_BASE, payload, authHeaders(token));
  return data;
};

export const updateDoctor = async (id, payload, token) => {
  const { data } = await axios.put(`${API_BASE}/${id}`, payload, authHeaders(token));
  return data;
};

export const deleteDoctor = async (id, token) => {
  const { data } = await axios.delete(`${API_BASE}/${id}`, authHeaders(token));
  return data;
};
