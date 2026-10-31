import PDFDocument from "pdfkit";

const NAVY = "#1a4480";
const GREY = "#555555";
const prettyDate = (d) => {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return isNaN(dt) ? d : dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// Streams a one-page-or-more prescription PDF into `out` (an Express response or any writable stream).
export function writePrescriptionPdf(out, { hospital, doctor, patient, appointment, rx }) {
  const doc = new PDFDocument({ size: "A4", margin: 50, info: { Title: "Prescription" } });
  doc.pipe(out);
  const left = 50;
  const width = doc.page.width - 100;

  // header band
  doc.rect(0, 0, doc.page.width, 78).fill(NAVY);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20).text(hospital, left, 24, { width });
  doc.font("Helvetica").fontSize(10).text("Medical Prescription", left, 50, { width });

  // doctor + patient blocks
  let y = 98;
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(12).text(`Dr. ${doctor.name}`, left, y);
  doc.fillColor(GREY).font("Helvetica").fontSize(10).text(doctor.specialization || "", left, y + 16);
  doc.fillColor("#000000").font("Helvetica").fontSize(10)
    .text(`Date: ${prettyDate(appointment.date)}`, left, y, { width, align: "right" })
    .text(`Queue no.: ${appointment.queueNumber || "-"}`, left, y + 14, { width, align: "right" });

  y += 46;
  doc.moveTo(left, y).lineTo(left + width, y).strokeColor("#cccccc").lineWidth(1).stroke();
  y += 10;
  doc.fillColor(GREY).font("Helvetica").fontSize(9).text("PATIENT", left, y);
  doc.fillColor("#000000").font("Helvetica-Bold").fontSize(12).text(patient.name || "", left, y + 12);
  if (patient.phone) doc.font("Helvetica").fontSize(10).fillColor(GREY).text(`Phone: ${patient.phone}`, left, y + 28);
  y += 52;

  doc.fillColor(GREY).font("Helvetica").fontSize(9).text("DIAGNOSIS", left, y);
  doc.fillColor("#000000").font("Helvetica").fontSize(11).text(rx.diagnosis, left, y + 12, { width });
  y = doc.y + 16;

  // Rx table
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(22).text("Rx", left, y);
  y += 30;
  const cols = [
    { t: "#", x: left, w: 24 },
    { t: "Medicine", x: left + 24, w: 190 },
    { t: "Dosage", x: left + 214, w: 90 },
    { t: "Frequency", x: left + 304, w: 110 },
    { t: "Duration", x: left + 414, w: width - 414 },
  ];
  const header = (yy) => {
    doc.rect(left, yy, width, 20).fill(NAVY);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    cols.forEach((c) => doc.text(c.t, c.x + 4, yy + 5, { width: c.w - 6 }));
    return yy + 20;
  };
  y = header(y);
  rx.medicines.forEach((m, i) => {
    const cells = [String(i + 1), m.name, m.dosage || "-", m.frequency || "-", m.duration || "-"];
    doc.font("Helvetica").fontSize(10);
    const h = Math.max(...cells.map((t, j) => doc.heightOfString(t, { width: cols[j].w - 6 }))) + 10;
    if (y + h > doc.page.height - 130) { doc.addPage(); y = header(50); }
    if (i % 2 === 1) doc.rect(left, y, width, h).fill("#f1f4f9");
    doc.fillColor("#000000").font("Helvetica").fontSize(10);
    cells.forEach((t, j) => doc.text(t, cols[j].x + 4, y + 5, { width: cols[j].w - 6 }));
    y += h;
  });
  doc.moveTo(left, y).lineTo(left + width, y).strokeColor("#cccccc").stroke();
  y += 16;

  if (rx.advice) {
    if (y > doc.page.height - 190) { doc.addPage(); y = 50; }
    doc.fillColor(GREY).font("Helvetica").fontSize(9).text("ADVICE", left, y);
    doc.fillColor("#000000").fontSize(11).text(rx.advice, left, y + 12, { width });
    y = doc.y + 12;
  }
  if (rx.followUpDate) {
    if (y > doc.page.height - 160) { doc.addPage(); y = 50; }
    doc.fillColor(GREY).font("Helvetica").fontSize(9).text("FOLLOW-UP", left, y);
    doc.fillColor("#000000").fontSize(11).text(prettyDate(rx.followUpDate), left, y + 12);
    y = doc.y + 12;
  }

  // signature
  if (y > doc.page.height - 150) { doc.addPage(); y = 50; }
  const sy = Math.max(y + 30, doc.page.height - 190);
  doc.moveTo(left + width - 170, sy).lineTo(left + width, sy).strokeColor("#000000").stroke();
  doc.fillColor("#000000").font("Helvetica-Bold").fontSize(11).text(`Dr. ${doctor.name}`, left + width - 170, sy + 6, { width: 170, align: "center" });
  doc.font("Helvetica").fontSize(9).fillColor(GREY).text(doctor.specialization || "", left + width - 170, sy + 21, { width: 170, align: "center" });

  doc.font("Helvetica").fontSize(8).fillColor(GREY)
    .text("This prescription was created electronically through the hospital portal. Take medicines only as advised by your doctor.", left, doc.page.height - 60, { width, align: "center", lineBreak: false });
  doc.end();
}
