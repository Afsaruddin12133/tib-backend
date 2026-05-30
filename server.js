const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from .env in project root.
// Keep secrets (API keys, DB URIs) out of source control.
dotenv.config({ path: path.resolve(__dirname, ".env") });

const connectDB = require("./config/db");
const sessionRoutes = require("./routes/sessionRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
const port = process.env.PORT || 5000;

// Frontend origin allowed for CORS. Normalize it so a trailing slash does not break strict CORS checks.
const frontendOrigin = (process.env.FRONTEND_ORIGIN || "http://localhost:5173").replace(/\/+$/, "");

// Basic middleware: CORS and body parsing.
// Note: the `origin` should be strict in production (do not use '*').
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);

// Limit JSON body size to avoid large payload attacks.
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "teach-it-back-backend",
  });
});

// Routes
app.use("/api/session", sessionRoutes);

// 404 and generic error handler (keeps responses consistent across the API)
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB(process.env.MONGODB_URI);
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    // Log the error message for diagnostics, but avoid printing sensitive values.
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
