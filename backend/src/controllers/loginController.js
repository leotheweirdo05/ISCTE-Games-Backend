import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {getCurrentLocation, isNewLocation} from "../utils/locationUtils.js";
import {sendLocationAlert} from "../utils/emailUtils.js";
import {cookieOptions} from "../utils/cookieOptions.js";

// User login controller
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

    // Find user and select password, failedLoginAttempts, lockUntil
    const user = await User.findOne({email}).select("+password failedLoginAttempts lockUntil");
    if (!user) {
      return res
        .status(401)
        .json({status: "error", message: "Invalid email or password"});
    }

    // Check lockout
    const now = Date.now();
    if (user.lockUntil && user.lockUntil > now) {
      return res.status(403).json({
        status: "error",
        message: `Account locked. Try again after ${new Date(
          user.lockUntil
        ).toLocaleTimeString()}`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = now + LOCK_TIME;
        user.failedLoginAttempts = 0;
      }
      await user.save();
      console.warn(`Failed login for ${email}`);
      return res
        .status(401)
        .json({status: "error", message: "Invalid email or password"});
    }
    // Reset attempts on success
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        status: "error",
        message: "JWT secret is not set in environment variables",
      });
    }

    const token = jwt.sign(
      {id: user._id, tipo: user.tipo},
      process.env.JWT_SECRET,
      {expiresIn: "24h"}
    );

    const {password: pwd, ...userData} = user.toObject();
    console.log(`User logged in: ${email}`);

    // Set JWT as HTTP-only cookie
    res.cookie("token", token, cookieOptions);

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
