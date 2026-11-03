import { auth } from "../../../../src/auth.js";
import { PerfilUsuario } from "../../../ManterUsuario/Enum/PerfilUsuario.js";
import { FluxoService } from "../Service/FluxoService.js";

export function createFluxoRouter(Router) {
  const router = Router();

  router.get("/fluxo-caixa", auth([PerfilUsuario.ADMIN]), async (req, res, next) => {
    try { res.json(await FluxoService.obter(req.query.from_date, req.query.to_date)); }
    catch (e) { next(e); }
  });

  return router;
}
