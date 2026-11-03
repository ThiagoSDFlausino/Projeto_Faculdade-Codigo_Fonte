import { Router } from "express";
import { auth } from "../auth.js";
import { getDb } from "../db.js";
import { httpError, omitId, omitMany, todayStr } from "../utils.js";

const router = Router();
const col = (name) => getDb().collection(name);

function monthBounds(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const endDay = new Date(y, m + 1, 0).getDate();
  const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  return { start, end, key: start.slice(0, 7) };
}

function prevMonthBounds(d = new Date()) {
  return monthBounds(new Date(d.getFullYear(), d.getMonth() - 1, 1));
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function pctVar(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

function inRange(dateStr, start, end) {
  if (!dateStr || dateStr.length < 10) return false;
  const d = dateStr.slice(0, 10);
  return d >= start && d <= end;
}

function weekKey(isoDate) {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
  return `${d.getFullYear()}-S${String(week).padStart(2, "0")}`;
}

/** Interpreta from/to/profissional/procedimento da query. Sem datas = mês atual. */
function resolveFilters(query = {}) {
  const hoje = todayStr();
  let from = (query.from || "").slice(0, 10);
  let to = (query.to || "").slice(0, 10);
  if (!from && !to) {
    const mes = monthBounds();
    from = mes.start;
    to = mes.end;
  } else {
    if (!from) from = "2000-01-01";
    if (!to) to = hoje;
  }
  const startMs = new Date(`${from}T12:00:00`).getTime();
  const endMs = new Date(`${to}T12:00:00`).getTime();
  const days = Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);
  const prevEnd = new Date(`${from}T12:00:00`);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));
  return {
    start: from,
    end: to,
    prevStart: prevStart.toISOString().slice(0, 10),
    prevEnd: prevEnd.toISOString().slice(0, 10),
    hoje,
    professional_id: String(query.professional_id || "").trim(),
    procedure: String(query.procedure || "").trim(),
  };
}

function daysInRange(start, end, maxDays = 120) {
  const out = [];
  const d = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  let n = 0;
  while (d <= last && n < maxDays) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
    n += 1;
  }
  return out;
}

function matchProfessional(row, professionalId) {
  if (!professionalId) return true;
  return row.professional_id === professionalId;
}

function matchProcedure(row, procedure) {
  if (!procedure) return true;
  const name = String(row.procedure || row.procedure_nome || "").trim().toLowerCase();
  return name === procedure.toLowerCase();
}

async function aniversariantesMes() {
  const mes = `-${String(new Date().getMonth() + 1).padStart(2, "0")}-`;
  const out = [];
  for (const c of omitMany(await col("clientes").find({}, { projection: { _id: 0 } }).toArray())) {
    const b = c.birthdate || "";
    if (b.length === 10 && b.slice(4, 8) === mes) {
      out.push({
        id: c.id,
        name: c.name,
        nome: c.name,
        day: Number(b.slice(8, 10)),
        data_nascimento: c.birthdate,
        photo: c.photo || "",
      });
    }
  }
  return out.sort((a, b) => a.day - b.day);
}

async function adminDashboard(query = {}) {
  const { start, end, prevStart, prevEnd, hoje, professional_id, procedure } = resolveFilters(query);
  const desde30 = daysAgo(30);
  const desde90 = daysAgo(90);
  const desde56 = daysAgo(56);

  let [txs, sessoes, appts, clientes, users] = await Promise.all([
    col("transactions").find({}, { projection: { _id: 0 } }).toArray().then(omitMany),
    col("sessoes").find({}, { projection: { _id: 0 } }).toArray().then(omitMany),
    col("appointments").find({}, { projection: { _id: 0 } }).toArray().then(omitMany),
    col("clientes").find({}, { projection: { _id: 0 } }).toArray().then(omitMany),
    col("users").find({ role: "profissional" }, { projection: { _id: 0 } }).toArray().then(omitMany),
  ]);

  sessoes = sessoes.filter((s) => matchProfessional(s, professional_id) && matchProcedure(s, procedure));
  appts = appts.filter((a) => matchProfessional(a, professional_id) && matchProcedure(a, procedure));

  const paidReceitas = txs.filter((t) => t.type === "receita" && t.status === "Pago");
  const paidDespesas = txs.filter((t) => t.type === "despesa" && t.status === "Pago");

  const fatMes = (s, e) => paidReceitas
    .filter((t) => inRange(t.paid_date || t.due_date, s, e))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const faturamento_mes = fatMes(start, end);
  const faturamento_mes_anterior = fatMes(prevStart, prevEnd);
  const faturamento_variacao = pctVar(faturamento_mes, faturamento_mes_anterior);

  const atendMes = (s, e) => {
    const fromSess = sessoes.filter((x) => inRange(x.date, s, e));
    if (fromSess.length) return fromSess;
    return appts.filter((a) => a.status === "Concluído" && inRange(a.datetime, s, e));
  };
  const atendimentosMes = atendMes(start, end);
  const atendimentosMesAnt = atendMes(prevStart, prevEnd);
  const total_atendimentos = atendimentosMes.length;
  const atendimentos_mes_anterior = atendimentosMesAnt.length;
  const atendimentos_variacao = pctVar(total_atendimentos, atendimentos_mes_anterior);

  const ticket_medio = total_atendimentos > 0 ? faturamento_mes / total_atendimentos : 0;
  const ticket_medio_anterior = atendimentos_mes_anterior > 0
    ? faturamento_mes_anterior / atendimentos_mes_anterior : 0;
  const ticket_variacao = pctVar(ticket_medio, ticket_medio_anterior);

  const clientes_novos = clientes.filter((c) => inRange(c.created_at, start, end)).length;

  const visitasPorCliente = {};
  for (const s of sessoes) {
    if (!s.cliente_id) continue;
    visitasPorCliente[s.cliente_id] = (visitasPorCliente[s.cliente_id] || 0) + 1;
  }
  const comVisita = Object.keys(visitasPorCliente);
  const retornaram = comVisita.filter((id) => visitasPorCliente[id] > 1).length;
  const taxa_retorno = comVisita.length ? (retornaram / comVisita.length) * 100 : 0;

  const ativosSet = new Set();
  for (const s of sessoes) {
    if (s.cliente_id && inRange(s.date, desde90, hoje)) ativosSet.add(s.cliente_id);
  }
  for (const a of appts) {
    if (a.cliente_id && inRange(a.datetime, desde90, hoje) && ["Agendado", "Confirmado", "Concluído"].includes(a.status)) {
      ativosSet.add(a.cliente_id);
    }
  }
  const clientes_ativos = ativosSet.size;

  const profMap = Object.fromEntries(users.map((u) => [u.id, u]));
  let comissoes_pendentes = 0;
  for (const s of sessoes.filter((x) => inRange(x.date, start, end))) {
    const p = profMap[s.professional_id];
    if (!p) continue;
    comissoes_pendentes += (s.value || 0) * ((p.commission_pct || 0) / 100);
  }

  const daySpan = Math.max(1, Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000) + 1);
  const taxa_ocupacao = Math.min((total_atendimentos / (Math.max(daySpan, 1) * 8)) * 100, 100);

  // Daily revenue in selected period
  const dailyMap = {};
  for (const d of daysInRange(start, end)) dailyMap[d] = 0;
  for (const t of paidReceitas) {
    const d = (t.paid_date || t.due_date || "").slice(0, 10);
    if (d && d in dailyMap) dailyMap[d] += t.amount || 0;
  }
  const faturamento_diario = Object.entries(dailyMap).map(([data, valor]) => ({
    data,
    valor: Math.round(valor * 100) / 100,
  }));

  const servCount = {};
  for (const s of atendimentosMes) {
    const name = s.procedure || "Outros";
    servCount[name] = (servCount[name] || 0) + 1;
  }
  const atendimentos_por_servico = Object.entries(servCount)
    .map(([servico, quantidade]) => ({ servico, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10);

  const receitaProf = {};
  for (const s of sessoes.filter((x) => inRange(x.date, start, end))) {
    const nome = profMap[s.professional_id]?.name || s.professional || "Sem profissional";
    receitaProf[nome] = (receitaProf[nome] || 0) + (s.value || 0);
  }
  const receita_por_profissional = Object.entries(receitaProf)
    .map(([profissional, receita]) => ({ profissional, receita: Math.round(receita * 100) / 100, valor: Math.round(receita * 100) / 100 }))
    .sort((a, b) => b.receita - a.receita);

  const weekMap = {};
  for (const c of clientes) {
    if (!c.created_at || c.created_at.slice(0, 10) < desde56) continue;
    const wk = weekKey(c.created_at);
    if (!wk) continue;
    weekMap[wk] = (weekMap[wk] || 0) + 1;
  }
  const novos_clientes_semana = Object.entries(weekMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([semana, quantidade]) => ({ semana, quantidade }));

  const lastVisit = {};
  for (const s of sessoes) {
    if (!s.cliente_id || !s.date) continue;
    const d = s.date.slice(0, 10);
    if (!lastVisit[s.cliente_id] || d > lastVisit[s.cliente_id]) lastVisit[s.cliente_id] = d;
  }
  const clienteById = Object.fromEntries(clientes.map((c) => [c.id, c]));
  const inativosEntries = Object.entries(lastVisit).filter(([, d]) => d < desde30);
  const clientes_inativos_30d = inativosEntries.length;
  const clientes_inativos_lista = inativosEntries
    .map(([cid, ultima_visita]) => ({
      id: cid,
      name: clienteById[cid]?.name || "Cliente",
      nome: clienteById[cid]?.name || "Cliente",
      photo: clienteById[cid]?.photo || "",
      ultima_visita,
    }))
    .sort((a, b) => a.ultima_visita.localeCompare(b.ultima_visita))
    .slice(0, 12);

  const agendamentosAtivos = appts.filter((a) => ["Agendado", "Confirmado"].includes(a.status));
  const agendamentos_ativos = agendamentosAtivos.length;
  const agendamentos_ativos_lista = [...agendamentosAtivos]
    .sort((a, b) => String(a.datetime || "").localeCompare(String(b.datetime || "")))
    .slice(0, 12)
    .map((a) => ({
      id: a.id,
      cliente_id: a.cliente_id || "",
      cliente_name: a.cliente_name || clienteById[a.cliente_id]?.name || "—",
      procedure: a.procedure || "",
      professional: a.professional || "",
      datetime: a.datetime || "",
      status: a.status,
    }));

  const hourMap = {};
  for (const a of appts.filter((x) => x.status === "Concluído" && inRange(x.datetime, start, end))) {
    const h = (a.datetime || "").slice(11, 13);
    if (!h) continue;
    hourMap[h] = (hourMap[h] || 0) + (a.value || 0);
  }
  const topHour = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0];
  const horario_mais_lucrativo = topHour ? `${topHour[0]}:00` : null;

  const clientes_alto_potencial = [...clientes]
    .map((c) => ({
      id: c.id,
      nome: c.name,
      name: c.name,
      total_gasto: c.total_spent || 0,
      photo: c.photo || "",
    }))
    .sort((a, b) => b.total_gasto - a.total_gasto)
    .slice(0, 5);

  const receita = paidReceitas
    .filter((t) => inRange(t.paid_date || t.due_date, start, end))
    .reduce((s, t) => s + (t.amount || 0), 0);
  const despesa = paidDespesas
    .filter((t) => inRange(t.paid_date || t.due_date, start, end))
    .reduce((s, t) => s + (t.amount || 0), 0);
  const a_receber = txs.filter((t) => t.type === "receita" && ["Pendente", "Atrasado"].includes(t.status)).reduce((s, t) => s + t.amount, 0);
  const a_pagar = txs.filter((t) => t.type === "despesa" && ["Pendente", "Atrasado"].includes(t.status)).reduce((s, t) => s + t.amount, 0);

  const monthsPt = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const monthly = {};
  for (const t of txs.filter((x) => x.status === "Pago")) {
    const d = t.paid_date || t.due_date || "";
    if (d.length >= 7) {
      const key = d.slice(0, 7);
      monthly[key] ||= { receita: 0, despesa: 0 };
      monthly[key][t.type === "receita" ? "receita" : "despesa"] += t.amount || 0;
    }
  }
  const chart = Object.keys(monthly).sort().slice(-6).map((key) => {
    const [, m] = key.split("-");
    return {
      mes: monthsPt[Number(m) - 1],
      receita: Math.round(monthly[key].receita * 100) / 100,
      despesa: Math.round(monthly[key].despesa * 100) / 100,
    };
  });

  const proc = {};
  for (const a of atendimentosMes) {
    const name = a.procedure || "Outros";
    proc[name] = (proc[name] || 0) + (a.value || 0);
  }
  const procedimentos = Object.entries(proc)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

  const aniversariantes = await aniversariantesMes();
  const agendamentos_hoje = omitMany(
    await col("appointments").find(
      { datetime: { $regex: `^${hoje}` }, status: { $in: ["Agendado", "Confirmado", "Concluído"] } },
      { projection: { _id: 0 } }
    ).sort({ datetime: 1 }).limit(8).toArray()
  );

  return {
    role: "admin",
    periodo: { from: start, to: end, professional_id: professional_id || null, procedure: procedure || null },
    // strategic KPIs (Suleima CRM style)
    faturamento_mes: Math.round(faturamento_mes * 100) / 100,
    faturamento_mes_anterior: Math.round(faturamento_mes_anterior * 100) / 100,
    faturamento_variacao,
    total_atendimentos,
    atendimentos_mes_anterior,
    atendimentos_variacao,
    ticket_medio: Math.round(ticket_medio * 100) / 100,
    ticket_medio_anterior: Math.round(ticket_medio_anterior * 100) / 100,
    ticket_variacao,
    clientes_novos,
    clientes_ativos,
    taxa_retorno: Math.round(taxa_retorno * 10) / 10,
    taxa_ocupacao: Math.round(taxa_ocupacao * 10) / 10,
    comissoes_pendentes: Math.round(comissoes_pendentes * 100) / 100,
    faturamento_diario,
    atendimentos_por_servico,
    receita_por_profissional,
    novos_clientes_semana,
    clientes_inativos_30d,
    clientes_inativos_lista,
    aniversariantes_mes: aniversariantes,
    aniversariantes,
    servico_mais_vendido: atendimentos_por_servico[0]?.servico || null,
    horario_mais_lucrativo,
    clientes_alto_potencial,
    agendamentos_hoje,
    // legacy + cash overview
    receita: Math.round(receita * 100) / 100,
    despesa: Math.round(despesa * 100) / 100,
    lucro: Math.round((receita - despesa) * 100) / 100,
    a_receber: Math.round(a_receber * 100) / 100,
    a_pagar: Math.round(a_pagar * 100) / 100,
    total_clientes: clientes.length,
    agendamentos_ativos,
    agendamentos_ativos_lista,
    chart,
    procedimentos,
  };
}

async function secDashboard(query = {}) {
  const { start, end, hoje, professional_id, procedure } = resolveFilters(query);
  let [clientes, appts] = await Promise.all([
    col("clientes").find({}, { projection: { _id: 0 } }).toArray().then(omitMany),
    col("appointments").find({}, { projection: { _id: 0 } }).toArray().then(omitMany),
  ]);
  appts = appts.filter((a) => matchProfessional(a, professional_id) && matchProcedure(a, procedure));

  const desde90 = daysAgo(90);
  const ativosSet = new Set();
  for (const a of appts) {
    if (a.cliente_id && inRange(a.datetime, desde90, hoje)) ativosSet.add(a.cliente_id);
  }

  let sessoes = omitMany(await col("sessoes").find({}, { projection: { _id: 0 } }).toArray());
  sessoes = sessoes.filter((s) => matchProfessional(s, professional_id) && matchProcedure(s, procedure));
  const lastVisit = {};
  for (const s of sessoes) {
    if (!s.cliente_id || !s.date) continue;
    const d = s.date.slice(0, 10);
    if (!lastVisit[s.cliente_id] || d > lastVisit[s.cliente_id]) lastVisit[s.cliente_id] = d;
  }
  const desde30 = daysAgo(30);
  const clienteById = Object.fromEntries(clientes.map((c) => [c.id, c]));
  const inativosEntries = Object.entries(lastVisit).filter(([, d]) => d < desde30);
  const clientes_inativos_lista = inativosEntries
    .map(([cid, ultima_visita]) => ({
      id: cid,
      name: clienteById[cid]?.name || "Cliente",
      nome: clienteById[cid]?.name || "Cliente",
      photo: clienteById[cid]?.photo || "",
      ultima_visita,
    }))
    .sort((a, b) => a.ultima_visita.localeCompare(b.ultima_visita))
    .slice(0, 12);

  const aniversariantes = await aniversariantesMes();
  const proximos = omitMany(await col("appointments").find(
    { datetime: { $gte: hoje }, status: { $in: ["Agendado", "Confirmado"] } },
    { projection: { _id: 0 } }
  ).sort({ datetime: 1 }).limit(8).toArray())
    .filter((a) => matchProfessional(a, professional_id) && matchProcedure(a, procedure));

  const agendamentosAtivos = appts.filter((a) => ["Agendado", "Confirmado"].includes(a.status));
  const agendamentos_ativos_lista = [...agendamentosAtivos]
    .sort((a, b) => String(a.datetime || "").localeCompare(String(b.datetime || "")))
    .slice(0, 12)
    .map((a) => ({
      id: a.id,
      cliente_id: a.cliente_id || "",
      cliente_name: a.cliente_name || clienteById[a.cliente_id]?.name || "—",
      procedure: a.procedure || "",
      professional: a.professional || "",
      datetime: a.datetime || "",
      status: a.status,
    }));

  return {
    role: "secretaria",
    periodo: { from: start, to: end, professional_id: professional_id || null, procedure: procedure || null },
    total_clientes: clientes.length,
    clientes_ativos: ativosSet.size || clientes.filter((c) => c.status === "Ativo").length,
    clientes_novos: clientes.filter((c) => inRange(c.created_at, start, end)).length,
    agendamentos_ativos: agendamentosAtivos.length,
    agendamentos_ativos_lista,
    agendamentos_hoje: appts.filter((a) => (a.datetime || "").startsWith(hoje)).length,
    clientes_inativos_30d: inativosEntries.length,
    clientes_inativos_lista,
    proximos,
    aniversariantes,
    aniversariantes_mes: aniversariantes,
  };
}

async function proDashboard(user, query = {}) {
  const { start, end, prevStart, prevEnd, hoje } = resolveFilters(query);
  const procedure = String(query.procedure || "").trim();
  const mine = { professional_id: user.id };
  const sessoes = omitMany(await col("sessoes").find(mine, { projection: { _id: 0 } }).toArray())
    .filter((s) => matchProcedure(s, procedure));
  const sessoesMes = sessoes.filter((s) => inRange(s.date, start, end));
  const sessoesAnt = sessoes.filter((s) => inRange(s.date, prevStart, prevEnd));
  const pct = (user.commission_pct || 0) / 100;
  const fatMes = sessoesMes.reduce((s, x) => s + (x.value || 0), 0);
  const fatAnt = sessoesAnt.reduce((s, x) => s + (x.value || 0), 0);

  const dailyMap = {};
  for (const d of daysInRange(start, end)) dailyMap[d] = 0;
  for (const s of sessoes) {
    const d = (s.date || "").slice(0, 10);
    if (d && d in dailyMap) dailyMap[d] += s.value || 0;
  }

  const proximos = omitMany(await col("appointments").find(
    { ...mine, datetime: { $gte: hoje }, status: { $in: ["Agendado", "Confirmado"] } },
    { projection: { _id: 0 } }
  ).sort({ datetime: 1 }).limit(8).toArray())
    .filter((a) => matchProcedure(a, procedure));

  const daySpan = Math.max(1, Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000) + 1);

  return {
    role: "profissional",
    periodo: { from: start, to: end },
    nome: user.name,
    specialty: user.specialty || "",
    faturamento_mes: Math.round(fatMes * 100) / 100,
    faturamento_variacao: pctVar(fatMes, fatAnt),
    total_atendimentos: sessoesMes.length,
    atendimentos_variacao: pctVar(sessoesMes.length, sessoesAnt.length),
    comissoes_pendentes: Math.round(fatMes * pct * 100) / 100,
    taxa_ocupacao: Math.min((sessoesMes.length / (daySpan * 8)) * 100, 100),
    faturamento_diario: Object.entries(dailyMap).map(([data, valor]) => ({ data, valor: Math.round(valor * 100) / 100 })),
    agendamentos_hoje: await col("appointments").countDocuments({ ...mine, datetime: { $regex: `^${hoje}` } }),
    agendamentos_ativos: await col("appointments").countDocuments({ ...mine, status: { $in: ["Agendado", "Confirmado"] } }),
    sessoes_mes: sessoesMes.length,
    comissao_mes: Math.round(fatMes * pct * 100) / 100,
    commission_pct: user.commission_pct || 0,
    proximos,
  };
}

router.get("/dashboard", auth(), async (req, res, next) => {
  try {
    if (req.user.role === "profissional") return res.json(await proDashboard(req.user, req.query));
    if (req.user.role === "secretaria") return res.json(await secDashboard(req.query));
    res.json(await adminDashboard(req.query));
  } catch (e) { next(e); }
});

router.post("/ai/client-summary", auth(), async (req, res, next) => {
  try {
    const clienteId = req.body?.cliente_id;
    const cliente = omitId(await col("clientes").findOne({ id: clienteId }, { projection: { _id: 0 } }));
    if (!cliente) throw httpError(404, "Cliente não encontrado");
    const sessoes = omitMany(await col("sessoes").find({ cliente_id: clienteId }, { projection: { _id: 0 } }).limit(100).toArray());
    const anamneses = omitMany(await col("anamneses").find({ cliente_id: clienteId }, { projection: { _id: 0 } }).limit(100).toArray());
    const appts = omitMany(await col("appointments").find({ cliente_id: clienteId }, { projection: { _id: 0 } }).limit(100).toArray());

    const lastSess = sessoes[0];
    const procs = [...new Set(sessoes.map((s) => s.procedure).filter(Boolean))];
    const anam = anamneses[0];
    const nextAppt = appts.find((a) => ["Agendado", "Confirmado"].includes(a.status));

    const summary = `## Resumo — ${cliente.name}

**Status:** ${cliente.status || "—"} · **LTV:** R$ ${(cliente.total_spent || 0).toFixed(2)}
**Tags:** ${(cliente.tags || []).join(", ") || "—"}

### Histórico
- ${sessoes.length} sessões registradas
- Procedimentos: ${procs.join(", ") || "nenhum"}
- Última sessão: ${lastSess ? `${lastSess.procedure} em ${lastSess.date}` : "—"}

### Anamnese
${anam ? `- Pele: ${anam.skin_type || "—"} · Alergias: ${anam.allergies || "—"} · Área: ${anam.area || "—"}` : "- Sem anamnese cadastrada"}

### Recomendações
- Manter follow-up em 30–45 dias
- ${nextAppt ? `Próximo agendamento: ${nextAppt.procedure} (${(nextAppt.datetime || "").slice(0, 16)})` : "Sugerir retorno / avaliação"}

### Mensagem sugerida
Olá ${cliente.name.split(" ")[0]}! Tudo bem? Por aqui na clínica queríamos saber como você está após o último atendimento${lastSess ? ` de ${lastSess.procedure}` : ""}. Se quiser, agendamos seu retorno 💕
`;
    res.json({ summary });
  } catch (e) { next(e); }
});

export default router;
