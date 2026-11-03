import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_LOGIN = process.env.REACT_APP_DEMO_LOGIN === "1";

const HERO =
  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=2000&q=80";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickAccess = async (demoEmail) => {
    setError("");
    setLoading(true);
    try {
      await login(demoEmail, "bella123");
      navigate("/");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10 sm:px-6">
      {/* Full-bleed atmosphere */}
      <div className="absolute inset-0">
        <img
          src={HERO}
          alt=""
          className="absolute inset-0 h-full w-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a1520]/85 via-[#4a2035]/70 to-[#1a1018]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(224,90,120,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_75%,rgba(196,120,90,0.22),transparent_50%)]" />
      </div>

      {/* Soft floating orbs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-rose-400/25 blur-3xl"
        animate={{ y: [0, 18, 0], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-amber-200/15 blur-3xl"
        animate={{ y: [0, -14, 0], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* Brand ÔÇö hero signal */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md shadow-[0_0_40px_rgba(224,90,120,0.35)]"
          >
            <Sparkles className="h-7 w-7 text-rose-100" />
          </motion.div>
          <h1 className="font-display text-4xl sm:text-[2.75rem] font-bold tracking-tight text-white drop-shadow-sm">
            Projeto Faculdade
          </h1>
          <p className="mt-2 text-[15px] text-rose-100/80 font-medium tracking-wide">
            Gestão elegante para a sua clínica
          </p>
        </div>

        {/* Glass form panel ÔÇö interaction container */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5 }}
          className="rounded-[1.75rem] border border-white/20 bg-white/10 p-7 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
        >
          <div className="mb-6">
            <h2 className="font-display text-xl font-semibold text-white">Entrar</h2>
            <p className="mt-1 text-sm text-white/55">Use o e-mail e a senha da equipe</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-white/70 text-xs uppercase tracking-wider">E-mail</Label>
              <Input
                data-testid="login-email-input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@clinica.com"
                className="mt-1.5 h-12 rounded-xl border-white/15 bg-white/10 text-white placeholder:text-white/35 focus-visible:ring-rose-300/50 focus-visible:border-rose-300/40"
                required
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs uppercase tracking-wider">Senha</Label>
              <Input
                data-testid="login-password-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="............."
                className="mt-1.5 h-12 rounded-xl border-white/15 bg-white/10 text-white placeholder:text-white/35 focus-visible:ring-rose-300/50 focus-visible:border-rose-300/40"
                required
              />
            </div>

            {error && (
              <p
                data-testid="login-error"
                className="text-sm text-rose-100 bg-rose-500/25 border border-rose-300/30 px-3 py-2.5 rounded-xl"
              >
                {error}
              </p>
            )}

            <Button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="group relative w-full h-12 rounded-full bg-gradient-to-r from-rose-500 to-[#E05A78] hover:from-rose-400 hover:to-rose-500 text-white font-semibold tracking-wide shadow-[0_12px_40px_rgba(224,90,120,0.45)] border-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="inline-flex items-center gap-2">
                  Continuar
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </Button>
          </form>

          {DEMO_LOGIN && (
            <div className="mt-6 pt-5 border-t border-white/10">
              <p className="text-center text-[10px] text-white/40 mb-3 uppercase tracking-[0.2em]">
                Demonstração
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "quick-access-admin", email: "admin@faculdade.com", label: "Dono" },
                  { id: "quick-access-secretaria", email: "recepcao@faculdade.com", label: "Recepção" },
                  { id: "quick-access-profissional", email: "juliana@faculdade.com", label: "Profissional" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={item.id}
                    onClick={() => quickAccess(item.email)}
                    disabled={loading}
                    className="h-10 rounded-full border border-white/15 bg-white/5 text-white/80 text-xs font-medium hover:bg-white/15 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <p className="mt-6 text-center text-sm text-white/45">
          Sem acesso? Entre em contato com o administrador.
        </p>
      </motion.div>
    </div>
  );
}
