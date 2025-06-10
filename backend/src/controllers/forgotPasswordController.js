import User from "../models/User.js";
import crypto from "crypto";

// Forgot Password Controller
export const forgotPassword = async (req, res) => {
  try {
    let {email} = req.body;
    if (!email) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "Email or student number is required",
        });
    }
    email = email.trim().toLowerCase();

    // Accept student number as email
    let user = await User.findOne({email});
    if (!user && /^\d{8}$/.test(email)) {
      user = await User.findOne({email: email + "@iscte-iul.pt"});
    }

    if (user) {
      // Generate token
      const token = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send email
      const resetUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3001"
      }/reset-password/${token}`;
      try {
        await sendResetPasswordEmail(user.email, resetUrl);
      } catch (e) {
        console.error("Failed to send reset email:", e);
      }
    }
    // Always respond with generic message
    res.json({
      status: "success",
      message: "If your account exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({status: "error", message: error.message});
  }
};

// Helper to send reset email
export async function sendResetPasswordEmail(email, resetUrl) {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Password Reset Request",
    text: `You requested a password reset. Click the link to reset your password: ${resetUrl}\nIf you did not request this, please ignore this email.`,
  };
  await transporter.sendMail(mailOptions);
}
