import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar, Check, Calculator, ArrowRight, Users, FileText, TrendingUp, Wallet, Scale, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import api, { brl } from "@/lib/api";
import { invalidateClienteImpact } from "@/lib/invalidateCliente";
import { PageHeader, Card, StatHero } from "@/components/Shared";
import { ListPagination, usePagination } from "@/components/ListPagination";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

function getBiweeklyPeriods(year) {
  const periods = [];
  for (let month = 0; month < 12; month++) {
    const firstStart = new Date(year, month, 1);
    const firstEnd = new Date(year, month, 15);
    periods.push({
      inicio: firstStart.toISOString().slice(0, 10),
      fim: firstEnd.toISOString().slice(0, 10),
      label: `1–15 ${firstStart.toLocaleDateString("pt-BR", { month: "short" })} ${year}`,
    });
    const secondStart = new Date(year, month, 16);
    const secondEnd = new Date(year, month + 1, 0);
    periods.push({
      inicio: secondStart.toISOString().slice(0, 10),
      fim: secondEnd.toISOString().slice(0, 10),
      label: `16–${secondEnd.getDate()} ${secondStart.toLocaleDateString("pt-BR", { month: "short" })} ${year}`,
    });
  }
  return periods;
}

function getCurrentPeriodIndex(periods) {
  const today = new Date().toISOString().slice(0, 10);
  for (let i = periods.length - 1; i >= 0; i--) {
    if (today >= periods[i].inicio) return i;
  }
  return 0;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR");
}

export default function Fechamento() {
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const periods = useMemo(() => getBiweeklyPeriods(year), [year]);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(() => getCurrentPeriodIndex(getBiweeklyPeriods(currentYear)));
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setSelectedPeriodIndex(getCurrentPeriodIndex(periods));
  }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = periods[selectedPeriodIndex] || periods[0];

  const { data: fechamentos = [] } = useQuery({
    queryKey: ["fechamentos"],
    queryFn: async () => (await api.get("/fechamentos")).data,
  });

  const { data: preview, isLoading, isFetching, error } = useQuery({
    queryKey: ["fechamento-preview", selected?.inicio, selected?.fim],
    queryFn: async () => (await api.get("/fechamentos/preview", {
      params: { periodo_inicio: selected.inicio, periodo_fim: selected.fim },
    })).data,
    enabled: Boolean(selected?.inicio && selected?.fim),
  });

  const isPeriodClosed = fechamentos.some(
    (f) => f.periodo_inicio === selected?.inicio && f.periodo_fim === selected?.fim,
  ) || preview?.ja_fechado;

  const atendPager = usePagination(preview?.atendimentos || [], {
    pageSize: 10,
    resetKey: `${selected?.inicio}-${selected?.fim}`,
  });
  const histPager = usePagination(fechamentos, { pageSize: 8 });

  const fecharMut = useMutation({
    mutationFn: () => api.post("/fechamentos", {
      periodo_inicio: selected.inicio,
      periodo_fim: selected.fim,
    }),
    onSuccess: () => {
      invalidateClienteImpact(qc);
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      qc.invalidateQueries({ queryKey: ["fechamento-preview"] });
      setConfirmOpen(false);
      toast.success("Fechamento gerado com sucesso");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Erro ao gerar fechamento"),
  });

  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/fechamentos/${id}`),
    onSuccess: () => {
      invalidateClienteImpact(qc);
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      qc.invalidateQueries({ queryKey: ["fechamento-preview"] });
      toast.success("Fechamento removido — sessões liberadas");
    },
    onError: (e) => toast.error(e.response?.data?.detail || "Erro ao remover"),
  });

  return (
    <div>
      <PageHeader
        title="Fechamento Financeiro"
        subtitle="Fechamento quinzenal: faturamento, despesas e lucro líquido"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-[110px] rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(selectedPeriodIndex)} onValueChange={(v) => setSelectedPeriodIndex(Number(v))}>
              <SelectTrigger className="w-[220px] rounded-xl" data-testid="fechamento-period-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p, i) => (
                  <SelectItem key={`${p.inicio}-${p.fim}`} value={String(i)}>
                    {p.label}
                    {fechamentos.some((f) => f.periodo_inicio === p.inicio && f.periodo_fim === p.fim) ? " ✓" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Card className="p-4 mb-6 flex flex-wrap items-center justify-between gap-4 border-rose-100 bg-gradient-to-r from-rose-50/80 to-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Período selecionado</p>
            <p className="font-display font-semibold text-slate-800">
              {formatDate(selected?.inicio)} <ArrowRight className="inline w-4 h-4 mx-1 text-slate-400" /> {formatDate(selected?.fim)}
            </p>
          </div>
        </div>
        {isPeriodClosed ? (
          <span className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Check className="w-4 h-4" /> Fechado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
            <Calculator className="w-4 h-4" /> Em aberto
          </span>
        )}
      </Card>

      {(isLoading || isFetching) && !preview ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl ai-shimmer" />)}
        </div>
      ) : error ? (
        <Card className="p-8 mb-6 text-center text-red-500">Erro ao carregar preview do período.</Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatHero label="Faturamento" value={brl(preview?.total_faturamento || 0)} icon={TrendingUp} color="emerald" delay={0} subtitle="entradas do período" />
            <StatHero label="Despesas" value={brl(preview?.total_despesas || 0)} icon={Scale} color="amber" delay={0.05} subtitle="saídas pagas" />
            <StatHero label="Lucro líquido" value={brl(preview?.lucro_liquido || 0)} icon={Wallet} color="rose" delay={0.1} subtitle="fat. − despesas" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="p-5 lg:col-span-1">
              <h3 className="font-display font-semibold text-slate-800 mb-1 flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-400" /> Por profissional
              </h3>
              <p className="text-xs text-slate-400 mb-4">{preview?.total_atendimentos || 0} atendimentos no período</p>
              {(preview?.por_profissional || []).length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma sessão pendente neste período.</p>
              ) : (
                <div className="space-y-3">
                  {preview.por_profissional.map((p) => (
                    <div key={p.professional_id || p.profissional_nome} className="p-3 rounded-xl border border-rose-50 bg-white">
                      <div className="flex justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate">{p.profissional_nome}</p>
                          <p className="text-xs text-slate-400">{p.total_atendimentos} atendimentos</p>
                        </div>
                        <p className="font-semibold text-emerald-600 shrink-0">{brl(p.total_faturamento)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-0 overflow-hidden lg:col-span-2">
              <div className="p-5 pb-2 flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-display font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-400" /> Atendimentos do período
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Sessões ainda não vinculadas a um fechamento</p>
                </div>
                {!isPeriodClosed && (
                  <Button
                    className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
                    onClick={() => setConfirmOpen(true)}
                    data-testid="generate-fechamento-button"
                  >
                    <Check className="w-4 h-4 mr-1" /> Gerar fechamento
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-y border-rose-50">
                      <th className="px-5 py-3 font-medium">Data</th>
                      <th className="px-5 py-3 font-medium">Cliente</th>
                      <th className="px-5 py-3 font-medium">Procedimento</th>
                      <th className="px-5 py-3 font-medium">Profissional</th>
                      <th className="px-5 py-3 font-medium text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atendPager.pageItems.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Nenhum atendimento pendente.</td></tr>
                    )}
                    {atendPager.pageItems.map((a) => (
                      <tr key={a.id} className="border-b border-rose-50/80">
                        <td className="px-5 py-2.5 text-slate-500">{formatDate(a.date)}</td>
                        <td className="px-5 py-2.5 text-slate-700">{a.cliente_nome}</td>
                        <td className="px-5 py-2.5 text-slate-600">{a.procedure}</td>
                        <td className="px-5 py-2.5 text-slate-500">{a.profissional_nome}</td>
                        <td className="px-5 py-2.5 text-right text-slate-700">{brl(a.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ListPagination
                page={atendPager.page}
                totalPages={atendPager.totalPages}
                total={atendPager.total}
                from={atendPager.from}
                to={atendPager.to}
                onPageChange={atendPager.setPage}
              />
            </Card>
          </div>
        </>
      )}

      <Card className="overflow-hidden">
        <div className="p-5 pb-2">
          <h3 className="font-display font-semibold text-slate-800">Histórico de fechamentos</h3>
          <p className="text-xs text-slate-400 mt-0.5">Quinzenas já consolidadas. Remover devolve as sessões ao aberto.</p>
        </div>
        {fechamentos.length === 0 ? (
          <p className="text-slate-400 text-sm px-5 pb-5">Nenhum fechamento gerado ainda.</p>
        ) : (
          <>
            <div className="space-y-2 px-5 pb-2">
              {histPager.pageItems.map((f) => (
                <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{formatDate(f.periodo_inicio)} → {formatDate(f.periodo_fim)}</p>
                    <p className="text-xs text-slate-400">
                      {f.total_atendimentos || 0} atend. · Fat. {brl(f.total_faturamento)} · Desp. {brl(f.total_despesas)} · Lucro {brl(f.lucro_liquido)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="p-2 rounded-lg text-red-400 hover:bg-red-50"
                    title="Remover fechamento"
                    onClick={() => window.confirm("Remover este fechamento e liberar as sessões?") && delMut.mutate(f.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <ListPagination
              page={histPager.page}
              totalPages={histPager.totalPages}
              total={histPager.total}
              from={histPager.from}
              to={histPager.to}
              onPageChange={histPager.setPage}
            />
          </>
        )}
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-3xl border-rose-100">
          <DialogHeader>
            <DialogTitle className="font-display">Confirmar fechamento</DialogTitle>
            <DialogDescription>
              Ao gerar o fechamento de {formatDate(selected?.inicio)} a {formatDate(selected?.fim)}, as sessões listadas serão vinculadas a este período e não entrarão em outro fechamento. Esta ação consolida o resultado da quinzena.
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="rounded-xl bg-rose-50/80 border border-rose-100 p-4 text-sm space-y-1">
              <p className="flex justify-between"><span>Faturamento</span><span className="font-medium">{brl(preview.total_faturamento)}</span></p>
              <p className="flex justify-between"><span>Despesas</span><span className="font-medium">{brl(preview.total_despesas)}</span></p>
              <p className="flex justify-between border-t border-rose-100 pt-2 mt-2 font-semibold text-rose-600">
                <span>Lucro líquido</span><span>{brl(preview.lucro_liquido)}</span>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
              disabled={fecharMut.isPending}
              onClick={() => fecharMut.mutate()}
              data-testid="confirm-fechamento-button"
            >
              {fecharMut.isPending ? "Gerando..." : "Confirmar fechamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
