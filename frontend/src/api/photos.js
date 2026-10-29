import axios from "axios";

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const uploadPhoto = async (doctorId, image, token) =>
  (await axios.put(`/api/photos/${doctorId}`, { image }, auth(token))).data;
export const removePhoto = async (doctorId, token) =>
  (await axios.delete(`/api/photos/${doctorId}`, auth(token))).data;
