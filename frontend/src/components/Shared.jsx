import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react";

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <p className="text-xs font-medium tracking-widest text-rose-400 uppercase mb-1">Projeto Faculdade</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">{title}</h1>
      {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
    </motion.div>
    {action}
  </div>
);

export const Card = ({ children, className = "", ...props }) => (
  <div
    className={`bg-white/90 backdrop-blur-md border border-rose-100 shadow-sm rounded-2xl transition-all duration-200 hover:shadow-md ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const STAT_GRADIENTS = {
  rose: "from-[#E05A78] to-[#9B4B7C]",
  gold: "from-[#F0A04B] to-[#C47A2E]",
  blush: "from-[#EC7AA3] to-[#E05A78]",
  mauve: "from-[#9B6B9E] to-[#5C3D5F]",
  emerald: "from-emerald-500 to-emerald-700",
  sky: "from-sky-500 to-sky-700",
  amber: "from-amber-400 to-amber-600",
  red: "from-red-500 to-rose-700",
};

export const StatHero = ({
  label,
  value,
  icon: Icon,
  color = "rose",
  delay = 0,
  testid,
  variation,
  subtitle,
  href,
}) => {
  const n = variation == null ? null : Number(variation);
  const body = (
    <div
      className={`bg-gradient-to-br ${STAT_GRADIENTS[color] || STAT_GRADIENTS.rose} text-white rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-rose-200/40 h-full`}
    >
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          {Icon ? (
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Icon className="w-5 h-5" />
            </div>
          ) : (
            <span />
          )}
          {n != null && !Number.isNaN(n) && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${n >= 0 ? "bg-white/20" : "bg-red-500/35"}`}>
              {n >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {n >= 0 ? "+" : ""}
              {n.toFixed(1)}%
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-white/80 mb-1">{label}</p>
        <p className="text-2xl font-bold tracking-tight font-display">{value ?? "—"}</p>
        {subtitle && <p className="text-xs text-white/65 mt-1">{subtitle}</p>}
      </div>
      {href && (
        <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      data-testid={testid}
    >
      {href ? (
        <Link to={href} className="block h-full">
          {body}
        </Link>
      ) : (
        body
      )}
    </motion.div>
  );
};

export const statusStyles = {
  Pago: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Pendente: "bg-amber-50 text-amber-600 border-amber-200",
  Atrasado: "bg-red-50 text-red-600 border-red-200",
  Agendado: "bg-sky-50 text-sky-600 border-sky-200",
  Confirmado: "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Concluído": "bg-slate-100 text-slate-500 border-slate-200",
  Cancelado: "bg-red-50 text-red-500 border-red-200",
  Ativo: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Inativo: "bg-slate-100 text-slate-500 border-slate-200",
  pendente: "bg-amber-50 text-amber-600 border-amber-200",
  concluida: "bg-emerald-50 text-emerald-600 border-emerald-200",
  aprovada: "bg-emerald-50 text-emerald-600 border-emerald-200",
  rejeitada: "bg-red-50 text-red-500 border-red-200",
  ativo: "bg-emerald-50 text-emerald-600 border-emerald-200",
  esgotado: "bg-slate-100 text-slate-500 border-slate-200",
  expirado: "bg-amber-50 text-amber-700 border-amber-200",
  cancelado: "bg-red-50 text-red-500 border-red-200",
};

export const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[status] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
    {status}
  </span>
);
