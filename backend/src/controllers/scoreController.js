import Score from "../models/Score.js";
import User from "../models/User.js";

// Submit a new score (only keep latest high score per user per game)
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

    // Find the user's current high score for this game
    const existingScore = await Score.findOne({user: userId, game});

    if (existingScore) {
      if (score > existingScore.score) {
        // New score is higher: delete old, save new
        await Score.deleteOne({_id: existingScore._id});
        const newScore = new Score({user: userId, score, game});
        await newScore.save();
        return res.status(201).json({message: "New high score!"});
      } else {
        // New score is not higher: do not save
        return res
          .status(200)
          .json({message: "Score not higher than your current high score."});
      }
    } else {
      // No previous score: save new
      const newScore = new Score({user: userId, score, game});
      await newScore.save();
      return res.status(201).json({message: "Score submitted successfully."});
    }
  } catch (err) {
    res.status(500).json({message: "Server error", error: err.message});
  }
};

// Get leaderboard (top 5 high scores per game, or all scores if all=true)
export const getLeaderboard = async (req, res) => {
  try {
    const {game, all} = req.query;
    if (!game) {
      return res.status(400).json({message: "Game is required in query."});
    }
    let query = Score.find({game}).sort({score: -1, createdAt: 1}).populate("user", "name email");
    if (all !== 'true') {
      query = query.limit(5);
    }
    const scores = await query;
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
