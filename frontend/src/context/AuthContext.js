import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "@/lib/api";
import queryClient from "@/lib/queryClient";

const AuthContext = createContext(null);

function normalizarUsuario(usuario) {
  return {
    ...usuario,
    id: String(usuario.id),
    procedimento_ids: (usuario.procedimento_ids ?? []).map(String),
  };
}

function limparSessao() {
  localStorage.removeItem("bella_token");
  localStorage.removeItem("spring_user");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ativo = true;

    const token = localStorage.getItem("bella_token");

    if (!token) {
      limparSessao();
      setUser(false);
      setReady(true);
      return undefined;
    }

    api
      .get("/auth/me")
      .then(({ data }) => {
        if (!ativo) return;

        const usuario = normalizarUsuario(data);

        localStorage.setItem("spring_user", JSON.stringify(usuario));
        setUser(usuario);
      })
      .catch(() => {
        if (!ativo) return;

        limparSessao();
        queryClient.clear();
        setUser(false);
      })
      .finally(() => {
        if (ativo) setReady(true);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email: email.trim(),
      password,
    });

    const usuario = normalizarUsuario(data.user);

    localStorage.setItem("bella_token", data.token);
    localStorage.setItem("spring_user", JSON.stringify(usuario));

    queryClient.clear();
    setUser(usuario);
    setReady(true);
  };

  const logout = () => {
    limparSessao();
    queryClient.clear();
    setUser(false);
    setReady(true);
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
