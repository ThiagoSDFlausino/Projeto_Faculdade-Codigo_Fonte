import "dotenv/config";
import { connectDb, closeDb, getDb } from "./db.js";
import { hashPassword, verifyPassword } from "./auth.js";
import { id, nowIso, omitId, todayStr } from "./utils.js";

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function seed() {
  const db = getDb();
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@faculdade.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "bella123";

  const existingAdmin = omitId(await db.collection("users").findOne({ email: adminEmail }, { projection: { _id: 0 } }));
  if (!existingAdmin) {
    await db.collection("users").insertOne({
      id: id(), email: adminEmail, password_hash: hashPassword(adminPassword),
      name: "Faculdade (Dono)", role: "admin", specialty: "", commission_pct: 0, photo: "", active: true, created_at: nowIso(),
    });
  } else {
    const upd = { role: "admin", active: true };
    if (!verifyPassword(adminPassword, existingAdmin.password_hash)) upd.password_hash = hashPassword(adminPassword);
    await db.collection("users").updateOne({ email: adminEmail }, { $set: upd });
  }

  const staffDefs = [
    ["juliana@faculdade.com", "Dra. Juliana Mendes", "profissional", "Biomédica Esteta", 35, "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"],
    ["lucas@faculdade.com", "Dr. Lucas Ferraz", "profissional", "Dermatologista", 30, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"],
    ["recepcao@faculdade.com", "Ana Recepção", "secretaria", "Recepcionista", 0, ""],
  ];
  const profIds = {};
  for (const [email, name, role, spec, pct, photo] of staffDefs) {
    let u = omitId(await db.collection("users").findOne({ email }, { projection: { _id: 0 } }));
    if (!u) {
      const uid = id();
      await db.collection("users").insertOne({
        id: uid, email, password_hash: hashPassword("bella123"), name, role, specialty: spec,
        commission_pct: pct, photo, active: true, created_at: nowIso(),
      });
      profIds[name] = uid;
    } else profIds[name] = u.id;
  }

  // Seed base only if empty
  if ((await db.collection("clientes").countDocuments({})) === 0) {
    const clientesSeed = [
      { name: "Camila Ribeiro", phone: "(11) 98765-4321", email: "camila.ribeiro@email.com", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80", tags: ["VIP", "Fidelidade Ouro"], status: "Ativo", notes: "Cliente desde 2022.", birthdate: "1990-04-12" },
      { name: "Fernanda Costa", phone: "(11) 91234-5678", email: "fernanda.costa@email.com", photo: "", tags: ["Novo"], status: "Ativo", notes: "Indicada por Camila.", birthdate: "1995-09-30" },
      { name: "Patrícia Almeida", phone: "(11) 99887-6655", email: "patricia.almeida@email.com", photo: "", tags: ["VIP"], status: "Ativo", notes: "Harmonização trimestral.", birthdate: "1988-01-22" },
      { name: "Juliana Souza", phone: "(11) 97777-1122", email: "juliana.souza@email.com", photo: "", tags: ["Fidelidade Prata"], status: "Inativo", notes: "Sem retorno.", birthdate: "1992-07-15" },
      { name: "Roberta Lima", phone: "(11) 96543-2211", email: "roberta.lima@email.com", photo: "", tags: ["Novo"], status: "Ativo", notes: "Primeira limpeza.", birthdate: "1998-11-05" },
    ];
    const cliObjs = clientesSeed.map((c) => ({ id: id(), ...c, total_spent: 0, created_at: nowIso() }));
    await db.collection("clientes").insertMany(cliObjs);
    const ids = Object.fromEntries(cliObjs.map((c) => [c.name, c.id]));
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    await db.collection("clientes").updateOne({ id: ids["Fernanda Costa"] }, { $set: { birthdate: `1994-${month}-18` } });

    const procedimentos = [
      ["Harmonização Facial", 3500], ["Toxina Botulínica", 1200], ["Preenchimento Labial", 1800],
      ["Bioestimulador de Colágeno", 2400], ["Lavieen", 900], ["Limpeza de Pele", 350],
      ["Peeling Químico", 600], ["Microagulhamento", 750],
    ];
    const profList = [
      ["Dra. Juliana Mendes", profIds["Dra. Juliana Mendes"]],
      ["Dr. Lucas Ferraz", profIds["Dr. Lucas Ferraz"]],
    ];

    let seedNum = 7;
    const rnd = () => { seedNum = (seedNum * 1103515245 + 12345) & 0x7fffffff; return seedNum / 0x7fffffff; };
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

    const sessoes = [];
    for (const [name, cid] of Object.entries(ids)) {
      const n = 2 + Math.floor(rnd() * 3);
      for (let i = 0; i < n; i++) {
        const p = pick(procedimentos);
        const pf = pick(profList);
        sessoes.push({
          id: id(), cliente_id: cid, procedure: p[0], professional: pf[0], professional_id: pf[1] || "",
          date: addDays(-Math.floor(rnd() * 75)), value: p[1], notes: "Sessão realizada com bom resultado.", created_at: nowIso(),
        });
      }
    }
    await db.collection("sessoes").insertMany(sessoes);
    for (const [, cid] of Object.entries(ids)) {
      const total = sessoes.filter((s) => s.cliente_id === cid).reduce((a, s) => a + s.value, 0);
      await db.collection("clientes").updateOne({ id: cid }, { $set: { total_spent: total } });
    }

    await db.collection("anamneses").insertMany([
      { id: id(), cliente_id: ids["Camila Ribeiro"], skin_type: "Mista", allergies: "Nenhuma", health_conditions: "Nenhuma", medications: "Nenhum", area: "Face", observations: "Pele saudável.", created_at: nowIso() },
      { id: id(), cliente_id: ids["Patrícia Almeida"], skin_type: "Seca", allergies: "Lidocaína (leve)", health_conditions: "Hipotireoidismo", medications: "Levotiroxina", area: "Face e pescoço", observations: "Atenção a anestésicos.", created_at: nowIso() },
    ]);

    const future = [
      ["Camila Ribeiro", "Toxina Botulínica", 2, "Confirmado"],
      ["Fernanda Costa", "Limpeza de Pele", 1, "Agendado"],
      ["Patrícia Almeida", "Bioestimulador de Colágeno", 4, "Confirmado"],
      ["Roberta Lima", "Peeling Químico", 3, "Agendado"],
      ["Camila Ribeiro", "Preenchimento Labial", 9, "Agendado"],
      ["Fernanda Costa", "Microagulhamento", 0, "Confirmado"],
    ];
    const appts = [];
    const hours = ["09:00", "11:00", "14:00", "16:00"];
    for (const [name, proc, day, st] of future) {
      const pval = Object.fromEntries(procedimentos)[proc];
      const pf = pick(profList);
      appts.push({
        id: id(), cliente_id: ids[name], cliente_name: name, professional: pf[0], professional_id: pf[1] || "",
        procedure: proc, datetime: `${addDays(day)}T${pick(hours)}:00`, room: `Sala ${1 + Math.floor(rnd() * 3)}`,
        status: st, value: pval, created_at: nowIso(),
      });
    }
    for (const [name, cid] of Object.entries(ids)) {
      const n = 1 + Math.floor(rnd() * 2);
      for (let i = 0; i < n; i++) {
        const p = pick(procedimentos);
        const pf = pick(profList);
        appts.push({
          id: id(), cliente_id: cid, cliente_name: name, professional: pf[0], professional_id: pf[1] || "",
          procedure: p[0], datetime: `${addDays(-(3 + Math.floor(rnd() * 57)))}T14:00:00`,
          room: `Sala ${1 + Math.floor(rnd() * 3)}`, status: "Concluído", value: p[1], created_at: nowIso(),
        });
      }
    }
    await db.collection("appointments").insertMany(appts);

    const txs = [];
    const desp = [["Aluguel", 4500], ["Fornecedor de Insumos", 3200], ["Salários", 9800], ["Marketing", 1500], ["Energia e Água", 900]];
    const nomes = Object.keys(ids);
    for (let m = 0; m < 6; m++) {
      const monthDate = new Date();
      monthDate.setDate(1);
      monthDate.setMonth(monthDate.getMonth() - m);
      const base = `${monthDate.toISOString().slice(0, 8)}10`;
      for (let i = 0; i < 18 + Math.floor(rnd() * 5); i++) {
        const name = pick(nomes);
        const p = pick(procedimentos);
        const st = m > 0 || rnd() > 0.35 ? "Pago" : pick(["Pendente", "Atrasado"]);
        const day = 1 + Math.floor(rnd() * 28);
        txs.push({
          id: id(), type: "receita", description: `${p[0]} - ${name}`, category: p[0], amount: p[1],
          status: st, party: name, due_date: `${monthDate.toISOString().slice(0, 8)}${String(day).padStart(2, "0")}`,
          paid_date: st === "Pago" ? base : "", created_at: nowIso(),
        });
      }
      for (const [cat, val] of desp) {
        const st = m > 0 ? "Pago" : pick(["Pago", "Pendente"]);
        txs.push({
          id: id(), type: "despesa", description: cat, category: cat, amount: val, status: st, party: cat,
          due_date: `${monthDate.toISOString().slice(0, 8)}05`, paid_date: st === "Pago" ? base : "", created_at: nowIso(),
        });
      }
    }
    await db.collection("transactions").insertMany(txs);

    await db.collection("gallery").insertMany([
      { id: id(), cliente_id: ids["Camila Ribeiro"], title: "Preenchimento Labial", procedure: "Preenchimento Labial", date: addDays(-30), before_image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80", after_image: "https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&w=600&q=80", notes: "Resultado natural.", created_at: nowIso() },
      { id: id(), cliente_id: ids["Patrícia Almeida"], title: "Harmonização Facial", procedure: "Harmonização Facial", date: addDays(-60), before_image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=600&q=80", after_image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80", notes: "Contorno definido.", created_at: nowIso() },
    ]);

    const catMap = { "Harmonização Facial": "Injetáveis", "Toxina Botulínica": "Injetáveis", "Preenchimento Labial": "Preenchedores", "Bioestimulador de Colágeno": "Bioestimulador", Lavieen: "Laser", "Limpeza de Pele": "Estética Facial", "Peeling Químico": "Estética Facial", Microagulhamento: "Estética Facial" };
    await db.collection("procedures").insertMany(procedimentos.map(([name, price]) => ({
      id: id(), name, category: catMap[name] || "Geral", price, duration_min: 45,
      description: `Procedimento estético: ${name}.`, active: true, created_at: nowIso(),
    })));
  }

  if ((await db.collection("notas_cliente").countDocuments({})) === 0) {
    const camila = omitId(await db.collection("clientes").findOne({ name: "Camila Ribeiro" }, { projection: { _id: 0 } }));
    if (camila) {
      await db.collection("notas_cliente").insertOne({
        id: id(), cliente_id: camila.id, titulo: "Preferência", conteudo: "Prefere atendimento à tarde.", is_pinned: true,
        criado_por_id: "", criado_por_nome: "Sistema", created_at: nowIso(),
      });
      await db.collection("lembretes").insertOne({
        id: id(), cliente_id: camila.id, titulo: "Aniversário / mimos", descricao: "Enviar mensagem no aniversário",
        data_vencimento: addDays(20), prioridade: "baixa", status: "pendente", responsavel_id: "", created_at: nowIso(),
      });
      await db.collection("avaliacoes_cliente").insertOne({
        id: id(), cliente_id: camila.id, nota: 9, comentario: "Atendimento excelente", tipo: "nps", registrado_por_id: "", created_at: nowIso(),
      });
      await db.collection("interacoes_cliente").insertOne({
        id: id(), cliente_id: camila.id, tipo: "ligacao", canal: "telefone", descricao: "Confirmou agendamento",
        resultado: "positivo", registrado_por_id: "", registrado_por_nome: "Sistema", created_at: nowIso(),
      });
    }
  }

  console.log("Seed concluído.", todayStr());
}

if (process.argv[1] && process.argv[1].includes("seed.js")) {
  await connectDb();
  await seed();
  await closeDb();
}
