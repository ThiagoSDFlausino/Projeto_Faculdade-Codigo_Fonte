import { auth } from "../../../../src/auth.js";
import { PerfilUsuario } from "../../../ManterUsuario/Enum/PerfilUsuario.js";
import { DespesaService } from "../Service/DespesaService.js";

export function createDespesaRouter(Router) {
  const router = Router();
  const admin = [PerfilUsuario.ADMIN];

  router.get("/transactions", auth(admin), async (_req, res, next) => {
    try { res.json(await DespesaService.listar()); }
    catch (e) { next(e); }
  });
  router.post("/transactions", auth(admin), async (req, res, next) => {
    try { res.json(await DespesaService.criar(req.body || {}, req.user)); }
    catch (e) { next(e); }
  });
  router.put("/transactions/:txId", auth(admin), async (req, res, next) => {
    try { res.json(await DespesaService.atualizar(req.params.txId, req.body || {})); }
    catch (e) { next(e); }
  });
  router.delete("/transactions/:txId", auth(admin), async (req, res, next) => {
    try { res.json(await DespesaService.remover(req.params.txId)); }
    catch (e) { next(e); }
  });

  return router;
}
