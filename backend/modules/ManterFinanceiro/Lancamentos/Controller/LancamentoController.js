import { auth } from "../../../../src/auth.js";
import { PerfilUsuario } from "../../../ManterUsuario/Enum/PerfilUsuario.js";
import { LancamentoService } from "../Service/LancamentoService.js";

export function createLancamentoRouter(Router) {
  const router = Router();
  const admin = [PerfilUsuario.ADMIN];

  router.get("/transactions", auth(admin), async (_req, res, next) => {
    try { res.json(await LancamentoService.listar()); }
    catch (e) { next(e); }
  });
  router.post("/transactions", auth(admin), async (req, res, next) => {
    try { res.json(await LancamentoService.criar(req.body || {})); }
    catch (e) { next(e); }
  });
  router.put("/transactions/:txId", auth(admin), async (req, res, next) => {
    try { res.json(await LancamentoService.atualizar(req.params.txId, req.body || {})); }
    catch (e) { next(e); }
  });
  router.patch("/transactions/:txId/pay", auth(admin), async (req, res, next) => {
    try { res.json(await LancamentoService.pagar(req.params.txId)); }
    catch (e) { next(e); }
  });
  router.delete("/transactions/:txId", auth(admin), async (req, res, next) => {
    try { res.json(await LancamentoService.remover(req.params.txId)); }
    catch (e) { next(e); }
  });

  return router;
}
