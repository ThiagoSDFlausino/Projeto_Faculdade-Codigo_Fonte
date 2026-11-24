import { Filter } from "lucide-react";
import { Card } from "@/components/Shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { periodPresets } from "@/lib/period";

export default function PeriodFilters({
  preset,
  onPresetChange,
  from,
  to,
  onFromChange,
  onToChange,
  professionals,
  professionalId = "all",
  onProfessionalChange,
  procedures,
  procedure = "all",
  onProcedureChange,
  categories,
  category = "all",
  onCategoryChange,
  testid = "period-filters",
}) {
  const showDates = preset === "custom";
  const showExtra = onProfessionalChange || onProcedureChange || onCategoryChange;

  return (
    <Card className="p-4 mb-5 space-y-3" data-testid={testid}>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Filter className="w-4 h-4 text-rose-400" />
        Filtros
      </div>
      <div className="flex flex-wrap gap-2">
        {periodPresets().map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPresetChange?.(p.id)}
            className={`min-h-11 px-3.5 py-2.5 rounded-xl text-sm border transition-colors ${
              preset === p.id
                ? "bg-rose-500 text-white border-rose-500"
                : "bg-white text-slate-600 border-rose-100 hover:border-rose-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {(showDates || showExtra) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {showDates && (
            <>
              <div>
                <Label className="text-xs text-slate-500">De</Label>
                <Input type="date" className="mt-1" value={from || ""} onChange={(e) => onFromChange?.(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Até</Label>
                <Input type="date" className="mt-1" value={to || ""} onChange={(e) => onToChange?.(e.target.value)} />
              </div>
            </>
          )}
          {onProfessionalChange && Array.isArray(professionals) && (
            <div>
              <Label className="text-xs text-slate-500">Profissional</Label>
              <Select value={professionalId || "all"} onValueChange={onProfessionalChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {professionals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {onProcedureChange && Array.isArray(procedures) && (
            <div>
              <Label className="text-xs text-slate-500">Procedimento</Label>
              <Select value={procedure || "all"} onValueChange={onProcedureChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {procedures.map((p) => (
                    <SelectItem key={p.id || p.name} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {onCategoryChange && Array.isArray(categories) && categories.length > 0 && (
            <div>
              <Label className="text-xs text-slate-500">Categoria</Label>
              <Select value={category || "all"} onValueChange={onCategoryChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
