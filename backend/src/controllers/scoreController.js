import Score from "../models/Score.js";
import User from "../models/User.js";

// Submit a new score
export const submitScore = async (req, res) => {
  try {
    // Get user from authentication middleware
    const userId = req.user && req.user.id;
    const {score, game} = req.body;
    if (!userId || typeof score !== "number" || !game) {
      return res
        .status(400)
        .json({message: "Authenticated user, score, and game are required."});
    }
    const newScore = new Score({user: userId, score, game});
    await newScore.save();
    res.status(201).json({message: "Score submitted successfully."});
  } catch (err) {
    res.status(500).json({message: "Server error", error: err.message});
  }
};

// Get leaderboard (top 3 high scores per game)
export const getLeaderboard = async (req, res) => {
  try {
    const {game} = req.query;
    if (!game) {
      return res.status(400).json({message: "Game is required in query."});
    }
    // Top 3 scores for the specified game
    const scores = await Score.find({game})
      .sort({score: -1, createdAt: 1})
      .limit(3)
      .populate("user", "name email");
    res.json(scores);
  } catch (err) {
    res.status(500).json({message: "Server error", error: err.message});
  }
};

// Get all high scores for a user (optionally filtered by game)
export const getUserScores = async (req, res) => {
  try {
    const {userId, game} = req.query;
    if (!userId) {
      return res.status(400).json({message: "userId is required in query."});
    }
    let filter = {user: userId};
    if (game) {
      filter.game = game;
    }
    const scores = await Score.find(filter).sort({score: -1, createdAt: 1});
    res.json(scores);
  } catch (err) {
    res.status(500).json({message: "Server error", error: err.message});
  }
};
