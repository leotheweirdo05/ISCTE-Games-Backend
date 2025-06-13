import mongoose from "mongoose";

const ScoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  game: {
    type: String,
    enum: ["game1", "game2", "game3", "game4"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Score", ScoreSchema);
