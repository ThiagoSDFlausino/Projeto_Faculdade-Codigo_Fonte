import api from "@/lib/api";

export const agendamentoService = {
  listar: (params) => api.get("/appointments", { params }).then((r) => r.data),
  criar: (payload) => api.post("/appointments", payload).then((r) => r.data),
  atualizar: (id, payload) => api.put(`/appointments/${id}`, payload).then((r) => r.data),
  remover: (id) => api.delete(`/appointments/${id}`).then((r) => r.data),
};
