import { auth } from "../../../src/auth.js";
import { AgendaService } from "../Service/AgendaService.js";

export function createAgendaRouter(Router) {
  const router = Router();

  router.get("/appointments", auth(), async (req, res, next) => {
    try {
      res.json(await AgendaService.listar(req.user, req.query || {}));
    } catch (e) { next(e); }
  });

  router.post("/appointments", auth(), async (req, res, next) => {
    try {
      res.json(await AgendaService.criar(req.user, req.body || {}));
    } catch (e) { next(e); }
  });

  router.put("/appointments/:apptId", auth(), async (req, res, next) => {
    try {
      res.json(await AgendaService.atualizar(req.user, req.params.apptId, req.body || {}));
    } catch (e) { next(e); }
  });

  router.delete("/appointments/:apptId", auth(), async (req, res, next) => {
    try {
      res.json(await AgendaService.remover(req.user, req.params.apptId));
    } catch (e) { next(e); }
  });

  return router;
}
