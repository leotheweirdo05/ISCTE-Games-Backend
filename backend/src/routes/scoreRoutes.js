import express from "express";
import {
  submitScore,
  getLeaderboard,
  getUserScores,
} from "../controllers/scoreController.js";
import {authenticate} from "../middleware/authenticate.js";

const router = express.Router();

// Route to submit a new score (protected)
router.post("/submit", authenticate, submitScore);

// Route to get the leaderboard
router.get("/leaderboard", getLeaderboard);

// Route to get all high scores for a user
router.get("/user-scores", getUserScores);

export default router;
