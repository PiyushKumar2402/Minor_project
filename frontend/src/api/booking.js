import axios from "axios";

// Same as bookAppointment, plus an optional reason for the visit
export const bookWithReason = async (doctorId, slotId, mode, reason, token) => {
  const { data } = await axios.post(
    "/api/appointments",
    { doctorId, slotId, mode, reason },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};
