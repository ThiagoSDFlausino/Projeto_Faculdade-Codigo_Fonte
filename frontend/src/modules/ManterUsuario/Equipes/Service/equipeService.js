import api from "@/lib/api";

export const equipeService = {
  listar: () => api.get("/staff").then((r) => r.data),
  profissionais: () => api.get("/professionals").then((r) => r.data),
  criar: (payload) => api.post("/staff", payload).then((r) => r.data),
  atualizar: (id, payload) => api.put(`/staff/${id}`, payload).then((r) => r.data),
  remover: (id) => api.delete(`/staff/${id}`).then((r) => r.data),
  login: (email, password) => api.post("/auth/login", { email, password }).then((r) => r.data),
};
