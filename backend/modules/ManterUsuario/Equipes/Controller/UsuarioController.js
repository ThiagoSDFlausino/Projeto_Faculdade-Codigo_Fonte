import { auth } from "../../../../src/auth.js";
import { authRateLimit } from "../../../../src/security.js";
import { PerfilUsuario } from "../Enum/PerfilUsuario.js";
import { UsuarioService } from "../Service/UsuarioService.js";

export function createUsuarioRouter(Router) {
  const router = Router();

  router.post("/auth/register", authRateLimit, async (req, res, next) => {
    try {
      res.json(await UsuarioService.register(req.body || {}));
    } catch (e) { next(e); }
  });

  router.post("/auth/login", authRateLimit, async (req, res, next) => {
    try {
      res.json(await UsuarioService.login(req.body?.email, req.body?.password));
    } catch (e) { next(e); }
  });

  router.get("/auth/me", auth(), async (req, res) => res.json(req.user));

  router.get("/staff", auth([PerfilUsuario.ADMIN]), async (_req, res, next) => {
    try {
      res.json(await UsuarioService.listarEquipe());
    } catch (e) { next(e); }
  });

  router.get("/professionals", auth(), async (_req, res, next) => {
    try {
      res.json(await UsuarioService.listarProfissionais());
    } catch (e) { next(e); }
  });

  router.post("/staff", auth([PerfilUsuario.ADMIN]), async (req, res, next) => {
    try {
      res.json(await UsuarioService.criarMembro(req.body || {}));
    } catch (e) { next(e); }
  });

  router.put("/staff/:staffId", auth([PerfilUsuario.ADMIN]), async (req, res, next) => {
    try {
      res.json(await UsuarioService.atualizarMembro(req.params.staffId, req.body || {}));
    } catch (e) { next(e); }
  });

  router.delete("/staff/:staffId", auth([PerfilUsuario.ADMIN]), async (req, res, next) => {
    try {
      res.json(await UsuarioService.removerMembro(req.params.staffId, req.user.id));
    } catch (e) { next(e); }
  });

  return router;
}
