import axios from "axios";

const API_BASE = "/api/admin";
const authHeaders = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getAdminStats = async (token) => {
  const { data } = await axios.get(`${API_BASE}/stats`, authHeaders(token));
  return data;
};

export const getAppointmentRows = async (token, from, to) => {
  const { data } = await axios.get(`${API_BASE}/appointments`, {
    ...authHeaders(token),
    params: { from: from || undefined, to: to || undefined },
  });
  return data;
};

// Returns the PDF as a Blob
export const getReportPdf = async (token, from, to) => {
  const { data } = await axios.get(`${API_BASE}/report`, {
    ...authHeaders(token),
    params: { from: from || undefined, to: to || undefined },
    responseType: "blob",
  });
  return data;
};
