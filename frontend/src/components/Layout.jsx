import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Wallet, Users, CalendarDays, LogOut, Sparkles, Menu, X, UserCog, Stethoscope,
  Landmark, Calculator, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const NAV_GROUPS = [
  {
    title: "Principal",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard-link", roles: ["admin", "secretaria", "profissional"] },
    ],
  },
  {
    title: "Comercial",
    items: [
      { to: "/clientes", label: "Clientes", icon: Users, testid: "nav-crm-link", roles: ["admin", "secretaria", "profissional"] },
    ],
  },
  {
    title: "Atendimento",
    items: [
      { to: "/agendamentos", label: "Agendamentos", icon: CalendarDays, testid: "nav-appointments-link", roles: ["admin", "secretaria", "profissional"] },
      { to: "/procedimentos", label: "Procedimentos", icon: Stethoscope, testid: "nav-procedures-link", roles: ["admin"] },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { to: "/financeiro", label: "Lançamentos", icon: Wallet, testid: "nav-financial-link", roles: ["admin"] },
      { to: "/fluxo-caixa", label: "Fluxo de Caixa", icon: Landmark, testid: "nav-cashflow-link", roles: ["admin"] },
      { to: "/fechamento", label: "Fechamento", icon: Calculator, testid: "nav-closing-link", roles: ["admin"] },
    ],
  },
  {
    title: "Gestão",
    items: [
      { to: "/equipe", label: "Equipe", icon: UserCog, testid: "nav-team-link", roles: ["admin"] },
    ],
  },
];

const ROLE_LABEL = { admin: "Dono", secretaria: "Recepção", profissional: "Profissional" };
const SIDEBAR_KEY = "suleima-sidebar-collapsed";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items
      .filter((n) => n.roles.includes(user?.role))
      .map((n) => (n.to === "/agendamentos" && user?.role === "profissional" ? { ...n, label: "Minha Agenda" } : n)),
  })).filter((g) => g.items.length > 0);

  const doLogout = () => { logout(); navigate("/login"); };
  const isActive = (to) => (to === "/" ? location.pathname === "/" : location.pathname.startsWith(to));
  const toggleCollapse = () => setCollapsed((c) => !c);

  const SidebarContent = ({ compact = false, showClose = false }) => (
    <div className="flex flex-col h-full">
      <div className={`py-5 flex items-center gap-2.5 ${compact ? "px-2 justify-center flex-col gap-3" : "px-4"}`}>
        <div className={`flex items-center gap-2.5 min-w-0 ${compact ? "justify-center" : "flex-1"}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-200 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!compact && (
            <div className="min-w-0">
              <p className="font-display font-bold text-base text-slate-800 leading-tight truncate">Projeto Faculdade</p>
              <p className="text-[10px] uppercase tracking-widest text-rose-400 mt-0.5">Beleza e Bem-estar</p>
            </div>
          )}
        </div>
        {showClose ? (
          <button type="button" className="text-slate-400 hover:text-rose-500 p-1" onClick={() => setOpen(false)} aria-label="Fechar menu">
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            data-testid="sidebar-collapse-button"
            onClick={toggleCollapse}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            title={compact ? "Expandir menu" : "Recolher menu"}
            aria-label={compact ? "Expandir menu" : "Recolher menu"}
          >
            {compact ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>
      <nav className={`flex-1 pb-3 space-y-4 overflow-y-auto ${compact ? "px-2" : "px-3"}`}>
        {groups.map((group) => (
          <div key={group.title}>
            {!compact && (
              <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</p>
            )}
            {compact && <div className="mx-2 mb-1.5 border-t border-rose-50 first:border-0 first:mb-0" />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    data-testid={item.testid}
                    title={compact ? item.label : undefined}
                    onClick={() => setOpen(false)}
                    className={`relative flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                      compact ? "justify-center px-2 py-2.5" : "gap-3 px-4 py-2"
                    } ${active ? "text-rose-600" : "text-slate-500 hover:text-rose-500 hover:bg-rose-50"}`}
                  >
                    {active && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-rose-100/80 rounded-xl border border-rose-200"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="w-5 h-5 relative z-10 shrink-0" />
                    {!compact && <span className="relative z-10">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className={`border-t border-rose-100 ${compact ? "p-2" : "p-3"}`}>
        {!compact ? (
          <>
            <div className="flex items-center gap-3 px-3 py-2">
              {user?.photo ? (
                <img src={user.photo} alt={user.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-rose-100" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
                  {(user?.name || "U").charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{user?.name}</p>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-500 font-medium mt-0.5">
                  {ROLE_LABEL[user?.role] || user?.role}
                </span>
              </div>
            </div>
            <button
              data-testid="logout-button"
              onClick={doLogout}
              className="mt-1 w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1">
            {user?.photo ? (
              <img src={user.photo} alt={user.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-rose-100" title={user.name} />
            ) : (
              <div
                className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white font-semibold text-sm"
                title={user?.name}
              >
                {(user?.name || "U").charAt(0)}
              </div>
            )}
            <button
              data-testid="logout-button"
              onClick={doLogout}
              title="Sair"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#FDF7F8]">
      <aside
        className={`hidden lg:flex flex-col bg-white/80 backdrop-blur-xl border-r border-rose-100 fixed inset-y-0 z-30 transition-[width] duration-300 ease-out ${
          collapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <SidebarContent compact={collapsed} />
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} className="relative w-64 bg-white border-r border-rose-100">
            <SidebarContent showClose />
          </motion.aside>
        </div>
      )}

      <div className={`flex-1 transition-[margin] duration-300 ease-out ${collapsed ? "lg:ml-[72px]" : "lg:ml-64"}`}>
        <header className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-rose-100 px-4 py-3 flex items-center gap-3">
          <button
            data-testid="mobile-menu-button"
            onClick={() => setOpen(true)}
            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-slate-600 hover:bg-rose-50"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-display font-bold text-slate-800">Projeto Faculdade</span>
        </header>
        <main className="w-full p-4 sm:p-6 lg:p-8 max-w-[100vw] overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
