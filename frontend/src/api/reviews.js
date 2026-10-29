import axios from "axios";

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getReviews = async (params = {}) => {
  const { data } = await axios.get("/api/reviews", { params });
  return data; // { summary: { count, average }, reviews: [...] }
};
export const getMyReviewedIds = async (token) => (await axios.get("/api/reviews/mine", auth(token))).data;
export const createReview = async (payload, token) => (await axios.post("/api/reviews", payload, auth(token))).data;
export const deleteReview = async (id, token) => (await axios.delete(`/api/reviews/${id}`, auth(token))).data;
export const getPublicStats = async () => (await axios.get("/api/public/stats")).data;
