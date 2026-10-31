import axios from "axios";

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getPrescription = async (appointmentId, token) =>
  (await axios.get(`/api/prescriptions/${appointmentId}`, auth(token))).data;

export const savePrescription = async (appointmentId, payload, token) =>
  (await axios.put(`/api/prescriptions/${appointmentId}`, payload, auth(token))).data;

export const getPrescribedIds = async (token) =>
  (await axios.get("/api/prescriptions/mine/ids", auth(token))).data;

// Downloads the PDF through the logged-in request, then saves it as a file.
export const downloadPrescriptionPdf = async (appointmentId, token, name = "prescription") => {
  const res = await axios.get(`/api/prescriptions/${appointmentId}/pdf`, { ...auth(token), responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
};
