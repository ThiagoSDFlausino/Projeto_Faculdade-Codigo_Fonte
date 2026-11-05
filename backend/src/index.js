import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import { connectDb } from "./db.js";
import { seed } from "./seed.js";
import { createApp } from "./app.js";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || "0.0.0.0";

const boot = express();
let state = { ready: false, error: null };

boot.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    stack: "node",
    db: process.env.DATABASE_MODE || "sqlite",
    ready: state.ready,
    error: state.error,
  });
});

boot.listen(port, host, () => {
  console.log(`[boot] listening on ${host}:${port} — iniciando DB…`);
  void (async () => {
    try {
      await connectDb();
      console.log("[boot] DB ok");
      await seed();
      console.log("[boot] seed ok");
      const app = createApp();
      boot.use((req, res, next) => app(req, res, next));
      state.ready = true;
      console.log("[boot] app pronta");
    } catch (err) {
      state.error = err?.message || String(err);
      console.error("[boot] falha fatal:", err);
    }
  })();
});
