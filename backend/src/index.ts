import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from "node-cron";
import { apiRouter } from "./routes/api";
import { runMaharashtraScraper } from "../scripts/scrape-maharashtra";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// Enable CORS & Middleware
app.use(
  cors({
    origin: [FRONTEND_ORIGIN, "http://localhost:3000", "*"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());

// Mount the API Router
app.use("/api", apiRouter);

// Health Check Endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "PropFlow Real Estate Operating System API",
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
app.listen(PORT, () => {
  console.log("==================================================");
  console.log(`🚀 PropFlow Backend API server running on port ${PORT}`);
  console.log(`🌐 Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`📊 Stats endpoint:  http://localhost:${PORT}/api/stats`);
  console.log(`🏢 Properties API:  http://localhost:${PORT}/api/properties`);
  console.log("==================================================");
});

export default app;
