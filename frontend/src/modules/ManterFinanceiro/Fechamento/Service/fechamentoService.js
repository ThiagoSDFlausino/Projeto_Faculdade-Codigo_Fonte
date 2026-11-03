import api from "@/lib/api";

export const fechamentoService = {
  listar: () => api.get("/fechamentos").then((r) => r.data),
  preview: (params) => api.get("/fechamentos/preview", { params }).then((r) => r.data),
  criar: (payload) => api.post("/fechamentos", payload).then((r) => r.data),
  remover: (id) => api.delete(`/fechamentos/${id}`).then((r) => r.data),
};
