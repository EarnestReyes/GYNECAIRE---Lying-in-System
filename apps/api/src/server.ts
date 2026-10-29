import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173"],
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/v1/health", (_req, res) => {
  res.json({
    status: "ok",
    application: "GYNECAIRE API",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`GYNECAIRE API running on http://localhost:${PORT}`);
});
