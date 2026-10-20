import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { todayInClinic } from "../utils/clinicDate.js";
import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// backend/src/controllers -> project root -> reports/generate_report.py
const REPORT_SCRIPT = path.resolve(__dirname, "../../../reports/generate_report.py");

const STATUSES = ["booked", "waiting", "in-consultation", "completed", "no-show", "cancelled"];

const loadAll = () =>
  Appointment.find({}).populate("doctor", "name specialization").populate("patient", "name email");

// @route  GET /api/admin/stats
// @access Private/Admin
export const getStats = async (req, res) => {
  try {
    const [appts, doctors, patients] = await Promise.all([
      loadAll(),
      User.countDocuments({ role: "doctor" }),
      User.countDocuments({ role: "patient" }),
    ]);
    const today = todayInClinic();

    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    const byMode = { online: 0, "in-person": 0 };
    const doctorMap = new Map();

    for (const a of appts) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      byMode[a.mode] = (byMode[a.mode] || 0) + 1;
      const key = String(a.doctor?._id || a.doctor);
      if (!doctorMap.has(key)) {
        doctorMap.set(key, {
          doctorId: key,
          name: a.doctor?.name || "Unknown",
          specialization: a.doctor?.specialization || "",
          total: 0, completed: 0, noShow: 0, cancelled: 0,
        });
      }
      const d = doctorMap.get(key);
      d.total += 1;
      if (a.status === "completed") d.completed += 1;
      if (a.status === "no-show") d.noShow += 1;
      if (a.status === "cancelled") d.cancelled += 1;
    }

    // Last 14 days (clinic dates), oldest first, zero-filled
    const perDay = [];
    for (let i = 13; i >= 0; i--) {
      const date = todayInClinic(new Date(Date.now() - i * 86400000));
      const day = appts.filter((a) => a.date === date);
      perDay.push({
        date,
        total: day.filter((a) => a.status !== "cancelled").length,
        completed: day.filter((a) => a.status === "completed").length,
      });
    }

    const seen = byStatus.completed + byStatus["no-show"];
    res.json({
      today,
      totals: {
        appointments: appts.length,
        doctors,
        patients,
        today: appts.filter((a) => a.date === today && a.status !== "cancelled").length,
        // share of finished visits where the patient actually turned up
        attendanceRate: seen ? Math.round((byStatus.completed / seen) * 100) : null,
        cancellationRate: appts.length ? Math.round((byStatus.cancelled / appts.length) * 100) : null,
      },
      byStatus,
      byMode,
      byDoctor: [...doctorMap.values()].sort((a, b) => b.total - a.total),
      perDay,
    });
  } catch (error) {
    res.status(500).json({ message: "Could not load stats", error: error.message });
  }
};

const buildRows = async (from, to) => {
  const appts = await loadAll();
  return appts
    .filter((a) => (!from || a.date >= from) && (!to || a.date <= to))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .map((a) => ({
      date: a.date,
      startTime: a.startTime,
      queueNumber: a.queueNumber,
      status: a.status,
      mode: a.mode,
      doctor: a.doctor?.name || "",
      specialization: a.doctor?.specialization || "",
      patient: a.patient?.name || "",
      patientEmail: a.patient?.email || "",
    }));
};

// @route  GET /api/admin/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD
// @access Private/Admin
// Flat rows, used by the CSV download and the Python report script.
export const getAppointmentRows = async (req, res) => {
  try {
    res.json(await buildRows(req.query.from, req.query.to));
  } catch (error) {
    res.status(500).json({ message: "Could not load appointments", error: error.message });
  }
};

// Runs the Python script with the given args; resolves on exit code 0.
const runPython = (bin, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(bin, args, { windowsHide: true });
    let stderr = "";
    const timer = setTimeout(() => { child.kill(); reject(new Error("The report took too long (over 60 seconds).")); }, 60000);
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (err) => { clearTimeout(timer); reject(err); });
    child.on("close", (code) => {
      clearTimeout(timer);
      code === 0 ? resolve() : reject(new Error(stderr.trim().split("\n").pop() || `Python exited with code ${code}`));
    });
  });

// @route  GET /api/admin/report?from=&to=
// @access Private/Admin
// Builds the PDF with reports/generate_report.py (needs Python + matplotlib on the server).
export const downloadReport = async (req, res) => {
  const { from, to } = req.query;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const jsonFile = path.join(os.tmpdir(), `clinic-rows-${id}.json`);
  const pdfFile = path.join(os.tmpdir(), `clinic-report-${id}.pdf`);
  try {
    if (!fs.existsSync(REPORT_SCRIPT)) {
      return res.status(500).json({ message: "reports/generate_report.py was not found. Keep the 'reports' folder in the project root." });
    }
    fs.writeFileSync(jsonFile, JSON.stringify(await buildRows(from, to)));

    const args = [REPORT_SCRIPT, "--input", jsonFile, "--out", pdfFile];
    if (from) args.push("--from", from);
    if (to) args.push("--to", to);

    // PYTHON_BIN in .env wins; otherwise try the usual names for each OS
    const candidates = process.env.PYTHON_BIN ? [process.env.PYTHON_BIN] : process.platform === "win32" ? ["python", "py"] : ["python3", "python"];
    let lastError;
    let ok = false;
    for (const bin of candidates) {
      try {
        await runPython(bin, args);
        ok = true;
        break;
      } catch (err) {
        lastError = err;
        if (err.code !== "ENOENT") break; // Python exists but the script failed: don't retry
      }
    }
    if (!ok) {
      const missing = lastError?.code === "ENOENT";
      return res.status(500).json({
        message: missing
          ? "Python was not found on the server. Install Python 3, then run: pip install -r reports/requirements.txt (or set PYTHON_BIN in backend/.env)."
          : `Could not build the report: ${lastError?.message}. If it mentions matplotlib, run: pip install -r reports/requirements.txt`,
      });
    }

    const pdf = fs.readFileSync(pdfFile);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="clinic-report-${todayInClinic()}.pdf"`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ message: "Could not build the report", error: error.message });
  } finally {
    fs.rm(jsonFile, { force: true }, () => {});
    fs.rm(pdfFile, { force: true }, () => {});
  }
};
