import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, Trash2, Pencil, Stethoscope, TrendingUp, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import api, { brl } from "@/lib/api";
import { PageHeader, Card, StatHero } from "@/components/Shared";
import { ListPagination, usePagination } from "@/components/ListPagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

const empty = { name: "", category: "", price: 0, duration_min: 45, description: "", active: true };

export default function Procedimentos() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const { data: procedures = [], isLoading } = useQuery({ queryKey: ["procedures"], queryFn: async () => (await api.get("/procedures")).data });
  const { data: stats } = useQuery({
    queryKey: ["procedures-stats", "mes-card"],
    queryFn: async () => {
      const now = new Date();
      const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const to = now.toISOString().slice(0, 10);
      return (await api.get("/procedures/stats", { params: { from, to } })).data;
    },
  });

  const statsById = useMemo(() => {
    const map = {};
    for (const p of stats?.procedimentos || []) {
      if (p.id) map[p.id] = p;
      const n = String(p.name || "").trim().toLowerCase();
      if (n) map[`name:${n}`] = p;
    }
    return map;
  }, [stats]);

  const sorted = useMemo(
    () => [...procedures].sort((a, b) => {
      const sa = statsById[a.id]?.faturamento || statsById[`name:${String(a.name).trim().toLowerCase()}`]?.faturamento || 0;
      const sb = statsById[b.id]?.faturamento || statsById[`name:${String(b.name).trim().toLowerCase()}`]?.faturamento || 0;
      if (sb !== sa) return sb - sa;
      return String(a.category || "").localeCompare(String(b.category || "")) || String(a.name).localeCompare(String(b.name));
    }),
    [procedures, statsById],
  );
  const pager = usePagination(sorted, { pageSize: 12 });

  const pageByCat = pager.pageItems.reduce((acc, p) => {
    const cat = p.category || "Geral";
    (acc[cat] = acc[cat] || []).push(p);
    return acc;
  }, {});
  const cats = Object.keys(pageByCat).sort();

  const createMut = useMutation({
    mutationFn: (p) => api.post("/procedures", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["procedures"] });
      qc.invalidateQueries({ queryKey: ["procedures-stats"] });
      setOpen(false); setForm(empty); toast.success("Procedimento criado!");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Erro"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, p }) => api.put(`/procedures/${id}`, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["procedures"] });
      qc.invalidateQueries({ queryKey: ["procedures-stats"] });
      setEditing(null); toast.success("Atualizado!");
    },
  });
  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/procedures/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["procedures"] });
      qc.invalidateQueries({ queryKey: ["procedures-stats"] });
      toast.success("Removido");
    },
  });

  const submit = (e) => { e.preventDefault(); createMut.mutate({ ...form, price: parseFloat(form.price) || 0, duration_min: parseInt(form.duration_min) || 0 }); };

  const getStat = (p) => statsById[p.id] || statsById[`name:${String(p.name).trim().toLowerCase()}`];

  return (
    <div>
      <PageHeader
        title="Procedimentos"
        subtitle="Catálogo + quanto cada um faturou neste mês"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-procedure-button" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-200">
                <Plus className="w-4 h-4 mr-1" /> Novo Procedimento
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-rose-100">
              <DialogHeader><DialogTitle className="font-display">Novo Procedimento</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-3">
                <div><Label>Nome</Label><Input data-testid="procedure-name-input" className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>Categoria</Label><Input data-testid="procedure-category-input" className="mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Injetáveis, Facial..." /></div>
                  <div><Label>Duração (min)</Label><Input type="number" className="mt-1" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: e.target.value })} /></div>
                </div>
                <div><Label>Preço (R$)</Label><Input data-testid="procedure-price-input" type="number" step="0.01" className="mt-1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
                <div><Label>Descrição</Label><Textarea className="mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <DialogFooter><Button data-testid="procedure-submit-button" type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatHero label="Faturamento (mês)" value={brl(stats?.total_faturamento || 0)} icon={TrendingUp} color="rose" delay={0} />
        <StatHero label="Atendimentos (mês)" value={stats?.total_atendimentos || 0} icon={Stethoscope} color="mauve" delay={0.05} />
        <StatHero label="Ticket médio" value={brl(stats?.ticket_medio || 0)} icon={BarChart3} color="gold" delay={0.1} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-28 rounded-2xl ai-shimmer" />)}</div>
      ) : (
        <>
          <div className="space-y-8" data-testid="procedures-list">
            {cats.map((cat) => (
              <div key={cat}>
                <h3 className="font-display font-semibold text-slate-700 mb-3 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-rose-400" /> {cat}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {pageByCat[cat].map((p, i) => {
                      const st = getStat(p);
                      return (
                        <motion.div key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }} whileHover={{ y: -3 }}>
                          <Card className="p-5 h-full">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-slate-800">{p.name}</p>
                                  {st?.ranking === 1 && st.faturamento > 0 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">#1 mês</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> {p.duration_min} min</p>
                              </div>
                              <div className="flex gap-1">
                                <button data-testid={`edit-procedure-${p.id}`} onClick={() => setEditing({ ...p })} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Pencil className="w-4 h-4" /></button>
                                <button data-testid={`delete-procedure-${p.id}`} onClick={() => delMut.mutate(p.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                            {p.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{p.description}</p>}
                            <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                              <div>
                                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Preço tabela</p>
                                <p className="font-display text-xl font-bold text-rose-600">{brl(p.price)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Faturou no mês</p>
                                <p className="font-semibold text-slate-800">{brl(st?.faturamento || 0)}</p>
                                <p className="text-xs text-slate-400">
                                  {st?.atendimentos || 0} atend. · {st?.pct_faturamento || 0}%
                                </p>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
          {procedures.length > 0 && (
            <Card className="mt-4 overflow-hidden">
              <ListPagination page={pager.page} totalPages={pager.totalPages} total={pager.total} from={pager.from} to={pager.to} onPageChange={pager.setPage} />
            </Card>
          )}
        </>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="rounded-3xl border-rose-100">
          <DialogHeader><DialogTitle className="font-display">Editar Procedimento</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={(e) => { e.preventDefault(); updateMut.mutate({ id: editing.id, p: { name: editing.name, category: editing.category, price: parseFloat(editing.price) || 0, duration_min: parseInt(editing.duration_min) || 0, description: editing.description || "", active: true } }); }} className="space-y-3">
              <div><Label>Nome</Label><Input className="mt-1" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Categoria</Label><Input className="mt-1" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
                <div><Label>Duração (min)</Label><Input type="number" className="mt-1" value={editing.duration_min} onChange={(e) => setEditing({ ...editing, duration_min: e.target.value })} /></div>
              </div>
              <div><Label>Preço (R$)</Label><Input type="number" step="0.01" className="mt-1" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea className="mt-1" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <DialogFooter><Button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">Salvar</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
