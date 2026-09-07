import "./loadEnv";
import express from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";

import { ApiError, errorBody } from "./lib/errors";
import authRoutes from "./routes/auth";
import accountsRoutes from "./routes/accounts";
import portfolioRoutes from "./routes/portfolio";
import recommendationsRoutes from "./routes/recommendations";
import auditLogRoutes from "./routes/auditLog";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/audit-log", auditLogRoutes);

// 404 for anything else under /api
app.use("/api", (_req, res) => {
  res.status(404).json(errorBody("Not found", "NOT_FOUND"));
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json(errorBody(err.message, err.code));
    return;
  }

  console.error(err);
  res.status(500).json(errorBody("Internal server error", "SERVER_ERROR"));
};

app.use(errorHandler);

const port = Number(process.env.API_PORT) || 4000;

app.listen(port, () => {
  console.log(`WealthLens API listening on port ${port}`);
});

export default app;
