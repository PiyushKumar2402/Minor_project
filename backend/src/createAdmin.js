// Creates a REAL admin account (the registration page only creates patients).
//
// Run from the backend folder:
//     node src/createAdmin.js "Your Name" you@gmail.com "YourStrongPassword"
//
// Refuses to overwrite an existing account.

import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error('Usage: node src/createAdmin.js "Your Name" you@gmail.com "YourStrongPassword"');
  process.exit(1);
}
if (password.length < 8) {
  console.error("Use a password of at least 8 characters.");
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is not set. Run this from the backend folder so it can read backend/.env");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error(`An account with ${email} already exists (role: ${existing.role}). Nothing changed.`);
  } else {
    await User.create({ name, email: email.toLowerCase(), password, role: "admin" });
    console.log(`Admin created: ${email}`);
  }
} catch (error) {
  console.error("Failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
