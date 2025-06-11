import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import scoreRoutes from "./routes/scoreRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Conexão com o MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: "majority",
  })
  .then(() => console.log("Conectado ao MongoDB com sucesso!"))
  .catch((err) => {
    console.error("Erro na conexão com MongoDB:", err.message);
    console.error("Stack trace:", err.stack);
  });

// Rota raiz
app.get("/", (req, res) => {
  res.json({
    message: "Bem-vindo à API de autenticação",
    endpoints: {
      register: "POST /api/auth/register",
      login: "POST /api/auth/login",
    },
  });
});

// Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/scores", scoreRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
