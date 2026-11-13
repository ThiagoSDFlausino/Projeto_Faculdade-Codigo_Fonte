import { createAccessToken, hashPassword, verifyPassword } from "../../../src/auth.js";
import { assertPasswordPolicy, isProduction } from "../../../src/security.js";
import { httpError, id, nowIso } from "../../../src/utils.js";
import { isPerfilUsuario, PerfilUsuario } from "../Enum/PerfilUsuario.js";
import { UsuarioRepository } from "../Repositories/UsuarioRepository.js";
import { Usuario } from "../Usuario/Usuario.js";

function publicRegisterAllowed() {
  return process.env.ALLOW_PUBLIC_REGISTER === "1" || process.env.ALLOW_PUBLIC_REGISTER === "true";
}

export const UsuarioService = {
  async login(emailRaw, password) {
    const email = String(emailRaw || "").toLowerCase().trim();
    const usuario = await UsuarioRepository.findByEmail(email);
    const ok = verifyPassword(password || "", usuario?.passwordHash);
    if (!usuario || !ok) throw httpError(401, "E-mail ou senha inválidos");
    if (!usuario.active) throw httpError(401, "Usuário inativo");
    return {
      token: createAccessToken(usuario.id, usuario.email),
      user: usuario.toPublic(),
    };
  },

  async register({ name, email, password }) {
    const total = await UsuarioRepository.count();
    if (total > 0 && !publicRegisterAllowed()) {
      throw httpError(403, "Cadastro público desabilitado. Peça ao dono para criar seu acesso em Equipe.");
    }
    if (isProduction() && total > 0 && publicRegisterAllowed()) {
      console.warn("[segurança] ALLOW_PUBLIC_REGISTER ativo em produção — revise se necessário.");
    }
    if (!name || !email || !password) throw httpError(400, "Dados incompletos");
    assertPasswordPolicy(password);
    const emailL = String(email).toLowerCase().trim();
    if (!emailL.includes("@")) throw httpError(400, "E-mail inválido");
    if (await UsuarioRepository.findByEmail(emailL)) throw httpError(400, "E-mail já cadastrado");

    const usuario = new Usuario({
      id: id(),
      email: emailL,
      password_hash: hashPassword(password),
      name: String(name).trim(),
      role: total === 0 ? PerfilUsuario.ADMIN : PerfilUsuario.PROFISSIONAL,
      funcao: "",
      specialty: "",
      commission_pct: 0,
      photo: "",
      procedimento_ids: [],
      active: true,
      created_at: nowIso(),
    });
    await UsuarioRepository.insert(usuario);
    return {
      token: createAccessToken(usuario.id, usuario.email),
      user: usuario.toPublic(),
    };
  },

  async listarEquipe() {
    const usuarios = await UsuarioRepository.findAll();
    return usuarios.map((usuario) => usuario.toPublic());
  },

  async listarProfissionais() {
    const usuarios = await UsuarioRepository.findActiveByRole(PerfilUsuario.PROFISSIONAL);
    return usuarios.map((usuario) => usuario.toPublic());
  },

  async criarMembro(body = {}) {
    const email = String(body.email || "").toLowerCase().trim();
    if (!body.name || !email) throw httpError(400, "Nome e e-mail obrigatórios");
    if (!body.password) throw httpError(400, "Senha obrigatória");
    assertPasswordPolicy(body.password);
    const role = body.role || PerfilUsuario.PROFISSIONAL;
    if (!isPerfilUsuario(role)) throw httpError(400, "Perfil inválido");
    if (await UsuarioRepository.findByEmail(email)) throw httpError(400, "E-mail já cadastrado");

    const funcao = body.funcao || body.specialty || "";
    const procedimentoIds = Array.isArray(body.procedimento_ids) ? body.procedimento_ids : [];
    const usuario = new Usuario({
      id: id(),
      email,
      password_hash: hashPassword(body.password),
      name: String(body.name).trim(),
      role,
      funcao,
      specialty: funcao,
      commission_pct: body.commission_pct ?? 30,
      photo: body.photo || "",
      procedimento_ids: procedimentoIds,
      active: true,
      created_at: nowIso(),
    });
    await UsuarioRepository.insert(usuario);
    return usuario.toPublic();
  },

  async atualizarMembro(idMembro, body = {}) {
    const existing = await UsuarioRepository.findById(idMembro);
    if (!existing) throw httpError(404, "Membro não encontrado");
    if (!isPerfilUsuario(body.role)) throw httpError(400, "Perfil inválido");
    const funcao = body.funcao ?? body.specialty ?? existing.funcao ?? "";
    const procedimentoIds = Array.isArray(body.procedimento_ids)
      ? body.procedimento_ids
      : existing.procedimentoIds || [];
    const data = {
      name: body.name,
      role: body.role,
      funcao,
      specialty: funcao,
      commission_pct: body.commission_pct ?? 30,
      procedimento_ids: procedimentoIds,
      active: body.active !== false,
      photo: body.photo || "",
    };
    if (body.password) {
      assertPasswordPolicy(body.password);
      data.password_hash = hashPassword(body.password);
    }
    const updated = await UsuarioRepository.update(idMembro, data);
    return updated.toPublic();
  },

  async removerMembro(idMembro, idLogado) {
    if (idMembro === idLogado) throw httpError(400, "Você não pode remover a si mesmo");
    const existing = await UsuarioRepository.findById(idMembro);
    if (!existing) throw httpError(404, "Membro não encontrado");
    await UsuarioRepository.delete(idMembro);
    return { ok: true };
  },
};
