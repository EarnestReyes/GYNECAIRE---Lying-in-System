
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { apiErrorHandler } from './middleware/error-handler.js';
import staffRoutes from "./routes/staff.js";
import accountRoutes from "./routes/account.js";
import verificationReviewRoutes from "./routes/verification-review.js";
import portalRoutes from "./routes/portal.js";
import { createImportRouter, purgeExpiredImports } from './imports/router.js';
import { pool } from './config/database.js';
import { purgeAvatarObjects } from './routes/profile-avatar.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Security middleware
app.use(helmet());

app.use(
  cors({
    origin: (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:8081").split(",").map(value => value.trim()),
  })
);

// Import bodies are parsed only after authentication/admin checks, with sanitized errors.
app.use('/api/v1/staff/imports', createImportRouter(pool));

// Parse incoming JSON requests for the remaining modules.
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
app.use("/api/v1/staff", portalRoutes);
app.use("/api/v1/account", accountRoutes);
app.use("/api/v1/staff/verifications", verificationReviewRoutes);
app.use(apiErrorHandler);

// Also schedule this cleanup externally if the API can sleep. Never logs patient data.
if (process.env.IMPORTS_ENABLED === 'true' || process.env.IMPORT_RETENTION_ENABLED === 'true') {
  const cleanup = () => { void purgeExpiredImports(pool).catch(() => console.warn('Import retention cleanup failed; check migration and database permissions.')); };
  cleanup();
  setInterval(cleanup, 15 * 60 * 1000).unref();
}

// Start API server
if(process.env.AVATARS_ENABLED==='true'){
 const cleanup=()=>{void purgeAvatarObjects(pool).then(result=>{if(result?.failed)console.warn('Avatar cleanup will retry failed objects.');}).catch(()=>console.warn('Avatar cleanup unavailable; check storage and schema access.'));};
 cleanup();setInterval(cleanup,15*60*1000).unref();
}
app.listen(PORT, () => {
  console.log(`GYNECAIRE API running on http://localhost:${PORT}`);
});
