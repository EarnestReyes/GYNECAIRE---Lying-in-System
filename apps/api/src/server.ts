
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import staffRoutes from "./routes/staff.js";
import accountRoutes from "./routes/account.js";
import verificationReviewRoutes from "./routes/verification-review.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Security middleware
app.use(helmet());

app.use(
  cors({
    origin: (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:8081").split(",").map(value => value.trim()),
  })
);

// Parse incoming JSON requests
app.use(express.json({ limit: "1mb" }));

// Public health check
app.get("/api/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    application: "GYNECAIRE API",
    timestamp: new Date().toISOString(),
  });
});

// Protected staff routes
app.use("/api/v1/staff", staffRoutes);
app.use("/api/v1/account", accountRoutes);
app.use("/api/v1/staff/verifications", verificationReviewRoutes);

// Start API server
app.listen(PORT, () => {
  console.log(`GYNECAIRE API running on http://localhost:${PORT}`);
});
