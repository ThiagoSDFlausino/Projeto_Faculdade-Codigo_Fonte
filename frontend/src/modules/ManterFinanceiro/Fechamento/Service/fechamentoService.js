import api from "@/lib/api";

export const fechamentoService = {
  preview: async ({ periodoInicio, periodoFim }) => {
    const { data } = await api.get("/agendas-api/Fechamento", {
      params: {
        periodoInicio,
        periodoFim,
      },
    });

    return data;
  },
};