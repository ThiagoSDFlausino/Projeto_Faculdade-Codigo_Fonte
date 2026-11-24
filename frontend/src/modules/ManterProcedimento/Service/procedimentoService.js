import api from "@/lib/api";

export const procedimentoService = {
  listar: () => api.get("/procedures").then((r) => r.data),
  estatisticas: (params) => api.get("/procedures/stats", { params }).then((r) => r.data),
  criar: (payload) => api.post("/procedures", payload).then((r) => r.data),
  atualizar: (id, payload) => api.put(`/procedures/${id}`, payload).then((r) => r.data),
  remover: (id) => api.delete(`/procedures/${id}`).then((r) => r.data),
};
