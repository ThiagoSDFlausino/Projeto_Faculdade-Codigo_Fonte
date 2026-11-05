import api from "@/lib/api";

export const despesaService = {
  listar: () => api.get("/transactions").then((r) => r.data),
  criar: (payload) => api.post("/transactions", { ...payload, type: "despesa" }).then((r) => r.data),
  atualizar: (id, payload) => api.put(`/transactions/${id}`, payload).then((r) => r.data),
  remover: (id) => api.delete(`/transactions/${id}`).then((r) => r.data),
};
