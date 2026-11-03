import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, Users, CalendarCheck,
  CalendarClock, Activity, Clock, AlertTriangle, RefreshCcw, CalendarDays,
  Gift, UserPlus, DollarSign, BarChart3, ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell, LineChart, Line, ComposedChart,
} from "recharts";
import api, { brl } from "@/lib/api";
import { resolvePeriodRange, toApiParams, periodLabel } from "@/lib/period";
import { PageHeader, Card, StatusBadge, StatHero } from "@/components/Shared";
import PeriodFilters from "@/components/PeriodFilters";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const CHART_COLORS = ["#E87A90", "#F0A04B", "#EC6FA8", "#9B6B9E", "#34D399", "#60A5FA"];

const MiniStat = ({ label, value, hint, icon: Icon, href }) => {
  const inner = (
    <Card className={`p-4 hover:shadow-md transition-shadow h-full ${href ? "cursor-pointer hover:border-rose-200" : ""}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-500">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
            <Icon className="w-4 h-4 text-rose-500" />
          </div>
        )}
      </div>
      <p className="font-display text-2xl font-bold text-slate-800">{value ?? 0}</p>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </Card>
  );
  return href ? <Link to={href} className="block h-full">{inner}</Link> : inner;
};

const ChartShell = ({ title, children, href, hrefLabel = "Ver mais", testid }) => (
  <Card className="h-full overflow-hidden flex flex-col" data-testid={testid}>
    <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100/80">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-slate-400" />
        <h3 className="font-display font-semibold text-slate-800">{title}</h3>
      </div>
      {href && (
        <Link to={href} className="text-sm text-rose-500 hover:underline flex items-center gap-1">
          {hrefLabel} <ArrowUpRight className="w-3 h-3" />
        </Link>
      )}
    </div>
    <div className="p-5 flex-1">{children}</div>
  </Card>
);

const ProximosList = ({ items, title = "Atendimentos de Hoje", href = "/agendamentos" }) => (
  <Card className="p-5 h-full" data-testid="upcoming-appointments">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-display font-semibold text-slate-800">{title}</h3>
      <Link to={href} className="text-xs text-rose-500 hover:underline flex items-center gap-1">Agenda <ArrowUpRight className="w-3 h-3" /></Link>
    </div>
    {(!items || items.length === 0) ? (
      <p className="text-slate-400 text-sm">Nenhum agendamento.</p>
    ) : (
      <div className="space-y-3">
        {items.slice(0, 6).map((a) => (
          <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-rose-50/80 to-transparent border border-rose-100">
            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-white text-rose-500 shrink-0 shadow-sm">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-bold mt-0.5">{(a.datetime || "").slice(11, 16)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-700 text-sm truncate">{a.procedure}</p>
              <p className="text-xs text-slate-400 truncate">{a.cliente_name} • {a.professional || "—"}</p>
            </div>
            <StatusBadge status={a.status} />
          </div>
        ))}
      </div>
    )}
  </Card>
);

const formatDia = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return String(iso).slice(0, 10);
  }
};

/** Painel Atenção com nomes (não só contagem) */
const AtencaoPanel = ({ data }) => {
  const inativos = Array.isArray(data.clientes_inativos_lista) ? data.clientes_inativos_lista : [];
  const anivRaw = data.aniversariantes || data.aniversariantes_mes;
  const aniv = Array.isArray(anivRaw) ? anivRaw : [];
  // Fallback: se a API ainda não mandar a lista, monta a partir da agenda já carregada
  const ativosFromApi = Array.isArray(data.agendamentos_ativos_lista) ? data.agendamentos_ativos_lista : [];
  // agendamentos_hoje é lista no admin e contagem (number) na recepção/profissional
  const hojeLista = Array.isArray(data.agendamentos_hoje) ? data.agendamentos_hoje : [];
  const proximosLista = Array.isArray(data.proximos) ? data.proximos : [];
  const ativosFallback = [...proximosLista, ...hojeLista]
    .filter((a) => ["Agendado", "Confirmado"].includes(a.status))
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i);
  const ativos = ativosFromApi.length > 0 ? ativosFromApi : ativosFallback;
  const nInativos = data.clientes_inativos_30d ?? inativos.length;
  const nAniv = aniv.length;
  const nAtivos = data.agendamentos_ativos ?? ativos.length;

  return (
    <Card className="p-5 h-full" data-testid="attention-panel">
      <h3 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" /> Atenção
      </h3>
      <div className="space-y-3">
        <div className="rounded-xl bg-amber-50 border border-amber-100 overflow-hidden">
          <div className="flex justify-between items-center p-3">
            <span className="text-sm font-medium text-slate-700">Inativos 30+ dias</span>
            <span className="font-bold text-amber-700">{nInativos}</span>
          </div>
          {inativos.length > 0 ? (
            <ul className="px-3 pb-3 space-y-1.5 border-t border-amber-100/80 pt-2">
              {inativos.map((c) => (
                <li key={c.id}>
                  <Link to={`/clientes/${c.id}`} className="flex items-center justify-between gap-2 text-sm hover:text-amber-800 group">
                    <span className="truncate text-slate-600 group-hover:text-amber-900">{c.name || c.nome}</span>
                    <span className="text-[11px] text-amber-600/80 shrink-0">última {formatDia(c.ultima_visita)}</span>
                  </Link>
                </li>
              ))}
              {nInativos > inativos.length && (
                <li className="text-[11px] text-amber-600/70 pt-0.5">+{nInativos - inativos.length} outros</li>
              )}
            </ul>
          ) : nInativos > 0 ? (
            <p className="px-3 pb-3 text-xs text-amber-700/80">
              {nInativos} cliente{nInativos > 1 ? "s" : ""} sem visita há 30+ dias.{" "}
              <Link to="/clientes" className="underline font-medium">Ver clientes</Link>
            </p>
          ) : (
            <p className="px-3 pb-3 text-xs text-slate-400">Nenhum cliente inativo.</p>
          )}
        </div>

        <div className="rounded-xl bg-rose-50 border border-rose-100 overflow-hidden">
          <div className="flex justify-between items-center p-3">
            <span className="text-sm font-medium text-slate-700">Aniversariantes do mês</span>
            <span className="font-bold text-rose-600">{nAniv}</span>
          </div>
          {aniv.length > 0 ? (
            <ul className="px-3 pb-3 space-y-1.5 border-t border-rose-100/80 pt-2">
              {aniv.slice(0, 12).map((b) => (
                <li key={b.id}>
                  <Link to={`/clientes/${b.id}`} className="flex items-center justify-between gap-2 text-sm hover:text-rose-700 group">
                    <span className="truncate text-slate-600 group-hover:text-rose-900">{b.name || b.nome}</span>
                    <span className="text-[11px] text-rose-500 shrink-0">dia {b.day || (b.data_nascimento || "").slice(8, 10)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 pb-3 text-xs text-slate-400">Nenhum aniversariante este mês.</p>
          )}
        </div>

        <div className="rounded-xl bg-sky-50 border border-sky-100 overflow-hidden">
          <div className="flex justify-between items-center p-3">
            <span className="text-sm font-medium text-slate-700">Agendamentos ativos</span>
            <span className="font-bold text-sky-600">{nAtivos}</span>
          </div>
          {ativos.length > 0 ? (
            <ul className="px-3 pb-3 space-y-2 border-t border-sky-100/80 pt-2">
              {ativos.map((a) => (
                <li key={a.id} className="text-sm">
                  {a.cliente_id ? (
                    <Link to={`/clientes/${a.cliente_id}`} className="block hover:bg-sky-100/50 rounded-lg -mx-1 px-1 py-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-700 truncate">{a.cliente_name}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {(a.datetime || "").slice(0, 16).replace("T", " ")} · {a.procedure || "—"}
                        {a.professional ? ` · ${a.professional}` : ""}
                      </p>
                    </Link>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-700 truncate">{a.cliente_name}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {(a.datetime || "").slice(0, 16).replace("T", " ")} · {a.procedure || "—"}
                      </p>
                    </div>
                  )}
                </li>
              ))}
              {nAtivos > ativos.length && (
                <li className="text-[11px] text-sky-600/70">
                  <Link to="/agendamentos" className="hover:underline">+{nAtivos - ativos.length} na agenda →</Link>
                </li>
              )}
            </ul>
          ) : (
            <p className="px-3 pb-3 text-xs text-slate-400">Nenhum agendamento ativo.</p>
          )}
        </div>
      </div>
    </Card>
  );
};

const Aniversariantes = ({ items }) => (
  (items && items.length > 0) ? (
    <Card className="p-5" data-testid="birthdays-card">
      <h3 className="font-display font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Gift className="w-4 h-4 text-rose-400" /> Aniversariantes do mês
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((b) => (
          <Link key={b.id} to={`/clientes/${b.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-rose-50/60">
            {b.photo ? <img src={b.photo} alt={b.name || b.nome} className="w-9 h-9 rounded-full object-cover ring-2 ring-rose-100" /> :
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">{(b.name || b.nome || "?").charAt(0)}</div>}
            <div>
              <p className="text-sm font-medium text-slate-700">{b.name || b.nome}</p>
              <p className="text-xs text-rose-400">dia {b.day || (b.data_nascimento || "").slice(8, 10)}</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  ) : null
);

export default function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [preset, setPreset] = useState("mes");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [professionalId, setProfessionalId] = useState("all");
  const [procedure, setProcedure] = useState("all");

  const range = useMemo(() => resolvePeriodRange(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const apiParams = useMemo(
    () => toApiParams({
      from: range.from,
      to: range.to,
      professional_id: user?.role === "profissional" ? undefined : professionalId,
      procedure,
    }),
    [range, professionalId, procedure, user?.role],
  );
  const periodoTxt = periodLabel(preset, range.from, range.to);

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => (await api.get("/professionals")).data,
    enabled: user?.role === "admin" || user?.role === "secretaria",
  });
  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures"],
    queryFn: async () => (await api.get("/procedures")).data,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["dashboard", apiParams],
    queryFn: async () => (await api.get("/dashboard", { params: apiParams })).data,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const filtersBar = (
    <PeriodFilters
      preset={preset}
      onPresetChange={(id) => {
        setPreset(id);
        if (id !== "custom") {
          const r = resolvePeriodRange(id);
          setCustomFrom(r.from);
          setCustomTo(r.to);
        }
      }}
      from={customFrom || range.from}
      to={customTo || range.to}
      onFromChange={(v) => { setPreset("custom"); setCustomFrom(v); }}
      onToChange={(v) => { setPreset("custom"); setCustomTo(v); }}
      professionals={user?.role === "profissional" ? undefined : professionals}
      professionalId={professionalId}
      onProfessionalChange={user?.role === "profissional" ? undefined : setProfessionalId}
      procedures={procedures}
      procedure={procedure}
      onProcedureChange={setProcedure}
      testid="dashboard-filters"
    />
  );

  if (isLoading || !data)
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Carregando visão geral..." />
        {filtersBar}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl ai-shimmer" />)}</div>
      </div>
    );

  // PROFISSIONAL
  if (data.role === "profissional")
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Olá, ${(user?.name || "").replace(/^(Dra?\.|Dr\.)\s*/, "").split(" ")[0] || "Profissional"}`}
          subtitle={`${data.specialty || "Profissional"} • Meu Painel`}
          action={
            <Button variant="outline" size="sm" className="rounded-xl" onClick={refresh} disabled={isFetching}>
              <RefreshCcw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
            </Button>
          }
        />
        {filtersBar}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatHero testid="metric-revenue" label="Faturamento do período" value={brl(data.faturamento_mes || 0)} variation={data.faturamento_variacao} icon={DollarSign} color="emerald" delay={0} subtitle={periodoTxt} />
          <StatHero testid="metric-sessions-month" label="Atendimentos" value={data.total_atendimentos ?? data.sessoes_mes} variation={data.atendimentos_variacao} icon={Activity} color="mauve" delay={0.05} href="/agendamentos" subtitle={periodoTxt} />
          <StatHero testid="metric-occupancy" label="Taxa de Ocupação" value={`${(data.taxa_ocupacao || 0).toFixed(0)}%`} icon={CalendarCheck} color="sky" delay={0.1} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartShell title={`Meu Faturamento — ${periodoTxt}`} testid="chart-daily-pro">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.faturamento_diario || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e0e6" vertical={false} />
                <XAxis dataKey="data" stroke="#b9a5ad" fontSize={10} tickFormatter={(v) => (v || "").slice(8, 10)} tickLine={false} axisLine={false} />
                <YAxis stroke="#b9a5ad" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => brl(v)} labelFormatter={(l) => l} contentStyle={{ borderRadius: 12, border: "1px solid #f3d0d9" }} />
                <Line type="monotone" dataKey="valor" stroke="#E87A90" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartShell>
          <ProximosList items={data.proximos} title="Próximos Atendimentos" />
        </div>
      </div>
    );

  // SECRETARIA
  if (data.role === "secretaria")
    return (
      <div className="space-y-6">
        <PageHeader
          title="Central de Atendimento"
          subtitle="Recepção • agenda e clientes"
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={refresh}><RefreshCcw className="w-4 h-4 mr-2" />Atualizar</Button>
              <Button asChild size="sm" className="rounded-xl bg-rose-500 hover:bg-rose-600"><Link to="/clientes"><UserPlus className="w-4 h-4 mr-2" />Novo Cliente</Link></Button>
            </div>
          }
        />
        {filtersBar}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatHero testid="metric-today" label="Atendimentos Hoje" value={data.agendamentos_hoje} icon={CalendarClock} color="rose" delay={0} href="/agendamentos" />
          <StatHero testid="metric-active-clients" label="Clientes Ativos" value={data.clientes_ativos || data.total_clientes} icon={Users} color="mauve" delay={0.05} href="/clientes" />
          <StatHero testid="metric-new-clients" label="Clientes Novos" value={data.clientes_novos || 0} icon={UserPlus} color="sky" delay={0.1} subtitle={periodoTxt} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProximosList items={data.proximos} title="Agenda de Hoje" />
          <AtencaoPanel data={data} />
        </div>
      </div>
    );

  // ADMIN — Dashboard Estratégico
  const aniv = data.aniversariantes_mes || data.aniversariantes || [];
  const daily = data.faturamento_diario || [];
  const topServ = (data.atendimentos_por_servico || []).slice(0, 5);
  const topProf = data.receita_por_profissional || [];
  const novosSemana = data.novos_clientes_semana || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Estratégico"
        subtitle="Visão geral do desempenho da clínica"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={refresh} disabled={isFetching} data-testid="dashboard-refresh">
              <RefreshCcw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
            </Button>
            <Button asChild size="sm" className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90 shadow-md shadow-rose-200">
              <Link to="/agendamentos"><CalendarDays className="w-4 h-4 mr-2" /> Nova Agenda</Link>
            </Button>
          </div>
        }
      />

      {filtersBar}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatHero testid="metric-month-revenue" label="Faturamento do período" value={brl(data.faturamento_mes || 0)} variation={data.faturamento_variacao} subtitle={`vs período anterior · ${periodoTxt}`} icon={DollarSign} color="rose" delay={0} href="/financeiro" />
        <StatHero testid="metric-appointments-done" label="Atendimentos" value={data.total_atendimentos ?? 0} variation={data.atendimentos_variacao} subtitle="finalizados" icon={CalendarCheck} color="gold" delay={0.05} href="/agendamentos" />
        <StatHero testid="metric-ticket" label="Ticket Médio" value={brl(data.ticket_medio || 0)} variation={data.ticket_variacao} subtitle="por atendimento" icon={TrendingUp} color="blush" delay={0.1} />
        <StatHero testid="metric-new-clients" label="Clientes Novos" value={data.clientes_novos ?? 0} subtitle={periodoTxt} icon={UserPlus} color="mauve" delay={0.15} href="/clientes" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MiniStat label="Taxa de Retorno" value={`${(data.taxa_retorno || 0).toFixed(0)}%`} hint="clientes que voltaram" icon={RefreshCcw} href="/clientes" />
        <MiniStat label="Clientes Ativos" value={data.clientes_ativos || 0} hint="últimos 3 meses" icon={Users} href="/clientes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatHero testid="metric-receivable" label="A Receber" value={brl(data.a_receber || 0)} icon={ArrowDownCircle} color="sky" delay={0} href="/financeiro" />
        <StatHero testid="metric-payable" label="A Pagar" value={brl(data.a_pagar || 0)} icon={ArrowUpCircle} color="amber" delay={0.05} href="/financeiro" />
        <StatHero testid="metric-net" label="Lucro Líquido (pago)" value={brl(data.lucro || 0)} icon={Wallet} color="emerald" delay={0.1} href="/fluxo-caixa" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ChartShell title={`Faturamento — ${periodoTxt}`} href="/fluxo-caixa" hrefLabel="Ver fluxo" testid="chart-daily">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={daily}>
                <defs>
                  <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E05A78" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#E05A78" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e0e6" vertical={false} />
                <XAxis dataKey="data" stroke="#b9a5ad" fontSize={10} tickFormatter={(v) => (v || "").slice(5)} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="#b9a5ad" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => brl(v)} contentStyle={{ borderRadius: 12, border: "1px solid #f3d0d9" }} />
                <Area type="monotone" dataKey="valor" stroke="none" fill="url(#lineFill)" />
                <Line type="monotone" dataKey="valor" name="Receita" stroke="#E05A78" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "#E05A78" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartShell>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <ChartShell title="Top Serviços do período" href="/procedimentos" hrefLabel="Ver serviços" testid="chart-services">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topServ} layout="vertical" margin={{ left: 8, right: 12 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="servico" width={120} stroke="#8a7680" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f3d0d9" }} />
                <Bar dataKey="quantidade" name="Qtd" radius={[0, 10, 10, 0]}>
                  {topServ.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartShell>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartShell title="Receita por Profissional" testid="chart-professionals">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProf} layout="vertical" margin={{ left: 8, right: 12 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="profissional" width={120} stroke="#8a7680" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => brl(v)} contentStyle={{ borderRadius: 12, border: "1px solid #f3d0d9" }} />
              <Bar dataKey="receita" name="Receita" radius={[0, 8, 8, 0]} fill="#B57BD6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>
        <ChartShell title="Novos Clientes por Semana" href="/clientes" hrefLabel="Ver clientes" testid="chart-new-clients">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={novosSemana}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e0e6" vertical={false} />
              <XAxis dataKey="semana" stroke="#b9a5ad" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => (v || "").replace(/^\d+-S/, "S")} />
              <YAxis allowDecimals={false} stroke="#b9a5ad" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #f3d0d9" }} />
              <Bar dataKey="quantidade" name="Novos" fill="#EC6FA8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <AtencaoPanel data={data} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <ProximosList items={Array.isArray(data.agendamentos_hoje) ? data.agendamentos_hoje : (data.proximos || [])} title="Atendimentos de Hoje" />
          {(data.servico_mais_vendido || data.horario_mais_lucrativo) && (
            <Card className="p-4 flex flex-wrap gap-3 text-sm">
              {data.servico_mais_vendido && (
                <div className="flex-1 min-w-[140px] p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <p className="text-xs text-slate-500 mb-1">Mais vendido</p>
                  <p className="font-semibold text-purple-700 truncate">{data.servico_mais_vendido}</p>
                </div>
              )}
              {data.horario_mais_lucrativo && (
                <div className="flex-1 min-w-[140px] p-3 rounded-xl bg-sky-50 border border-sky-100">
                  <p className="text-xs text-slate-500 mb-1">Horário pico</p>
                  <p className="font-bold text-sky-700">{data.horario_mais_lucrativo}</p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {(data.clientes_alto_potencial || []).length > 0 && (
        <Card className="p-5" data-testid="top-clients">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-800">Top Clientes por Faturamento</h3>
            <Link to="/clientes" className="text-xs text-rose-500 hover:underline">Ver CRM</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {data.clientes_alto_potencial.map((c, i) => (
              <Link key={c.id} to={`/clientes/${c.id}`} className="p-3 rounded-xl border border-rose-100 hover:bg-rose-50/60 transition-colors">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">#{i + 1}</p>
                <p className="font-semibold text-slate-700 text-sm truncate">{c.nome || c.name}</p>
                <p className="text-rose-500 font-bold text-sm mt-1">{brl(c.total_gasto)}</p>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <ChartShell title="Faturamento Mensal (6 meses)" href="/fluxo-caixa" testid="chart-cashflow">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.chart || []} margin={{ left: -10 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E87A90" stopOpacity={0.4} /><stop offset="95%" stopColor="#E87A90" stopOpacity={0} /></linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#B57BD6" stopOpacity={0.3} /><stop offset="95%" stopColor="#B57BD6" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3e0e6" vertical={false} />
                <XAxis dataKey="mes" stroke="#b9a5ad" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#b9a5ad" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => brl(v)} contentStyle={{ borderRadius: 12, border: "1px solid #f3d0d9" }} />
                <Area type="monotone" dataKey="receita" name="Receita" stroke="#E87A90" strokeWidth={2.5} fill="url(#rev)" />
                <Area type="monotone" dataKey="despesa" name="Despesa" stroke="#B57BD6" strokeWidth={2.5} fill="url(#exp)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartShell>
      </motion.div>

      <Aniversariantes items={aniv} />
    </div>
  );
}
