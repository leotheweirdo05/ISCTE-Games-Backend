import express from "express";
import {register} from "../controllers/registerController.js";
import {login} from "../controllers/loginController.js";
import {logout} from "../controllers/logoutController.js";
import {forgotPassword} from "../controllers/forgotPasswordController.js";

const router = express.Router();

// Rota de registro
router.post("/register", register);

// Rota de login
router.post("/login", login);

// Rota de logout
router.post("/logout", logout);

// Rota de recuperação de senha
router.post("/forgot-password", forgotPassword);

export default router;
