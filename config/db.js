const mongoose = require("mongoose");

// Connect to MongoDB using mongoose. We intentionally keep this small and
// synchronous to the server startup flow so the process exits cleanly on error.
async function connectDB(mongoUri) {
  if (!mongoUri) {
    const error = new Error("MONGODB_URI is required.");
    error.statusCode = 500;
    throw error;
  }

  // Use strictQuery to avoid accidental fuzzy matching in queries.
  mongoose.set("strictQuery", true);

  // Keep connection options minimal here; tune timeouts and pooling in prod.
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log("Database successfully connected.");
}

module.exports = connectDB;
