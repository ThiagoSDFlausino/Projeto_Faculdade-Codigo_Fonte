import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, ArrowDownCircle, ArrowUpCircle, Scale, Calculator } from "lucide-react";
import { toast } from "sonner";
import api, { brl } from "@/lib/api";
import { resolvePeriodRange, periodLabel } from "@/lib/period";
import { PageHeader, Card, StatHero } from "@/components/Shared";
import PeriodFilters from "@/components/PeriodFilters";
import { ListPagination, usePagination } from "@/components/ListPagination";
import { Button } from "@/components/ui/button";

function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function FluxoCaixa() {
  const initial = resolvePeriodRange("mes");
  const [preset, setPreset] = useState("mes");
  const [fromDate, setFromDate] = useState(initial.from);
  const [toDate, setToDate] = useState(initial.to);
  const periodoTxt = periodLabel(preset, fromDate, toDate);

  const { data: fluxo, isLoading } = useQuery({
    queryKey: ["fluxo", fromDate, toDate],
    queryFn: async () => (await api.get("/fluxo-caixa", { params: { from_date: fromDate, to_date: toDate } })).data,
  });

  const entradas = fluxo?.entradas || [];
  const saidas = fluxo?.saidas || [];
  const inPager = usePagination(entradas, { pageSize: 10, resetKey: `${fromDate}-${toDate}-in` });
  const outPager = usePagination(saidas, { pageSize: 10, resetKey: `${fromDate}-${toDate}-out` });

  const exportCsv = () => {
    if (!fluxo) return;
    const rows = [["Tipo", "Data", "Descrição", "Categoria", "Valor", "Origem"]];
    fluxo.entradas.forEach((e) => rows.push(["Entrada", e.data, e.descricao, e.categoria, e.valor, e.origem]));
    fluxo.saidas.forEach((e) => rows.push(["Saída", e.data, e.descricao, e.categoria, e.valor, e.origem]));
    downloadCsv(`fluxo-caixa-${fromDate}-${toDate}.csv`, rows);
    toast.success("CSV exportado");
  };

  return (
    <div>
      <PageHeader
        title="Fluxo de Caixa"
        subtitle={`Entradas e saídas do período · ${periodoTxt}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={exportCsv} data-testid="export-csv-button">
              <FileSpreadsheet className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button asChild className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">
              <Link to="/fechamento" data-testid="goto-fechamento-button">
                <Calculator className="w-4 h-4 mr-1" /> Fechamento
              </Link>
            </Button>
          </div>
        }
      />

      <PeriodFilters
        preset={preset}
        onPresetChange={(id) => {
          setPreset(id);
          if (id === "tudo") {
            setFromDate("2000-01-01");
            setToDate(new Date().toISOString().slice(0, 10));
            return;
          }
          if (id !== "custom") {
            const r = resolvePeriodRange(id);
            setFromDate(r.from);
            setToDate(r.to);
          }
        }}
        from={fromDate}
        to={toDate}
        onFromChange={(v) => { setPreset("custom"); setFromDate(v); }}
        onToChange={(v) => { setPreset("custom"); setToDate(v); }}
        testid="fluxo-filters"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatHero label="Entradas" value={brl(fluxo?.total_entradas || 0)} icon={ArrowDownCircle} color="emerald" delay={0} />
        <StatHero label="Saídas" value={brl(fluxo?.total_saidas || 0)} icon={ArrowUpCircle} color="red" delay={0.05} />
        <StatHero label="Saldo" value={brl(fluxo?.saldo || 0)} icon={Scale} color="sky" delay={0.1} />
      </div>

      {isLoading ? <div className="h-40 ai-shimmer rounded-2xl" /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card className="overflow-hidden" data-testid="cashflow-in">
            <div className="p-5 pb-2"><h3 className="font-display font-semibold">Entradas</h3></div>
            <div className="space-y-2 px-5 max-h-80 overflow-y-auto">
              {inPager.pageItems.map((e, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-rose-50 pb-2">
                  <div><p className="text-slate-700">{e.descricao}</p><p className="text-xs text-slate-400">{e.data}</p></div>
                  <p className="text-emerald-600 font-medium">{brl(e.valor)}</p>
                </div>
              ))}
              {entradas.length === 0 && <p className="text-sm text-slate-400 pb-4">Nenhuma entrada.</p>}
            </div>
            <ListPagination page={inPager.page} totalPages={inPager.totalPages} total={inPager.total} from={inPager.from} to={inPager.to} onPageChange={inPager.setPage} />
          </Card>
          <Card className="overflow-hidden" data-testid="cashflow-out">
            <div className="p-5 pb-2"><h3 className="font-display font-semibold">Saídas</h3></div>
            <div className="space-y-2 px-5 max-h-80 overflow-y-auto">
              {outPager.pageItems.map((e, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-rose-50 pb-2">
                  <div><p className="text-slate-700">{e.descricao}</p><p className="text-xs text-slate-400">{e.data}</p></div>
                  <p className="text-red-500 font-medium">{brl(e.valor)}</p>
                </div>
              ))}
              {saidas.length === 0 && <p className="text-sm text-slate-400 pb-4">Nenhuma saída.</p>}
            </div>
            <ListPagination page={outPager.page} totalPages={outPager.totalPages} total={outPager.total} from={outPager.from} to={outPager.to} onPageChange={outPager.setPage} />
          </Card>
        </div>
      )}

      <Card className="p-5 flex flex-wrap items-center justify-between gap-3 border-rose-100 bg-gradient-to-r from-rose-50/60 to-white">
        <div>
          <p className="font-display font-semibold text-slate-800">Fechamento quinzenal</p>
          <p className="text-sm text-slate-500">Consolide faturamento e despesas por período na tela de Fechamento.</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl border-rose-200">
          <Link to="/fechamento">Abrir fechamento</Link>
        </Button>
      </Card>
    </div>
  );
}
