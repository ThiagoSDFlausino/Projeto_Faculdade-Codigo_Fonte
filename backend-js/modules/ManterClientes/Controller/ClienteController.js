import { auth } from "../../../src/auth.js";
import { PerfilUsuario } from "../../ManterUsuario/Enum/PerfilUsuario.js";
import { ClienteService } from "../Service/ClienteService.js";

export function createClienteRouter(Router) {
  const router = Router();
  const adminSec = [PerfilUsuario.ADMIN, PerfilUsuario.SECRETARIA];

  router.get("/clientes", auth(), async (_req, res, next) => {
    try { res.json(await ClienteService.listar()); }
    catch (e) { next(e); }
  });

  router.get("/clientes/:clienteId", auth(), async (req, res, next) => {
    try { res.json(await ClienteService.detalhar(req.params.clienteId, req.user)); }
    catch (e) { next(e); }
  });

  router.post("/clientes", auth(), async (req, res, next) => {
    try { res.json(await ClienteService.criar(req.body || {})); }
    catch (e) { next(e); }
  });

  router.put("/clientes/:clienteId", auth(), async (req, res, next) => {
    try { res.json(await ClienteService.atualizar(req.params.clienteId, req.body || {})); }
    catch (e) { next(e); }
  });

  router.delete("/clientes/:clienteId", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.remover(req.params.clienteId)); }
    catch (e) { next(e); }
  });

  router.post("/anamneses", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.criarAnamnese(req.body || {})); }
    catch (e) { next(e); }
  });

  router.put("/anamneses/:anamId", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.atualizarAnamnese(req.params.anamId, req.body || {})); }
    catch (e) { next(e); }
  });

  router.delete("/anamneses/:anamId", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.removerAnamnese(req.params.anamId)); }
    catch (e) { next(e); }
  });

  router.post("/sessoes", auth(), async (req, res, next) => {
    try { res.json(await ClienteService.criarSessao(req.user, req.body || {})); }
    catch (e) { next(e); }
  });

  router.put("/sessoes/:sessaoId", auth(), async (req, res, next) => {
    try { res.json(await ClienteService.atualizarSessao(req.user, req.params.sessaoId, req.body || {})); }
    catch (e) { next(e); }
  });

  router.delete("/sessoes/:sessaoId", auth(), async (req, res, next) => {
    try { res.json(await ClienteService.removerSessao(req.user, req.params.sessaoId)); }
    catch (e) { next(e); }
  });

  router.post("/gallery", auth(), async (req, res, next) => {
    try { res.json(await ClienteService.criarGallery(req.body || {})); }
    catch (e) { next(e); }
  });

  router.put("/gallery/:gid", auth(), async (req, res, next) => {
    try { res.json(await ClienteService.atualizarGallery(req.params.gid, req.body || {})); }
    catch (e) { next(e); }
  });

  router.delete("/gallery/:gid", auth(), async (req, res, next) => {
    try { res.json(await ClienteService.removerGallery(req.params.gid)); }
    catch (e) { next(e); }
  });

  router.post("/clientes/:clienteId/notas", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.criarNota(req.user, req.params.clienteId, req.body || {})); }
    catch (e) { next(e); }
  });

  router.put("/notas/:notaId", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.atualizarNota(req.params.notaId, req.body || {})); }
    catch (e) { next(e); }
  });

  router.delete("/notas/:notaId", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.removerNota(req.params.notaId)); }
    catch (e) { next(e); }
  });

  router.post("/clientes/:clienteId/lembretes", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.criarLembrete(req.params.clienteId, req.body || {})); }
    catch (e) { next(e); }
  });

  router.put("/lembretes/:lembreteId", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.atualizarLembrete(req.params.lembreteId, req.body || {})); }
    catch (e) { next(e); }
  });

  router.put("/lembretes/:lembreteId/status", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.atualizarStatusLembrete(req.params.lembreteId, req.body?.status)); }
    catch (e) { next(e); }
  });

  router.delete("/lembretes/:lembreteId", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.removerLembrete(req.params.lembreteId)); }
    catch (e) { next(e); }
  });

  router.post("/clientes/:clienteId/avaliacoes", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.criarAvaliacao(req.user, req.params.clienteId, req.body || {})); }
    catch (e) { next(e); }
  });

  router.put("/avaliacoes/:avId", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.atualizarAvaliacao(req.params.avId, req.body || {})); }
    catch (e) { next(e); }
  });

  router.delete("/avaliacoes/:avId", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.removerAvaliacao(req.params.avId)); }
    catch (e) { next(e); }
  });

  router.post("/clientes/:clienteId/interacoes", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.criarInteracao(req.user, req.params.clienteId, req.body || {})); }
    catch (e) { next(e); }
  });

  router.put("/interacoes/:intId", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.atualizarInteracao(req.params.intId, req.body || {})); }
    catch (e) { next(e); }
  });

  router.delete("/interacoes/:intId", auth(adminSec), async (req, res, next) => {
    try { res.json(await ClienteService.removerInteracao(req.params.intId)); }
    catch (e) { next(e); }
  });

  return router;
}
