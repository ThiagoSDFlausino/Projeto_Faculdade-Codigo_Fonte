import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ArrowUpCircle, Wallet } from "lucide-react";
import { toast } from "sonner";
import api, { brl } from "@/lib/api";
import { invalidateClienteImpact } from "@/lib/invalidateCliente";
import { resolvePeriodRange, periodLabel } from "@/lib/period";
import { PageHeader, Card, StatHero } from "@/components/Shared";
import PeriodFilters from "@/components/PeriodFilters";
import { ListPagination, usePagination } from "@/components/ListPagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

const empty = { description: "", category: "", amount: "", party: "", due_date: "" };

export default function Despesas() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [preset, setPreset] = useState("tudo");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const range = useMemo(() => resolvePeriodRange(preset, customFrom, customTo), [preset, customFrom, customTo]);
  const periodoTxt = periodLabel(preset, range.from, range.to);

  const { data: txs = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => (await api.get("/transactions")).data,
  });

  const invalidate = () => invalidateClienteImpact(qc);

  const createMut = useMutation({
    mutationFn: (payload) => api.post("/transactions", { ...payload, type: "despesa" }),
    onSuccess: () => { invalidate(); setOpen(false); setForm(empty); toast.success("Despesa registrada!"); },
    onError: () => toast.error("Erro ao registrar despesa"),
  });
  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/transactions/${id}`),
    onSuccess: () => { invalidate(); toast.success("Despesa removida"); },
  });

  const inPeriod = (t) => {
    if (!range.from && !range.to) return true;
    const d = (t.data || t.due_date || "").slice(0, 10);
    if (!d) return false;
    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;
    return true;
  };

  const despesas = txs.filter((t) => t.type !== "receita").filter(inPeriod);
  const pager = usePagination(despesas, { pageSize: 12, resetKey: `${range.from}-${range.to}` });
  const total = despesas.reduce((s, t) => s + (t.amount || 0), 0);

  const submit = (e) => {
    e.preventDefault();
    createMut.mutate({ ...form, type: "despesa", amount: parseFloat(form.amount) || 0 });
  };

  return (
    <div>
      <PageHeader
        title="Manter Despesas"
        subtitle={`Cadastro de saídas · receita/pago vem da Agenda (Concluído) · ${periodoTxt}`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-transaction-button" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-200">
                <Plus className="w-4 h-4 mr-1" /> Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-rose-100">
              <DialogHeader>
                <DialogTitle className="font-display">Nova Despesa</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <Label>Descrição</Label>
                  <Input data-testid="tx-description-input" className="mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Categoria</Label>
                    <Input data-testid="tx-category-input" className="mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Aluguel, Insumos" />
                  </div>
                  <div>
                    <Label>Fornecedor / Parte</Label>
                    <Input className="mt-1" value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Valor (R$)</Label>
                    <Input data-testid="tx-amount-input" type="number" step="0.01" className="mt-1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Data</Label>
                    <Input data-testid="tx-due-input" type="date" className="mt-1" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
                  </div>
                </div>
                <DialogFooter>
                  <Button data-testid="tx-submit-button" type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

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
        testid="financeiro-filters"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatHero label="Total de despesas" value={brl(total)} icon={Wallet} color="rose" delay={0} />
        <StatHero label="Quantidade" value={despesas.length} icon={ArrowUpCircle} color="amber" delay={0.05} subtitle="no período" />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-400">Carregando...</div>
        ) : despesas.length === 0 ? (
          <div className="p-10 text-center text-slate-400">Nenhuma despesa encontrada.</div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-rose-50" data-testid="transactions-cards">
              {pager.pageItems.map((t) => (
                <div key={t.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{t.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.category || "—"} · {t.data || t.due_date || "—"}{t.usuario_nome ? ` · ${t.usuario_nome}` : ""}</p>
                    </div>
                    <p className="font-semibold text-red-500 shrink-0">- {brl(t.amount)}</p>
                  </div>
                  <div className="flex justify-end">
                    <button data-testid={`delete-tx-${t.id}`} onClick={() => delMut.mutate(t.id)} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50" title="Excluir">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm" data-testid="transactions-table">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-rose-100 text-xs uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Descrição</th>
                    <th className="px-5 py-3 font-medium">Categoria</th>
                    <th className="px-5 py-3 font-medium">Data</th>
                    <th className="px-5 py-3 font-medium text-right">Valor</th>
                    <th className="px-5 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {pager.pageItems.map((t) => (
                      <motion.tr key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b border-rose-50 hover:bg-rose-50/40">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <ArrowUpCircle className="w-4 h-4 text-red-400" />
                            <span className="font-medium text-slate-700">{t.description}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{t.category || "—"}{t.usuario_nome ? ` · ${t.usuario_nome}` : ""}</td>
                        <td className="px-5 py-3 text-slate-500">{t.data || t.due_date || "—"}</td>
                        <td className="px-5 py-3 text-right font-semibold text-red-500">- {brl(t.amount)}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end">
                            <button data-testid={`delete-tx-${t.id}`} onClick={() => delMut.mutate(t.id)} className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50" title="Excluir">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </>
        )}
        {despesas.length > 0 && (
          <ListPagination page={pager.page} totalPages={pager.totalPages} total={pager.total} from={pager.from} to={pager.to} onPageChange={pager.setPage} />
        )}
      </Card>
    </div>
  );
}
