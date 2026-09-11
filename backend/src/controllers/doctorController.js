import User from "../models/User.js";

// @route  GET /api/doctors
// @access Public
// Supports ?specialization=Cardiology to filter
export const getDoctors = async (req, res) => {
  try {
    const filter = { role: "doctor", isActive: true };
    if (req.query.specialization) {
      filter.specialization = req.query.specialization;
    }

    const doctors = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch doctors", error: error.message });
  }
};

// @route  GET /api/doctors/specializations
// @access Public
// Returns the distinct list of specializations currently in use, for the filter dropdown
export const getSpecializations = async (req, res) => {
  try {
    const specializations = await User.distinct("specialization", {
      role: "doctor",
      isActive: true,
      specialization: { $ne: null },
    });
    res.json(specializations);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch specializations", error: error.message });
  }
};

// @route  GET /api/doctors/:id
// @access Public
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: "doctor" }).select("-password");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch doctor", error: error.message });
  }
};

// @route  POST /api/doctors
// @access Private/Admin
// Admin directly creates a doctor account
export const createDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, bio, experienceYears, consultationFee, phone } = req.body;

    if (!name || !email || !password || !specialization) {
      return res.status(400).json({ message: "Name, email, password, and specialization are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const doctor = await User.create({
      name,
      email,
      password,
      role: "doctor",
      specialization,
      bio,
      experienceYears,
      consultationFee,
      phone,
    });

    const { password: _pw, ...doctorData } = doctor.toObject();
    res.status(201).json(doctorData);
  } catch (error) {
    res.status(500).json({ message: "Could not create doctor", error: error.message });
  }
};

// @route  PUT /api/doctors/:id
// @access Private/Admin
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const editableFields = [
      "name",
      "phone",
      "specialization",
      "bio",
      "experienceYears",
      "consultationFee",
      "isActive",
    ];
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        doctor[field] = req.body[field];
      }
    });

    await doctor.save();
    const { password: _pw, ...doctorData } = doctor.toObject();
    res.json(doctorData);
  } catch (error) {
    res.status(500).json({ message: "Could not update doctor", error: error.message });
  }
};

// @route  DELETE /api/doctors/:id
// @access Private/Admin
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: "doctor" });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    await doctor.deleteOne();
    res.json({ message: "Doctor removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Could not remove doctor", error: error.message });
  }
};
