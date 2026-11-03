import api from "@/lib/api";

export const fluxoService = {
  obter: (params) => api.get("/fluxo-caixa", { params }).then((r) => r.data),
};
