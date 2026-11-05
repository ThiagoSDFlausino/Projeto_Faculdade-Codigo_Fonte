-- Schema inicial — apenas tabelas dos módulos existentes.
-- Campos tipados para filtros comuns; `data` guarda o documento JSON completo.

-- ManterUsuario / Equipes
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT,
  active INTEGER,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- ManterUsuario / Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  status TEXT,
  created_at TEXT,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_clientes_name ON clientes (name);

CREATE TABLE IF NOT EXISTS sessoes (
  id TEXT PRIMARY KEY,
  cliente_id TEXT,
  professional_id TEXT,
  date TEXT,
  fechamento_id TEXT,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessoes_cliente ON sessoes (cliente_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_prof ON sessoes (professional_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_date ON sessoes (date);

CREATE TABLE IF NOT EXISTS anamneses (
  id TEXT PRIMARY KEY,
  cliente_id TEXT,
  created_at TEXT,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_anamneses_cliente ON anamneses (cliente_id);

CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  cliente_id TEXT,
  created_at TEXT,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gallery_cliente ON gallery (cliente_id);

CREATE TABLE IF NOT EXISTS notas_cliente (
  id TEXT PRIMARY KEY,
  cliente_id TEXT,
  created_at TEXT,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notas_cliente ON notas_cliente (cliente_id);

CREATE TABLE IF NOT EXISTS lembretes (
  id TEXT PRIMARY KEY,
  cliente_id TEXT,
  data_vencimento TEXT,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lembretes_cliente ON lembretes (cliente_id);

CREATE TABLE IF NOT EXISTS avaliacoes_cliente (
  id TEXT PRIMARY KEY,
  cliente_id TEXT,
  created_at TEXT,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_cliente ON avaliacoes_cliente (cliente_id);

CREATE TABLE IF NOT EXISTS interacoes_cliente (
  id TEXT PRIMARY KEY,
  cliente_id TEXT,
  created_at TEXT,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_interacoes_cliente ON interacoes_cliente (cliente_id);

-- ManterAgendamento
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  cliente_id TEXT,
  professional_id TEXT,
  datetime TEXT,
  status TEXT,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_appt_cliente ON appointments (cliente_id);
CREATE INDEX IF NOT EXISTS idx_appt_prof ON appointments (professional_id);
CREATE INDEX IF NOT EXISTS idx_appt_datetime ON appointments (datetime);
CREATE INDEX IF NOT EXISTS idx_appt_status ON appointments (status);

-- ManterProcedimento
CREATE TABLE IF NOT EXISTS procedures (
  id TEXT PRIMARY KEY,
  name TEXT,
  active INTEGER,
  data TEXT NOT NULL
);

-- ManterFinanceiro / Despesas + FluxoCaixa
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT,
  status TEXT,
  due_date TEXT,
  paid_date TEXT,
  cliente_id TEXT,
  amount REAL,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tx_due ON transactions (due_date);

-- ManterFinanceiro / Fechamento
CREATE TABLE IF NOT EXISTS fechamentos (
  id TEXT PRIMARY KEY,
  periodo_inicio TEXT,
  periodo_fim TEXT,
  created_at TEXT,
  data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fech_periodo ON fechamentos (periodo_inicio, periodo_fim);

-- Remove tabelas de módulos que não existem mais
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS tarefas;
DROP TABLE IF EXISTS mensagem_templates;
DROP TABLE IF EXISTS pacotes;
DROP TABLE IF EXISTS trocas;
DROP TABLE IF EXISTS whatsapp_config;
DROP TABLE IF EXISTS whatsapp_conversas;
DROP TABLE IF EXISTS whatsapp_mensagens;
DROP TABLE IF EXISTS whatsapp_auto_replies;
DROP TABLE IF EXISTS historico;
DROP TABLE IF EXISTS audit_logs;
