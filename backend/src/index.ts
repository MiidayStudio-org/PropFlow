import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import { apiRouter } from "./routes/api";
import { runMaharashtraScraper } from "../scripts/scrape-maharashtra";
import { ensureDefaultAgencyAndAdmin } from "./lib/auth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// Security Headers Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Enable CORS with trusted origins & credentials
const allowedOrigins = [
  FRONTEND_ORIGIN,
  FRONTEND_ORIGIN.replace(/\/+$/, ""),
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in development for local testing
      }
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// Mount the API Router
app.use("/api", apiRouter);

// Health Check Endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "PropFlow Real Estate Operating System API",
    version: "2.0.0",
  });
});

// Optional Cron Job for automated periodic scraping (every 6 hours)
if (process.env.ENABLE_SCRAPE_CRON === "true") {
  console.log("⏰ [Cron] ENABLE_SCRAPE_CRON is enabled. Scheduling scrape every 6 hours.");
  cron.schedule("0 */6 * * *", async () => {
    console.log("⏰ [Cron] Triggering scheduled Maharashtra real estate scrape...");
    try {
      await runMaharashtraScraper();
      console.log("⏰ [Cron] Scheduled scrape finished successfully.");
    } catch (err) {
      console.error("❌ [Cron] Error during scheduled scrape:", err);
    }
  });
} else {
  console.log("ℹ️ [Cron] ENABLE_SCRAPE_CRON is off (default). Periodic scraping disabled.");
}

// Start Express Server
const server = app.listen(PORT, async () => {
  console.log("==================================================");
  console.log(`🚀 PropFlow Backend API server running on port ${PORT}`);
  console.log(`🌐 Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`📊 Stats endpoint:  http://localhost:${PORT}/api/stats`);
  console.log(`🏢 Properties API:  http://localhost:${PORT}/api/properties`);
  console.log("==================================================");

  // Initialize Agency & Default Admin in real PostgreSQL
  await ensureDefaultAgencyAndAdmin();
});

export default app;
