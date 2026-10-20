// Creates TEST accounts and doctor schedules so you can try every feature quickly.
//
// Run it from the backend folder:
//     node src/seed.js
//
// Safe to run more than once: anything that already exists is skipped, never overwritten.
// These accounts have well-known passwords. They are for local testing only —
// delete them (or use a fresh database) before you ever deploy.

import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";
import Availability from "./models/Availability.js";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed test accounts when NODE_ENV=production.");
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not set. Run this from the backend folder so it can read backend/.env");
  process.exit(1);
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// NOTE: doctor names have no "Dr." prefix — the app adds "Dr." itself in most places.
const ACCOUNTS = [
  { name: "Test Admin", email: "admin@clinic.test", password: "Admin@123", role: "admin" },
  {
    name: "Meera Sharma",
    email: "meera.sharma@clinic.test",
    password: "Doctor@123",
    role: "doctor",
    specialization: "Cardiology",
    bio: "Heart specialist focused on preventive care.",
    experienceYears: 12,
    consultationFee: 800,
    roomNumber: "204",
  },
  {
    name: "Arjun Rao",
    email: "arjun.rao@clinic.test",
    password: "Doctor@123",
    role: "doctor",
    specialization: "Dermatology",
    bio: "Skin and hair specialist.",
    experienceYears: 8,
    consultationFee: 600,
    roomNumber: "108",
  },
  { name: "Test Patient One", email: "patient1@clinic.test", password: "Patient@123", role: "patient" },
  { name: "Test Patient Two", email: "patient2@clinic.test", password: "Patient@123", role: "patient" },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to the database.\n");

  for (const account of ACCOUNTS) {
    let user = await User.findOne({ email: account.email });
    if (user) {
      console.log(`skipped   ${account.role.padEnd(7)} ${account.email} (already exists)`);
    } else {
      user = await User.create(account); // the User model hashes the password
      console.log(`created   ${account.role.padEnd(7)} ${account.email}`);
    }

    if (account.role === "doctor") {
      const existing = await Availability.findOne({ doctor: user._id });
      if (existing) {
        console.log(`          schedule for ${account.name} already exists, left as is`);
      } else {
        await Availability.create({
          doctor: user._id,
          slotDurationMinutes: 15,
          // Every day ON, 10:00-14:00, so there are slots for "today" whatever day you test on
          schedule: DAYS.map((day) => ({ day, isOff: false, startTime: "10:00", endTime: "14:00" })),
        });
        console.log(`          schedule created: every day 10:00-14:00, 15-minute slots`);
      }
    }
  }

  console.log("\nTest logins (local testing only):");
  console.log("  admin    admin@clinic.test          Admin@123");
  console.log("  doctor   meera.sharma@clinic.test   Doctor@123   (Cardiology, room 204)");
  console.log("  doctor   arjun.rao@clinic.test      Doctor@123   (Dermatology, room 108)");
  console.log("  patient  patient1@clinic.test       Patient@123");
  console.log("  patient  patient2@clinic.test       Patient@123");

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("\nSeeding failed:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
