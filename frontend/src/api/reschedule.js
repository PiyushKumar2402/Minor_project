import axios from "axios";

export const rescheduleAppointment = async (appointmentId, slotId, token) => {
  const { data } = await axios.put(
    `/api/appointments/${appointmentId}/reschedule`,
    { slotId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};
