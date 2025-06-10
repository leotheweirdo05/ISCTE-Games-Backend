import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {getCurrentLocation, isNewLocation} from "../utils/locationUtils.js";
import {sendLocationAlert} from "../utils/emailUtils.js";

// Registrar novo usuário
export const register = async (req, res) => {
  try {
    let {name, email, password, tipo} = req.body;

    if (!name || !email || !password || !tipo) {
      return res
        .status(400)
        .json({status: "error", message: "All fields are required"});
    }

    // Normalize email
    email = email.trim().toLowerCase();

    // Password policy: at least 8 chars, 1 number, 1 letter
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        status: "error",
        message:
          "Password must be at least 8 characters long and contain at least one letter and one number.",
      });
    }

    // Email must be isctie-iul.pt or student number
    const isIscteEmail = email.endsWith("@iscte-iul.pt");
    const isStudentNumber =
      /^\d{8}@iscte-iul.pt$/.test(email) || /^\d{8}$/.test(email);
    if (!isIscteEmail && !isStudentNumber) {
      return res.status(400).json({
        status: "error",
        message:
          "Email must be an @iscte-iul.pt address or a valid student number (optionally with @iscte-iul.pt)",
      });
    }

    const userExists = await User.findOne({email});
    if (userExists) {
      return res
        .status(400)
        .json({status: "error", message: "Email already exists"});
    }

    // Hashing is handled by the User model pre-save hook, so just pass the plain password
    const user = await User.create({
      name,
      email,
      password,
      tipo,
    });

    // Placeholder for email verification logic
    // sendVerificationEmail(user.email);

    user.password = undefined;
    console.log(`User registered: ${email}`);
    res.status(201).json({status: "success", user});
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({status: "error", message: error.message});
  }
};

// Helper: Track failed login attempts (in-memory, for demo)
const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

// Login do usuário
export const login = async (req, res) => {
  try {
    let {email, password} = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({status: "error", message: "Email and password are required"});
    }
    email = email.trim().toLowerCase();

    // Email must be isctie-iul.pt or student number (8 digits)
    const isIscteEmail = email.endsWith("@iscte-iul.pt");
    const isStudentNumber =
      /^\d{8}@iscte-iul.pt$/.test(email) || /^\d{8}$/.test(email);
    if (!isIscteEmail && !isStudentNumber) {
      return res.status(400).json({
        status: "error",
        message:
          "Email must be an @iscte-iul.pt address or a valid student number (optionally with @iscte-iul.pt)",
      });
    }

    // Check lockout
    const now = Date.now();
    if (loginAttempts[email] && loginAttempts[email].lockedUntil > now) {
      return res.status(403).json({
        status: "error",
        message: `Account locked. Try again after ${new Date(
          loginAttempts[email].lockedUntil
        ).toLocaleTimeString()}`,
      });
    }

    const user = await User.findOne({email}).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({status: "error", message: "Invalid email or password"});
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Track failed attempts
      if (!loginAttempts[email])
        loginAttempts[email] = {count: 0, lockedUntil: 0};
      loginAttempts[email].count++;
      if (loginAttempts[email].count >= MAX_ATTEMPTS) {
        loginAttempts[email].lockedUntil = now + LOCK_TIME;
        loginAttempts[email].count = 0;
      }
      console.warn(`Failed login for ${email}`);
      return res
        .status(401)
        .json({status: "error", message: "Invalid email or password"});
    }
    // Reset attempts on success
    if (loginAttempts[email]) loginAttempts[email] = {count: 0, lockedUntil: 0};

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        status: "error",
        message: "JWT secret is not set in environment variables",
      });
    }

    const token = jwt.sign(
      {id: user._id, tipo: user.tipo},
      process.env.JWT_SECRET,
      {expiresIn: "1h"}
    );

    const {password: pwd, ...userData} = user.toObject();
    console.log(`User logged in: ${email}`);

    // Get and compare location using utility
    const currentLocation = getCurrentLocation(req);
    let sendAlert = isNewLocation(user.lastLoginLocation, currentLocation);
    user.lastLoginLocation = currentLocation;
    await user.save();
    if (sendAlert) {
      try {
        await sendLocationAlert(user.email, currentLocation);
      } catch (e) {
        console.error("Failed to send location alert:", e);
      }
    }

    res.json({status: "success", token, user: userData});
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({status: "error", message: error.message});
  }
};
