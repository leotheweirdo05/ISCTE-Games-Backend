import User from "../models/User.js";
import jwt from "jsonwebtoken";
import {cookieOptions} from "../utils/cookieOptions.js";

// Registrar novo usuário
export const register = async (req, res) => {
  try {
    let {name, email, password, tipo} = req.body;

    if (!name || !email || !password || !tipo) {
      return res
        .status(400)
        .json({status: "error", message: "All fields are required"});
    }

    // Normalize email and name
    name = name
      .trim()
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ");
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

    // Generate JWT token after registration
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
    user.password = undefined;
    // Set JWT as HTTP-only cookie
    res.cookie("token", token, cookieOptions);
    console.log(`User registered: ${email}`);
    res.status(201).json({status: "success", token, user});
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({status: "error", message: error.message});
  }
};
