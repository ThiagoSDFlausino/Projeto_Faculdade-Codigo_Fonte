import { auth } from "../../../../src/auth.js";
import { PerfilUsuario } from "../../../ManterUsuario/Enum/PerfilUsuario.js";
import { FechamentoService } from "../Service/FechamentoService.js";

export function createFechamentoRouter(Router) {
  const router = Router();
  const admin = [PerfilUsuario.ADMIN];

  router.get("/fechamentos", auth(admin), async (_req, res, next) => {
    try { res.json(await FechamentoService.listar()); }
    catch (e) { next(e); }
  });
  router.get("/fechamentos/preview", auth(admin), async (req, res, next) => {
    try { res.json(await FechamentoService.preview(req.query.periodo_inicio, req.query.periodo_fim)); }
    catch (e) { next(e); }
  });
  router.post("/fechamentos", auth(admin), async (req, res, next) => {
    try { res.json(await FechamentoService.criar(req.user, req.body || {})); }
    catch (e) { next(e); }
  });
  router.get("/fechamentos/:fid", auth(admin), async (req, res, next) => {
    try { res.json(await FechamentoService.obter(req.params.fid)); }
    catch (e) { next(e); }
  });
  router.delete("/fechamentos/:fid", auth(admin), async (req, res, next) => {
    try { res.json(await FechamentoService.remover(req.params.fid)); }
    catch (e) { next(e); }
  });

  return router;
}
