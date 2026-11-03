import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, ArrowDownCircle, ArrowUpCircle, Wallet, Clock } from "lucide-react";
import { toast } from "sonner";
import api, { brl } from "@/lib/api";
import { invalidateClienteImpact } from "@/lib/invalidateCliente";
import { resolvePeriodRange, periodLabel } from "@/lib/period";
import { PageHeader, Card, StatusBadge, StatHero } from "@/components/Shared";
import PeriodFilters from "@/components/PeriodFilters";
import { ListPagination, usePagination } from "@/components/ListPagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const empty = { type: "receita", description: "", category: "", amount: "", status: "Pendente", party: "", due_date: "" };

export default function Financeiro() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("todos");
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
    mutationFn: (payload) => api.post("/transactions", payload),
    onSuccess: () => { invalidate(); setOpen(false); setForm(empty); toast.success("Lançamento criado!"); },
    onError: () => toast.error("Erro ao criar lançamento"),
  });
  const payMut = useMutation({
    mutationFn: (id) => api.patch(`/transactions/${id}/pay`),
    onSuccess: () => { invalidate(); toast.success("Marcado como pago!"); },
  });
  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/transactions/${id}`),
    onSuccess: () => { invalidate(); toast.success("Lançamento removido"); },
  });

  const inPeriod = (t) => {
    if (!range.from && !range.to) return true;
    const d = (t.paid_date || t.due_date || "").slice(0, 10);
    if (!d) return false;
    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;
    return true;
  };

  const periodTxs = txs.filter(inPeriod);
  const filtered = periodTxs.filter((t) => {
    if (filter === "todos") return true;
    if (filter === "receber") return t.type === "receita";
    if (filter === "pagar") return t.type === "despesa";
    return t.status === filter;
  });
  const pager = usePagination(filtered, { pageSize: 12, resetKey: `${filter}-${range.from}-${range.to}` });

  const aReceber = periodTxs.filter((t) => t.type === "receita" && ["Pendente", "Atrasado"].includes(t.status)).reduce((s, t) => s + (t.amount || 0), 0);
  const aPagar = periodTxs.filter((t) => t.type === "despesa" && ["Pendente", "Atrasado"].includes(t.status)).reduce((s, t) => s + (t.amount || 0), 0);
  const pagoReceita = periodTxs.filter((t) => t.type === "receita" && t.status === "Pago").reduce((s, t) => s + (t.amount || 0), 0);
  const atrasados = periodTxs.filter((t) => t.status === "Atrasado").length;

  const submit = (e) => {
    e.preventDefault();
    createMut.mutate({ ...form, amount: parseFloat(form.amount) || 0 });
  };

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle={`Contas a pagar e a receber · ${periodoTxt}`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-transaction-button" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-200">
                <Plus className="w-4 h-4 mr-1" /> Novo Lançamento
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-rose-100">
              <DialogHeader>
                <DialogTitle className="font-display">Novo Lançamento</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger data-testid="tx-type-select" className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita (a receber)</SelectItem>
                        <SelectItem value="despesa">Despesa (a pagar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger data-testid="tx-status-select" className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Pago">Pago</SelectItem>
                        <SelectItem value="Atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input data-testid="tx-description-input" className="mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Categoria</Label>
                    <Input data-testid="tx-category-input" className="mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Botox, Aluguel" />
                  </div>
                  <div>
                    <Label>Cliente / Fornecedor</Label>
                    <Input className="mt-1" value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Valor (R$)</Label>
                    <Input data-testid="tx-amount-input" type="number" step="0.01" className="mt-1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Vencimento</Label>
                    <Input data-testid="tx-due-input" type="date" className="mt-1" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatHero label="A Receber" value={brl(aReceber)} icon={ArrowDownCircle} color="sky" delay={0} />
        <StatHero label="A Pagar" value={brl(aPagar)} icon={ArrowUpCircle} color="amber" delay={0.05} />
        <StatHero label="Receita Paga" value={brl(pagoReceita)} icon={Wallet} color="emerald" delay={0.1} />
        <StatHero label="Atrasados" value={atrasados} icon={Clock} color="red" delay={0.15} subtitle="lançamentos" />
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-5">
        <TabsList data-testid="financial-filter-status" className="bg-rose-50/80 flex-wrap h-auto">
          <TabsTrigger value="todos" data-testid="filter-all">Todos</TabsTrigger>
          <TabsTrigger value="receber" data-testid="filter-receivable">A Receber</TabsTrigger>
          <TabsTrigger value="pagar" data-testid="filter-payable">A Pagar</TabsTrigger>
          <TabsTrigger value="Pago">Pago</TabsTrigger>
          <TabsTrigger value="Pendente">Pendente</TabsTrigger>
          <TabsTrigger value="Atrasado">Atrasado</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400">Nenhum lançamento encontrado.</div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden divide-y divide-rose-50" data-testid="transactions-cards">
              {pager.pageItems.map((t) => (
                <div key={t.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{t.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.category || "—"} · {t.due_date || "—"}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-semibold ${t.type === "receita" ? "text-emerald-600" : "text-red-500"}`}>
                      {t.type === "receita" ? "+" : "-"} {brl(t.amount)}
                    </p>
                    <div className="flex items-center gap-1">
                      {t.status !== "Pago" && (
                        <button
                          data-testid={`pay-button-${t.id}`}
                          onClick={() => payMut.mutate(t.id)}
                          className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-emerald-500 hover:bg-emerald-50"
                          title="Marcar como pago"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        data-testid={`delete-tx-${t.id}`}
                        onClick={() => delMut.mutate(t.id)}
                        className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: tabela */}
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm" data-testid="transactions-table">
              <thead>
                <tr className="text-left text-slate-400 border-b border-rose-100 text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Descrição</th>
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 font-medium">Vencimento</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Valor</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {pager.pageItems.map((t) => (
                    <motion.tr
                      key={t.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-rose-50 hover:bg-rose-50/40"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {t.type === "receita" ? (
                            <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <ArrowUpCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="font-medium text-slate-700">{t.description}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{t.category || "—"}</td>
                      <td className="px-5 py-3 text-slate-500">{t.due_date || "—"}</td>
                      <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                      <td className={`px-5 py-3 text-right font-semibold ${t.type === "receita" ? "text-emerald-600" : "text-red-500"}`}>
                        {t.type === "receita" ? "+" : "-"} {brl(t.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {t.status !== "Pago" && (
                            <button
                              data-testid={`pay-button-${t.id}`}
                              onClick={() => payMut.mutate(t.id)}
                              className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-50"
                              title="Marcar como pago"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            data-testid={`delete-tx-${t.id}`}
                            onClick={() => delMut.mutate(t.id)}
                            className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
                            title="Excluir"
                          >
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
        {filtered.length > 0 && (
          <ListPagination
            page={pager.page}
            totalPages={pager.totalPages}
            total={pager.total}
            from={pager.from}
            to={pager.to}
            onPageChange={pager.setPage}
          />
        )}
      </Card>
    </div>
  );
}
