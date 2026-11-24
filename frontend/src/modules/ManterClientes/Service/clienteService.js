import api from "@/lib/api";

export const clienteService = {
  listar: () => api.get("/clientes").then((r) => r.data),
  obter: (id) => api.get(`/clientes/${id}`).then((r) => r.data),
  criar: (payload) => api.post("/clientes", payload).then((r) => r.data),
  atualizar: (id, payload) => api.put(`/clientes/${id}`, payload).then((r) => r.data),
  remover: (id) => api.delete(`/clientes/${id}`).then((r) => r.data),
};
