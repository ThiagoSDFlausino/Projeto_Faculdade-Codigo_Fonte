/**
 * Página de fechamento.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Calendar,
  Landmark,
  TrendingUp,
  Wallet,
  Scale,
  Clock,
} from "lucide-react";

import { brl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { fechamentoService } from "../Service/fechamentoService";
import { PageHeader, Card, StatHero } from "@/components/Shared";
import {
  ListPagination,
  usePagination,
} from "@/components/ListPagination";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function dataTexto(year, month, day) {
  return [
    year,
    String(month + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function getBiweeklyPeriods(year) {
  const periods = [];

  for (let month = 0; month < 12; month++) {
    const referencia = new Date(Date.UTC(year, month, 1));

    const mes = referencia.toLocaleDateString("pt-BR", {
      month: "short",
      timeZone: "UTC",
    });

    const ultimoDia = new Date(
      Date.UTC(year, month + 1, 0)
    ).getUTCDate();

    periods.push({
      inicio: dataTexto(year, month, 1),
      fim: dataTexto(year, month, 15),
      label: `1–15 ${mes} ${year}`,
    });

    periods.push({
      inicio: dataTexto(year, month, 16),
      fim: dataTexto(year, month, ultimoDia),
      label: `16–${ultimoDia} ${mes} ${year}`,
    });
  }

  return periods;
}

function getCurrentPeriodIndex(periods) {
  const today = new Date().toISOString().slice(0, 10);

  const index = periods.findIndex(
    (period) => today >= period.inicio && today <= period.fim
  );

  return index >= 0 ? index : 0;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(
    value.length === 10 ? `${value}T12:00:00Z` : value
  );

  return date.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

function mensagemErro(error) {
  const status = error.response?.status;

  if (status === 401) {
    return "Sua sessão expirou. Entre novamente.";
  }

  if (status === 403) {
    return "Somente o administrador pode consultar este relatório.";
  }

  if (status === 409) {
    return "Existem dados financeiros inconsistentes. Consulte o log do Spring.";
  }

  if (status === 400) {
    return "Verifique o período selecionado.";
  }

  return (
    error.response?.data?.detail ||
    error.message ||
    "Não foi possível consultar o fechamento."
  );
}

export default function Fechamento() {
  const { user } = useAuth();

  const currentYear = new Date().getUTCFullYear();
  const [year, setYear] = useState(currentYear);

  const periods = useMemo(
    () => getBiweeklyPeriods(year),
    [year]
  );

  const [selectedIndex, setSelectedIndex] = useState(() =>
    getCurrentPeriodIndex(getBiweeklyPeriods(currentYear))
  );

  useEffect(() => {
    setSelectedIndex(getCurrentPeriodIndex(periods));
  }, [periods]);

  const selected = periods[selectedIndex] || periods[0];
  const isAdmin = user?.role === "admin";

  const {
    data: preview,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "fechamento-preview",
      selected.inicio,
      selected.fim,
      user?.id,
    ],
    queryFn: () =>
      fechamentoService.preview({
        periodoInicio: selected.inicio,
        periodoFim: selected.fim,
      }),
    enabled: isAdmin,
  });

  const atendimentos = preview?.atendimentos ?? [];

  const pager = usePagination(atendimentos, {
    pageSize: 10,
    resetKey: `${selected.inicio}-${selected.fim}`,
  });

  if (!isAdmin) {
    return (
      <Card className="p-8 text-center">
        Somente o administrador pode consultar o fechamento financeiro.
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="Fechamento Financeiro"
        subtitle="Prévia das receitas e despesas do período, em UTC."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="rounded-xl"
            >
              <Link to="/fluxo-caixa">
                <Landmark className="w-4 h-4 mr-1" />
                Consultar Fluxo de Caixa
              </Link>
            </Button>

            <Select
              value={String(year)}
              onValueChange={(value) => setYear(Number(value))}
            >
              <SelectTrigger className="w-[110px] rounded-xl">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map(
                  (item) => (
                    <SelectItem key={item} value={String(item)}>
                      {item}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            <Select
              value={String(selectedIndex)}
              onValueChange={(value) =>
                setSelectedIndex(Number(value))
              }
            >
              <SelectTrigger className="w-[220px] rounded-xl">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {periods.map((period, index) => (
                  <SelectItem
                    key={period.inicio}
                    value={String(index)}
                  >
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Card className="p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-rose-500" />

          <div>
            <p className="text-xs uppercase text-slate-400">
              Período selecionado
            </p>

            <p className="font-semibold">
              {formatDate(selected.inicio)} até{" "}
              {formatDate(selected.fim)}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-xl"
        >
          {isFetching ? "Consultando..." : "Atualizar consulta"}
        </Button>
      </Card>

      <p className="text-sm text-slate-500 mb-6">
        Esta tela apresenta uma prévia calculada. Os valores não são
        gravados como um fechamento histórico.
      </p>

      {isLoading ? (
        <Card className="p-8 text-center">
          Consultando dados financeiros...
        </Card>
      ) : isError ? (
        <Card className="p-8 text-center text-red-500">
          {mensagemErro(error)}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatHero
              label="Faturamento recebido"
              value={brl(preview?.totalFaturamento)}
              icon={TrendingUp}
              color="emerald"
              delay={0}
            />

            <StatHero
              label="Despesas"
              value={brl(preview?.totalDespesas)}
              icon={Wallet}
              color="rose"
              delay={0.05}
            />

            <StatHero
              label="Resultado do período"
              value={brl(preview?.resultado)}
              icon={Scale}
              color="emerald"
              delay={0.1}
            />

            <StatHero
              label="A receber — previsão"
              value={brl(preview?.totalAReceber)}
              icon={Clock}
              color="rose"
              delay={0.15}
            />
          </div>

          <Card className="p-5 mb-6">
            <h2 className="font-display font-semibold mb-4">
              Totais por profissional
            </h2>

            {(preview?.porProfissional ?? []).length === 0 ? (
              <p className="text-slate-400">
                Nenhum atendimento concluído neste período.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-slate-400">
                      <th className="text-left py-3">Profissional</th>
                      <th className="text-left py-3">Função</th>
                      <th className="text-right py-3">Atendimentos</th>
                      <th className="text-right py-3">Faturamento</th>
                    </tr>
                  </thead>

                  <tbody>
                    {preview.porProfissional.map((profissional) => (
                      <tr
                        key={profissional.profissional}
                        className="border-b last:border-0"
                      >
                        <td className="py-3">{profissional.nome}</td>
                        <td className="py-3">
                          {profissional.funcao || "—"}
                        </td>
                        <td className="py-3 text-right">
                          {profissional.totalAtendimentos}
                        </td>
                        <td className="py-3 text-right font-semibold">
                          {brl(profissional.totalFaturamento)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="p-5">
              <h2 className="font-display font-semibold">
                Atendimentos concluídos
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                {preview?.totalAtendimentos ?? 0} atendimento(s).
                Data financeira: conclusão da Agenda.
              </p>
            </div>

            {atendimentos.length === 0 ? (
              <p className="p-5 text-slate-400">
                Nenhuma receita registrada neste período.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-slate-400">
                        <th className="px-5 py-3 text-left">Conclusão</th>
                        <th className="px-5 py-3 text-left">Cliente</th>
                        <th className="px-5 py-3 text-left">Procedimento</th>
                        <th className="px-5 py-3 text-left">Profissional</th>
                        <th className="px-5 py-3 text-right">Valor recebido</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pager.pageItems.map((agenda) => (
                        <tr
                          key={agenda.id}
                          className="border-b last:border-0"
                        >
                          <td className="px-5 py-3">
                            {formatDate(agenda.dataConclusao)}
                          </td>
                          <td className="px-5 py-3">
                            {agenda.cliente?.nome || "—"}
                          </td>
                          <td className="px-5 py-3">
                            {agenda.procedimento?.nome || "—"}
                          </td>
                          <td className="px-5 py-3">
                            {agenda.profissional?.nome || "—"}
                          </td>
                          <td className="px-5 py-3 text-right font-semibold">
                            {brl(agenda.valorCobrado)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ListPagination
                  page={pager.page}
                  totalPages={pager.totalPages}
                  total={pager.total}
                  from={pager.from}
                  to={pager.to}
                  onPageChange={pager.setPage}
                />
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
