const mongoose = require("mongoose");

// A single 'round' represents one user reply and the AI evaluation for it.
const roundSchema = new mongoose.Schema(
  {
    userText: {
      type: String,
      trim: true,
      default: "",
    },
    score: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    gaps: {
      type: [String],
      default: [],
    },
    followUp: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

// Session document tracks the topic, rounds of interaction and final score.
const sessionSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    rounds: {
      type: [roundSchema],
      default: [],
    },
    finalScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    status: {
      type: String,
      enum: ["active", "mastered", "partial", "completed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Session", sessionSchema);
