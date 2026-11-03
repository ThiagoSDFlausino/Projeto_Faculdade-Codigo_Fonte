import express, { Router } from "express";
import { createUsuarioRouter } from "../modules/ManterUsuario/Equipes/Controller/UsuarioController.js";
import { createClienteRouter } from "../modules/ManterUsuario/Clientes/Controller/ClienteController.js";
import { createProcedimentoRouter } from "../modules/ManterProcedimento/Controller/ProcedimentoController.js";
import { createAgendaRouter } from "../modules/ManterAgendamento/Controller/AgendaController.js";
import { createLancamentoRouter } from "../modules/ManterFinanceiro/Lancamentos/Controller/LancamentoController.js";
import { createFluxoRouter } from "../modules/ManterFinanceiro/FluxoCaixa/Controller/FluxoController.js";
import { createFechamentoRouter } from "../modules/ManterFinanceiro/Fechamento/Controller/FechamentoController.js";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dashboardRoutes from "./routes/dashboard.js";
import {
  apiRateLimit,
  assertSecureConfig,
  isAllowedOrigin,
  isProduction,
} from "./security.js";

/** Cria o app Express (sem listen) — usado por index e pelos testes. */
export function createApp({ skipSecureAssert = false } = {}) {
  if (!skipSecureAssert) assertSecureConfig();

  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", process.env.TRUST_PROXY === "1" ? 1 : false);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }));

  if (process.env.NODE_ENV !== "test") {
    app.use(morgan(isProduction() ? "combined" : "dev"));
  }

  app.use(cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "6mb" }));
  app.use("/api", apiRateLimit);

  app.get("/api/health", (_req, res) => res.json({
    ok: true,
    stack: "node",
    db: process.env.DATABASE_MODE || "sqlite",
  }));

  app.use("/api", createUsuarioRouter(Router));
  app.use("/api", createClienteRouter(Router));
  app.use("/api", createProcedimentoRouter(Router));
  app.use("/api", createAgendaRouter(Router));
  app.use("/api", createLancamentoRouter(Router));
  app.use("/api", createFluxoRouter(Router));
  app.use("/api", createFechamentoRouter(Router));
  app.use("/api", dashboardRoutes);

  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    const detail = status >= 500 && isProduction()
      ? "Erro interno"
      : (err.detail || err.message || "Erro interno");
    if (status >= 500 && process.env.NODE_ENV !== "test") console.error(err);
    res.status(status).json({ detail });
  });

  return app;
}
