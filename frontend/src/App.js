import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Login from "@/modules/ManterUsuario/Paginas/Login";
import Dashboard from "@/pages/Dashboard";
import Despesas from "@/modules/ManterFinanceiro/Despesas/Paginas/Despesas";
import Clientes from "@/modules/ManterClientes/Paginas/Clientes";
import ClienteDetalhe from "@/modules/ManterClientes/Paginas/ClienteDetalhe";
import Agendamentos from "@/modules/ManterAgendamento/Paginas/Agendamentos";
import Procedimentos from "@/modules/ManterProcedimento/Paginas/Procedimentos";
import Equipe from "@/modules/ManterUsuario/Paginas/Equipe";
import FluxoCaixa from "@/modules/ManterFinanceiro/FluxoCaixa/Paginas/FluxoCaixa";
import Fechamento from "@/modules/ManterFinanceiro/Fechamento/Paginas/Fechamento";

function Protected({ children, roles }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen flex items-center justify-center text-rose-400">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function App() {
  useEffect(() => {
    document.title = "Projeto Faculdade";
  }, []);

  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/financeiro" element={<Protected roles={["admin"]}><Despesas /></Protected>} />
            <Route path="/fluxo-caixa" element={<Protected roles={["admin"]}><FluxoCaixa /></Protected>} />
            <Route path="/fechamento" element={<Protected roles={["admin"]}><Fechamento /></Protected>} />
            <Route path="/clientes" element={<Protected><Clientes /></Protected>} />
            <Route path="/clientes/:id" element={<Protected><ClienteDetalhe /></Protected>} />
            <Route path="/agendamentos" element={<Protected><Agendamentos /></Protected>} />
            <Route path="/procedimentos" element={<Protected roles={["admin"]}><Procedimentos /></Protected>} />
            <Route path="/equipe" element={<Protected roles={["admin"]}><Equipe /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
