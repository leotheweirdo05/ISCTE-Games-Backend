import express from "express";
import {register, login} from "../controllers/authController.js";
import {forgotPassword} from "../controllers/forgotPasswordController.js";

const router = express.Router();

// Rota de registro
router.post("/register", register);

// Rota de login
router.post("/login", login);

// Rota de recuperação de senha
router.post("/forgot-password", forgotPassword);

export default router;
