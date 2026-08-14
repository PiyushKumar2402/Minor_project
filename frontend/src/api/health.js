import axios from "axios";

export const checkApiHealth = async () => {
  const { data } = await axios.get("/api/health");
  return data;
};
