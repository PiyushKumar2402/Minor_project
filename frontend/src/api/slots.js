import axios from "axios";

export const getSlotsForDate = async (doctorId, date) => {
  const { data } = await axios.get(`/api/slots/${doctorId}`, { params: { date } });
  return data;
};
