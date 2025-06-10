import nodemailer from "nodemailer";

export async function sendLocationAlert(email, locationInfo) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "New Login Detected",
    text: `A login to your account was detected from a new location: ${locationInfo.city}, ${locationInfo.country} (IP: ${locationInfo.ip}). If this wasn't you, please secure your account.`,
  };
  await transporter.sendMail(mailOptions);
}
