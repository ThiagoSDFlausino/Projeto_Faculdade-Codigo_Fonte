import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const DEFAULT_PAGE_SIZE = 10;

/**
 * Hook de paginação client-side.
 * Reseta para página 1 quando `resetKey` muda (ex.: filtro/busca).
 */
export function usePagination(items = [], { pageSize = DEFAULT_PAGE_SIZE, resetKey } = {}) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return {
    page,
    setPage,
    pageSize,
    total,
    totalPages,
    pageItems,
    from,
    to,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

/** Controles de paginação padrão do CRM */
export function ListPagination({
  page,
  totalPages,
  total,
  from,
  to,
  onPageChange,
  className = "",
}) {
  if (total <= 0 || totalPages <= 1) return null;

  const pages = [];
  const window = 2;
  let start = Math.max(1, page - window);
  let end = Math.min(totalPages, page + window);
  if (end - start < window * 2) {
    start = Math.max(1, end - window * 2);
    end = Math.min(totalPages, start + window * 2);
  }
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-rose-100 ${className}`} data-testid="list-pagination">
      <p className="text-xs text-slate-400">
        Mostrando <span className="font-medium text-slate-600">{from}</span>–<span className="font-medium text-slate-600">{to}</span> de{" "}
        <span className="font-medium text-slate-600">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-rose-50 disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>
        {start > 1 && (
          <>
            <button type="button" onClick={() => onPageChange(1)} className={`w-8 h-8 rounded-lg text-sm ${page === 1 ? "bg-rose-500 text-white" : "text-slate-600 hover:bg-rose-50"}`}>1</button>
            {start > 2 && <span className="px-1 text-slate-300">…</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              p === page ? "bg-rose-500 text-white shadow-sm shadow-rose-200" : "text-slate-600 hover:bg-rose-50"
            }`}
          >
            {p}
          </button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-slate-300">…</span>}
            <button type="button" onClick={() => onPageChange(totalPages)} className={`w-8 h-8 rounded-lg text-sm ${page === totalPages ? "bg-rose-500 text-white" : "text-slate-600 hover:bg-rose-50"}`}>{totalPages}</button>
          </>
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-rose-50 disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Próxima página"
        >
          Próxima <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/** Lista genérica com paginação (render prop). */
export function PaginatedItems({ items, pageSize = 10, resetKey, children, paginationClassName }) {
  const pager = usePagination(items, { pageSize, resetKey });
  return (
    <>
      {pager.pageItems.map((item, index) => children(item, index))}
      <ListPagination
        page={pager.page}
        totalPages={pager.totalPages}
        total={pager.total}
        from={pager.from}
        to={pager.to}
        onPageChange={pager.setPage}
        className={paginationClassName}
      />
    </>
  );
}

/** Coluna de kanban com paginação própria. */
export function KanbanColumnPager({ items, pageSize = 8, children }) {
  return (
    <PaginatedItems
      items={items}
      pageSize={pageSize}
      resetKey={items.length}
      paginationClassName="!px-1 !py-2 border-0 flex-col items-stretch gap-1 [&_p]:text-[10px]"
    >
      {children}
    </PaginatedItems>
  );
}
