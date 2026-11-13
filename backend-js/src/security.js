import rateLimit from "express-rate-limit";

const WEAK_SECRETS = new Set([
  "",
  "bella-dev-secret",
  "bella-dev-secret-change-me",
  "secret",
  "changeme",
  "jwt-secret",
]);

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function assertSecureConfig() {
  const secret = String(process.env.JWT_SECRET || "").trim();
  const weak = !secret || WEAK_SECRETS.has(secret) || secret.length < 24;
  const origins = String(process.env.CORS_ORIGINS || "*").split(",").map((s) => s.trim()).filter(Boolean);
  const corsOpen = origins.includes("*") || origins.length === 0;

  if (isProduction()) {
    if (weak) {
      throw new Error(
        "JWT_SECRET fraco ou ausente. Defina um segredo aleatório (>= 24 caracteres) no .env de produção.",
      );
    }
    if (corsOpen) {
      throw new Error(
        "CORS_ORIGINS não pode ser * em produção. Liste as URLs do frontend (ex.: https://app.sua-clinica.com).",
      );
    }
  } else if (weak) {
    console.warn(
      "[segurança] JWT_SECRET fraco/padrão — ok só em desenvolvimento. Troque antes de publicar.",
    );
  }
  if (!isProduction() && corsOpen) {
    console.warn("[segurança] CORS_ORIGINS=* — qualquer origem pode chamar a API em dev.");
  }
}

export function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || "").trim();
  if (!secret) {
    if (isProduction()) throw new Error("JWT_SECRET obrigatório");
    return "bella-dev-secret-change-me";
  }
  return secret;
}

export function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || (isProduction() ? "12h" : "7d");
}

export function getCorsOrigins() {
  const raw = String(process.env.CORS_ORIGINS || "*");
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function isAllowedOrigin(origin) {
  const origins = getCorsOrigins();
  if (!origin || origins.includes("*") || origins.includes(origin)) return true;
  if (!isProduction() && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}

export function assertPasswordPolicy(password) {
  const p = String(password || "");
  if (p.length < 8) {
    const err = new Error("Senha deve ter no mínimo 8 caracteres");
    err.status = 400;
    err.detail = err.message;
    throw err;
  }
  if (p.length > 128) {
    const err = new Error("Senha muito longa");
    err.status = 400;
    err.detail = err.message;
    throw err;
  }
}

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT || 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: "Muitas tentativas. Aguarde alguns minutos e tente de novo." },
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: "Limite de requisições excedido. Tente novamente em instantes." },
});
