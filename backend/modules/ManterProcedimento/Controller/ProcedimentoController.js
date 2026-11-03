import { auth } from "../../../src/auth.js";
import { PerfilUsuario } from "../../ManterUsuario/Equipes/Enum/PerfilUsuario.js";
import { ProcedimentoService } from "../Service/ProcedimentoService.js";

export function createProcedimentoRouter(Router) {
  const router = Router();

  router.get("/procedures", auth(), async (_req, res, next) => {
    try {
      res.json(await ProcedimentoService.listar());
    } catch (e) { next(e); }
  });

  router.get("/procedures/stats", auth([PerfilUsuario.ADMIN]), async (req, res, next) => {
    try {
      res.json(await ProcedimentoService.estatisticas(req.query || {}));
    } catch (e) { next(e); }
  });

  router.post("/procedures", auth([PerfilUsuario.ADMIN]), async (req, res, next) => {
    try {
      res.json(await ProcedimentoService.criar(req.body || {}));
    } catch (e) { next(e); }
  });

  router.put("/procedures/:pid", auth([PerfilUsuario.ADMIN]), async (req, res, next) => {
    try {
      res.json(await ProcedimentoService.atualizar(req.params.pid, req.body || {}));
    } catch (e) { next(e); }
  });

  router.delete("/procedures/:pid", auth([PerfilUsuario.ADMIN]), async (req, res, next) => {
    try {
      res.json(await ProcedimentoService.remover(req.params.pid));
    } catch (e) { next(e); }
  });

  return router;
}
