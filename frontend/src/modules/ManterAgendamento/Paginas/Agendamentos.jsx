import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Clock, User, MapPin, Trash2, Check, List, Calendar as CalIcon, Columns3 } from "lucide-react";
import { toast } from "sonner";
import api, { brl } from "@/lib/api";
import { invalidateClienteImpact } from "@/lib/invalidateCliente";
import { PageHeader, Card, StatusBadge } from "@/components/Shared";
import { ListPagination, usePagination, KanbanColumnPager } from "@/components/ListPagination";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const empty = {
  cliente_name: "",
  procedure: "",
  procedure_id: "",
  professional_id: "",
  room: "Sala 1",
  status: "Agendado",
  value: "",
  observacoes: "",
};
const KANBAN = ["Agendado", "Confirmado", "Concluído", "Cancelado"];

function addMinutesLocal(isoLocal, minutes) {
  if (!isoLocal) return "";
  const m = String(isoLocal).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  d.setMinutes(d.getMinutes() + (Number(minutes) || 0));
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function inicioOf(a) {
  return a.data_hora_inicio || a.datetime || "";
}

export default function Agendamentos() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isPro = user?.role === "profissional";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [dtInicio, setDtInicio] = useState("");
  const [dtFim, setDtFim] = useState("");
  const [view, setView] = useState("lista");
  const [filterPro, setFilterPro] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: appts = [], isLoading } = useQuery({ queryKey: ["appointments"], queryFn: async () => (await api.get("/appointments")).data });
  const { data: professionals = [] } = useQuery({ queryKey: ["professionals"], queryFn: async () => (await api.get("/professionals")).data });
  const { data: procedures = [] } = useQuery({ queryKey: ["procedures"], queryFn: async () => (await api.get("/procedures")).data });
  const { data: clientes = [] } = useQuery({ queryKey: ["clientes"], queryFn: async () => (await api.get("/clientes")).data });

  const createMut = useMutation({
    mutationFn: (p) => api.post("/appointments", p),
    onSuccess: () => {
      invalidateClienteImpact(qc, form.cliente_id || undefined);
      setOpen(false);
      setForm(empty);
      setDtInicio("");
      setDtFim("");
      toast.success("Agendamento criado!");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Erro ao agendar"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/appointments/${id}`, payload),
    onSuccess: (_d, vars) => { invalidateClienteImpact(qc, vars?.payload?.cliente_id); toast.success("Atualizado!"); },
  });
  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/appointments/${id}`),
    onSuccess: () => { invalidateClienteImpact(qc); toast.success("Removido"); },
  });

  const filtered = useMemo(() => appts.filter((a) => {
    if (filterPro !== "all" && a.professional_id !== filterPro) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    return true;
  }), [appts, filterPro, filterStatus]);

  const listPager = usePagination(filtered, { pageSize: 12, resetKey: `${filterPro}-${filterStatus}-${view}` });

  const pageGrouped = listPager.pageItems.reduce((acc, a) => {
    const day = inicioOf(a).slice(0, 10) || "Sem data";
    (acc[day] = acc[day] || []).push(a);
    return acc;
  }, {});
  const pageDays = Object.keys(pageGrouped).sort();

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(KANBAN.map((s) => [s, []]));
    filtered.forEach((a) => { (map[a.status] || map.Agendado).push(a); });
    return map;
  }, [filtered]);

  const calendarDays = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const cells = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, key, items: filtered.filter((a) => inicioOf(a).startsWith(key)) });
    }
    return cells;
  }, [filtered]);

  const fmtDay = (d) => {
    if (d === "Sem data") return d;
    try { return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }); }
    catch { return d; }
  };

  const payloadFrom = (a, status) => ({
    cliente_id: a.cliente_id,
    cliente_name: a.cliente_name,
    professional_id: a.professional_id,
    procedure: a.procedure,
    procedure_id: a.procedure_id,
    data_hora_inicio: inicioOf(a),
    data_hora_fim: a.data_hora_fim || "",
    datetime: inicioOf(a),
    room: a.room,
    observacoes: a.observacoes || "",
    status,
    value: a.valor_cobrado ?? a.value,
    valor_cobrado: a.valor_cobrado ?? a.value,
  });

  const professionalId = isPro ? user?.id : form.professional_id;
  const selectedPro = professionals.find((p) => p.id === professionalId) || (isPro ? user : null);
  const proceduresForPro = useMemo(() => {
    const active = procedures.filter((p) => p.active !== false);
    const allowed = selectedPro?.procedimento_ids || [];
    if (!allowed.length) return active;
    return active.filter((p) => allowed.includes(p.id));
  }, [procedures, selectedPro]);

  const onSelectProcedure = (v) => {
    const p = procedures.find((x) => x.id === v);
    const next = {
      ...form,
      procedure_id: v,
      procedure: p?.name || "",
      value: p ? p.price : form.value,
    };
    setForm(next);
    if (dtInicio && p?.duration_min) {
      setDtFim(addMinutesLocal(dtInicio, p.duration_min));
    }
  };

  const onChangeInicio = (v) => {
    setDtInicio(v);
    const p = procedures.find((x) => x.id === form.procedure_id);
    if (v && p?.duration_min) setDtFim(addMinutesLocal(v, p.duration_min));
  };

  const submitAgendamento = (e) => {
    e.preventDefault();
    const cliente = clientes.find((c) => c.name === form.cliente_name);
    createMut.mutate({
      ...form,
      cliente_id: cliente?.id || form.cliente_id || "",
      data_hora_inicio: dtInicio,
      data_hora_fim: dtFim,
      datetime: dtInicio,
      value: parseFloat(form.value) || 0,
      valor_cobrado: parseFloat(form.value) || 0,
    });
  };

  return (
    <div>
      <PageHeader
        title={isPro ? "Minha Agenda" : "Manter Agenda"}
        subtitle="Cliente + profissional + procedimento · início, fim, valor e observações"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-appointment-button" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-200">
                <Plus className="w-4 h-4 mr-1" /> Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-rose-100 max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-display">Novo Agendamento</DialogTitle></DialogHeader>
              <form onSubmit={submitAgendamento} className="space-y-3">
                <div>
                  <Label>Cliente</Label>
                  <Input data-testid="appt-client-input" className="mt-1" list="clientes-list" value={form.cliente_name} onChange={(e) => setForm({ ...form, cliente_name: e.target.value })} required />
                  <datalist id="clientes-list">{clientes.map((c) => <option key={c.id} value={c.name} />)}</datalist>
                </div>
                {!isPro && (
                  <div>
                    <Label>Profissional</Label>
                    <Select value={form.professional_id} onValueChange={(v) => setForm({ ...form, professional_id: v, procedure_id: "", procedure: "" })}>
                      <SelectTrigger data-testid="appt-professional-select" className="mt-1"><SelectValue placeholder="Selecione o profissional" /></SelectTrigger>
                      <SelectContent>{professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Procedimento</Label>
                  <Select value={form.procedure_id} onValueChange={onSelectProcedure}>
                    <SelectTrigger data-testid="appt-procedure-select" className="mt-1"><SelectValue placeholder="Selecione o procedimento" /></SelectTrigger>
                    <SelectContent>{proceduresForPro.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {brl(p.price)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Data/Hora início</Label>
                    <Input data-testid="appt-datetime-input" type="datetime-local" className="mt-1" value={dtInicio} onChange={(e) => onChangeInicio(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Data/Hora fim</Label>
                    <Input type="datetime-local" className="mt-1" value={dtFim} onChange={(e) => setDtFim(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Sala</Label>
                    <Select value={form.room} onValueChange={(v) => setForm({ ...form, room: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sala 1">Sala 1</SelectItem>
                        <SelectItem value="Sala 2">Sala 2</SelectItem>
                        <SelectItem value="Sala 3">Sala 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Valor cobrado (R$)</Label><Input type="number" step="0.01" className="mt-1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Input className="mt-1" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Opcional" />
                </div>
                <DialogFooter><Button data-testid="appt-submit-button" type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {[
          { id: "lista", icon: List, label: "Lista" },
          { id: "calendario", icon: CalIcon, label: "Calendário" },
          { id: "kanban", icon: Columns3, label: "Kanban" },
        ].map((v) => (
          <button key={v.id} onClick={() => setView(v.id)} className={`flex items-center gap-1.5 min-h-11 px-3.5 py-2 rounded-xl text-sm ${view === v.id ? "bg-rose-100 text-rose-600" : "bg-white border border-rose-100 text-slate-500"}`}>
            <v.icon className="w-4 h-4" /> {v.label}
          </button>
        ))}
        {!isPro && (
          <Select value={filterPro} onValueChange={setFilterPro}>
            <SelectTrigger className="w-full sm:w-44 h-11 rounded-xl"><SelectValue placeholder="Profissional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos profissionais</SelectItem>
              {professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40 h-11 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {KANBAN.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl ai-shimmer" />)}</div>
        : view === "lista" ? (
        filtered.length === 0 ? <Card className="p-10 text-center text-slate-400">Nenhum agendamento.</Card> : (
          <>
            <div className="space-y-6" data-testid="appointments-list">
              {pageDays.map((day) => (
                <div key={day}>
                  <h3 className="font-display font-semibold text-slate-700 capitalize mb-3">{fmtDay(day)}</h3>
                  <div className="space-y-3">
                    {pageGrouped[day].map((a, i) => (
                      <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                        <Card className="p-4">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-rose-50 text-rose-500">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-bold mt-1">{inicioOf(a).slice(11, 16) || "--"}</span>
                                {a.data_hora_fim ? <span className="text-[10px] text-rose-400">{a.data_hora_fim.slice(11, 16)}</span> : null}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">{a.procedure}</p>
                                <p className="text-sm text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> {a.cliente_name}</p>
                                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>{a.professional || "—"}</span> • <MapPin className="w-3 h-3" /> {a.room}
                                  {(a.valor_cobrado ?? a.value) ? <span className="text-emerald-600 font-medium">• {brl(a.valor_cobrado ?? a.value)}</span> : null}
                                </p>
                                {a.observacoes ? <p className="text-xs text-slate-400 mt-0.5 italic truncate max-w-md">{a.observacoes}</p> : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={a.status} />
                              {a.status === "Agendado" && (
                                <button data-testid={`confirm-appt-${a.id}`} onClick={() => updateMut.mutate({ id: a.id, payload: payloadFrom(a, "Confirmado") })} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-emerald-500 hover:bg-emerald-50" title="Confirmar"><Check className="w-5 h-5" /></button>
                              )}
                              <button data-testid={`delete-appt-${a.id}`} onClick={() => delMut.mutate(a.id)} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Card className="mt-4 overflow-hidden">
              <ListPagination page={listPager.page} totalPages={listPager.totalPages} total={listPager.total} from={listPager.from} to={listPager.to} onPageChange={listPager.setPage} />
            </Card>
          </>
        )
      ) : view === "calendario" ? (
        <Card className="p-4" data-testid="appointments-calendar">
          <div className="md:hidden space-y-3">
            <p className="text-sm font-semibold text-slate-600">
              Hoje — {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </p>
            {(() => {
              const todayKey = new Date().toISOString().slice(0, 10);
              const todayItems = filtered
                .filter((a) => inicioOf(a).startsWith(todayKey))
                .sort((a, b) => String(inicioOf(a)).localeCompare(String(inicioOf(b))));
              if (!todayItems.length) {
                return <p className="text-sm text-slate-400 py-6 text-center">Nada agendado para hoje. Use a lista ou o calendário no tablet/desktop.</p>;
              }
              return todayItems.map((a) => (
                <Card key={a.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-800">{inicioOf(a).slice(11, 16)}{a.data_hora_fim ? `–${a.data_hora_fim.slice(11, 16)}` : ""} · {a.procedure}</p>
                      <p className="text-sm text-slate-500">{a.cliente_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{a.professional || "—"} · {a.room}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                </Card>
              ));
            })()}
            <p className="text-xs text-slate-400 text-center pt-2">Calendário mensal disponível em telas maiores.</p>
          </div>
          <div className="hidden md:grid grid-cols-7 gap-2">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>)}
            {calendarDays.map((cell, idx) => (
              <div key={idx} className={`min-h-20 rounded-xl border border-rose-50 p-1 ${cell ? "bg-white" : "bg-transparent border-transparent"}`}>
                {cell && (
                  <>
                    <p className="text-xs font-semibold text-slate-500 px-1">{cell.day}</p>
                    {cell.items.slice(0, 3).map((a) => (
                      <div key={a.id} className="text-[10px] truncate px-1 py-0.5 rounded bg-rose-50 text-rose-600 mb-0.5">{inicioOf(a).slice(11, 16)} {a.cliente_name}</div>
                    ))}
                    {cell.items.length > 3 && <p className="text-[10px] text-slate-400 px-1">+{cell.items.length - 3}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col md:flex-row gap-3 md:overflow-x-auto pb-2" data-testid="appointments-kanban">
          {KANBAN.map((status) => (
            <div key={status} className="w-full md:min-w-[240px] md:w-[240px] md:flex-shrink-0">
              <p className="text-xs uppercase font-semibold text-slate-500 mb-2 px-1">{status} ({byStatus[status].length})</p>
              <div className="space-y-2 p-2 rounded-2xl bg-rose-50/40 border border-rose-100 min-h-[120px] md:min-h-[160px]">
                <KanbanColumnPager items={byStatus[status]} pageSize={8}>
                  {(a) => (
                    <Card key={a.id} className="p-3">
                      <p className="font-semibold text-sm text-slate-800">{a.procedure}</p>
                      <p className="text-xs text-slate-400">{a.cliente_name} · {inicioOf(a).slice(0, 16).replace("T", " ")}</p>
                      <Select value={a.status} onValueChange={(v) => updateMut.mutate({ id: a.id, payload: payloadFrom(a, v) })}>
                        <SelectTrigger className="mt-2 h-10 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{KANBAN.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </Card>
                  )}
                </KanbanColumnPager>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
