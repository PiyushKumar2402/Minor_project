import axios from "axios";

export const sendEnquiry = async (payload) => {
  const { data } = await axios.post("/api/enquiries", payload);
  return data;
};

export const getEnquiries = async (token) => {
  const { data } = await axios.get("/api/enquiries", { headers: { Authorization: `Bearer ${token}` } });
  return data;
};
