// JWT authentication middleware for Express
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({message: "No token provided"});
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user info to req.user
    req.user = {id: decoded.id, tipo: decoded.tipo};
    next();
  } catch (err) {
    return res.status(401).json({message: "Invalid or expired token"});
  }
};
