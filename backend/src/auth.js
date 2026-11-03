import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { httpError } from "./utils.js";
import { getJwtExpiresIn, getJwtSecret } from "./security.js";
import { UsuarioRepository } from "../modules/ManterUsuario/Repositories/UsuarioRepository.js";

const JWT_ALG = "HS256";
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

/** Hash dummy para equalizar tempo de login quando o e-mail não existe. */
const DUMMY_HASH = bcrypt.hashSync("timing-dummy-not-a-real-password", 10);

export function hashPassword(password) {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

export function verifyPassword(plain, hashed) {
  return bcrypt.compareSync(plain, hashed || DUMMY_HASH);
}

export function createAccessToken(userId, email) {
  return jwt.sign(
    { sub: userId, email, type: "access" },
    getJwtSecret(),
    { algorithm: JWT_ALG, expiresIn: getJwtExpiresIn() },
  );
}

export async function getCurrentUser(req) {
  let token = null;
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) token = auth.slice(7);
  if (!token && req.cookies?.access_token) token = req.cookies.access_token;
  if (!token) throw httpError(401, "Não autenticado");
  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: [JWT_ALG] });
    const usuario = await UsuarioRepository.findById(payload.sub);
    if (!usuario) throw httpError(401, "Usuário não encontrado");
    if (!usuario.active) throw httpError(401, "Usuário inativo");
    return usuario.toPublic();
  } catch (e) {
    if (e.status) throw e;
    if (e.name === "TokenExpiredError") throw httpError(401, "Sessão expirada");
    throw httpError(401, "Token inválido");
  }
}

export function auth(requiredRoles) {
  return async (req, res, next) => {
    try {
      const user = await getCurrentUser(req);
      if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
        throw httpError(403, "Acesso negado para o seu perfil");
      }
      req.user = user;
      next();
    } catch (e) {
      next(e);
    }
  };
}
