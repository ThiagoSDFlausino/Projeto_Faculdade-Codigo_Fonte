import axios from "axios";

export const API = (
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8081"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL: API,
});

const ROTAS = [
  ["/clientes", "/clientes-api/Clientes", "cliente"],
  ["/procedures", "/procedimentos-api/Procedimentos", "procedimento"],
  ["/appointments", "/agendas-api/Agendas", "agenda"],
  ["/transactions", "/despesas-api/Despesas", "despesa"],
  ["/staff", "/usuarios-api/Usuarios", "usuario"],
];

const PERFIS = {
  admin: "ADM",
  secretaria: "SECRETARIA",
  profissional: "PROFISSIONAL",
};

const STATUS_AGENDA = {
  Agendado: "AGENDADO",
  Confirmado: "CONFIRMADO",
  Concluído: "CONCLUIDO",
  Cancelado: "CANCELADO",
};

const STATUS_TELA = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const CATEGORIAS = {
  "Injetáveis": "INJETAVEIS",
  Preenchedores: "PREENCHEDORES",
  Bioestimulador: "BIOESTIMULADOR",
  Laser: "LASER",
  "Estética Facial": "ESTETICA_FACIAL",
  Geral: "GERAL",
};

const CATEGORIAS_TELA = Object.fromEntries(
  Object.entries(CATEGORIAS).map(([texto, codigo]) => [codigo, texto])
);

function referencia(id, nome) {
  if (id === null || id === undefined || id === "") {
    throw new Error(`Selecione ${nome}.`);
  }

  const numero = Number(id);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error(`O ID de ${nome} é inválido.`);
  }

  return { id: numero };
}

function dataParaJava(valor) {
  if (!valor) return null;

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    throw new Error("Informe uma data válida.");
  }

  return data.toISOString();
}

function dataLocal(valor) {
  if (!valor) return "";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  const pad = (numero) => String(numero).padStart(2, "0");

  return [
    `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`,
    `${pad(data.getHours())}:${pad(data.getMinutes())}`,
  ].join("T");
}

function valorNumerico(valor, campo) {
  if (valor === "" || valor === null || valor === undefined) {
    throw new Error(`Informe ${campo}.`);
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero < 0) {
    throw new Error(`Informe ${campo} válido, sem valor negativo.`);
  }

  return numero;
}

function usuarioTela(usuario) {
  const role =
    usuario.role ||
    {
      ADM: "admin",
      SECRETARIA: "secretaria",
      PROFISSIONAL: "profissional",
    }[usuario.perfil];

  return {
    id: String(usuario.id),
    name: usuario.name ?? usuario.nome ?? "",
    email: usuario.email ?? "",
    role,
    funcao: usuario.funcao ?? "",
    procedimento_ids: (
      usuario.procedimento_ids ||
      usuario.procedimentos?.map((item) => item.id) ||
      []
    ).map(String),
  };
}

function clienteTela(cliente) {
  return {
    id: String(cliente.id),
    name: cliente.nome ?? "",
    phone: cliente.telefone ?? "",
    email: cliente.email ?? "",
    birthdate: cliente.dataNascimento
      ? String(cliente.dataNascimento).slice(0, 10)
      : "",
    photo: cliente.foto ?? "",
    tags: cliente.tags ?? [],
    notes: cliente.observacoes ?? "",
    observacoes: cliente.observacoes ?? "",
    status: cliente.statusCliente === "INATIVO" ? "Inativo" : "Ativo",
  };
}

function procedimentoTela(procedimento) {
  return {
    id: String(procedimento.id),
    name: procedimento.nome ?? "",
    description: procedimento.descricao ?? "",
    duration_min: procedimento.duracao,
    duracao: procedimento.duracao,
    price: procedimento.preco,
    active: procedimento.ativo,
    category:
      CATEGORIAS_TELA[procedimento.categoriaProcedimento] ||
      procedimento.categoriaProcedimento,
  };
}

function agendaTela(agenda) {
  return {
    id: String(agenda.id),
    cliente_id: agenda.cliente ? String(agenda.cliente.id) : "",
    cliente_name: agenda.cliente?.nome ?? "",
    professional_id: agenda.profissional
      ? String(agenda.profissional.id)
      : "",
    professional: agenda.profissional?.nome ?? "",
    procedure_id: agenda.procedimento
      ? String(agenda.procedimento.id)
      : "",
    procedure: agenda.procedimento?.nome ?? "",
    data_hora_inicio: dataLocal(agenda.dataHoraInicio),
    data_hora_fim: dataLocal(agenda.dataHoraFim),
    datetime: dataLocal(agenda.dataHoraInicio),
    data_conclusao: agenda.dataConclusao,
    valor_cobrado: agenda.valorCobrado,
    value: agenda.valorCobrado ?? agenda.procedimento?.preco,
    observacoes: agenda.observacoes ?? "",
    status: STATUS_TELA[agenda.statusAgenda] || agenda.statusAgenda,
  };
}

function despesaTela(despesa) {
  return {
    id: String(despesa.id),
    description: despesa.descricao ?? "",
    amount: despesa.valor,
    data: despesa.data ? String(despesa.data).slice(0, 10) : "",
    due_date: despesa.data ? String(despesa.data).slice(0, 10) : "",
    usuario_nome: despesa.usuario?.nome ?? "",
    usuario: despesa.usuario,
    type: "despesa",
  };
}

const CONVERSORES = {
  cliente: clienteTela,
  procedimento: procedimentoTela,
  agenda: agendaTela,
  despesa: despesaTela,
  usuario: usuarioTela,
};

function payloadJava(tipo, payload) {
  if (tipo === "cliente") {
    return {
      nome: payload.name?.trim() ?? "",
      telefone: payload.phone?.trim() ?? "",
      email: payload.email?.trim() ?? "",
      dataNascimento: payload.birthdate
        ? `${payload.birthdate}T00:00:00.000Z`
        : null,
      foto: payload.photo ?? "",
      tags: payload.tags ?? [],
      observacoes: payload.notes ?? payload.observacoes ?? "",
      statusCliente:
        payload.status === "Inativo" || payload.status === "INATIVO"
          ? "INATIVO"
          : "ATIVO",
    };
  }

  if (tipo === "procedimento") {
    return {
      nome: payload.name?.trim() ?? "",
      descricao: payload.description ?? payload.descricao ?? "",
      duracao: valorNumerico(
        payload.duration_min ?? payload.duracao,
        "a duração"
      ),
      preco: valorNumerico(payload.price, "o preço"),
      ativo: payload.active !== false,
      categoriaProcedimento:
        CATEGORIAS[payload.category] || payload.category,
    };
  }

  if (tipo === "agenda") {
    return {
      dataHoraInicio: dataParaJava(
        payload.data_hora_inicio || payload.datetime
      ),
      dataHoraFim: dataParaJava(payload.data_hora_fim),
      observacoes: payload.observacoes ?? payload.notes ?? "",
      profissional: referencia(payload.professional_id, "o profissional"),
      cliente: referencia(payload.cliente_id, "o cliente"),
      procedimento: referencia(payload.procedure_id, "o procedimento"),
      statusAgenda: STATUS_AGENDA[payload.status] || payload.status,
    };
  }

  if (tipo === "usuario") {
    if (!payload.password?.trim()) {
      throw new Error(
        "O backend atual exige senha também na atualização do usuário. " +
          "Informe uma senha; não utilize o hash armazenado."
      );
    }

    return {
      nome: payload.name?.trim() ?? "",
      email: payload.email?.trim() ?? "",
      senha: payload.password,
      funcao: payload.funcao ?? "",
      perfil: PERFIS[payload.role] || payload.role,
      procedimentos:
        payload.role === "profissional"
          ? (payload.procedimento_ids ?? []).map((id) =>
              referencia(id, "o procedimento")
            )
          : [],
    };
  }

  if (tipo === "despesa") {
    // O responsável vem da identidade validada pelo login,
    // não de um ID fixo no código.
    let usuarioAutenticado;

    try {
      usuarioAutenticado = JSON.parse(
        localStorage.getItem("spring_user") || "null"
      );
    } catch {
      usuarioAutenticado = null;
    }

    const usuario = payload.usuario?.id || usuarioAutenticado?.id;

    return {
      data: dataParaJava(
        payload.data || payload.due_date || payload.paid_date
      ),
      descricao: payload.description ?? "",
      valor: valorNumerico(payload.amount, "o valor"),
      usuario: referencia(usuario, "o usuário responsável"),
    };
  }

  return payload;
}

function itemFluxo(agenda, entrada) {
  return {
    agendamento_id: agenda.id,
    data: String(
      entrada ? agenda.dataConclusao : agenda.dataHoraInicio
    ).slice(0, 10),
    descricao: [
      agenda.procedimento?.nome || "Procedimento",
      agenda.cliente?.nome,
    ]
      .filter(Boolean)
      .join(" - "),
    categoria: agenda.procedimento?.nome ?? "",
    valor: entrada ? agenda.valorCobrado : agenda.procedimento?.preco,
    origem: "agenda",
    status_agenda: STATUS_TELA[agenda.statusAgenda],
    profissional: agenda.profissional?.nome ?? "",
  };
}

function fluxoTela(fluxo) {
  return {
    entradas: (fluxo.entradas ?? []).map((item) => itemFluxo(item, true)),
    a_receber: (fluxo.aReceber ?? []).map((item) => itemFluxo(item, false)),
    saidas: (fluxo.saidas ?? []).map((despesa) => ({
      id: despesa.id,
      data: String(despesa.data).slice(0, 10),
      descricao: despesa.descricao ?? "",
      valor: despesa.valor,
      origem: "despesa",
      usuario_nome: despesa.usuario?.nome ?? "",
    })),
    total_entradas: fluxo.totalEntradas,
    total_a_receber: fluxo.totalAReceber,
    total_saidas: fluxo.totalSaidas,
    saldo: fluxo.saldo,
  };
}

function recursoPendente(url) {
  return (
    url === "/dashboard" ||
    url === "/ai/client-summary" ||
    url === "/procedures/stats" ||
    url.startsWith("/fechamentos") ||
    /^\/(anamneses|sessoes|gallery|notas|lembretes|avaliacoes|interacoes)(\/|$)/.test(
      url
    ) ||
    /^\/clientes\/[^/]+\/(notas|lembretes|avaliacoes|interacoes)(\/|$)/.test(
      url
    )
  );
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bella_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const url = config.url || "";
  const metodo = (config.method || "get").toLowerCase();

  if (recursoPendente(url)) {
    const erro = new Error(
      "Este recurso ainda não está integrado ao Spring " +
        "ou foi retirado do escopo."
    );

    erro.response = {
      status: 501,
      data: { detail: erro.message },
    };

    return Promise.reject(erro);
  }

  if (url === "/professionals") {
    config.url = "/usuarios-api/Usuarios";
    config.springTipo = "profissionais";
    return config;
  }

  if (url === "/fluxo-caixa") {
    config.url = "/agendas-api/FluxoCaixa";
    config.springTipo = "fluxo";

    config.params = {
      dataInicio:
        config.params?.dataInicio || config.params?.from_date || undefined,
      dataFim:
        config.params?.dataFim || config.params?.to_date || undefined,
    };

    return config;
  }

  for (const [antiga, nova, tipo] of ROTAS) {
    if (url === antiga || url.startsWith(`${antiga}/`)) {
      config.url = nova + url.slice(antiga.length);
      config.springTipo = tipo;

      if (
        tipo === "cliente" &&
        metodo === "get" &&
        url !== antiga
      ) {
        // O Java ainda não possui consulta individual.
        // Busca a lista e seleciona o cliente na resposta.
        config.springClienteId = url.slice(antiga.length + 1);
        config.url = nova;
      }

      if (metodo === "post" || metodo === "put") {
        config.data = payloadJava(tipo, config.data || {});
      }

      return config;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const tipo = response.config.springTipo;
    const metodo = (response.config.method || "get").toLowerCase();

    if (tipo === "fluxo") {
      response.data = fluxoTela(response.data);
      return response;
    }

    if (tipo === "profissionais") {
      response.data = response.data
        .map(usuarioTela)
        .filter((usuario) => usuario.role === "profissional");

      return response;
    }

    if (tipo && (metodo === "get" || metodo === "post")) {
      const converter = CONVERSORES[tipo];

      if (converter) {
        response.data = Array.isArray(response.data)
          ? response.data.map(converter)
          : converter(response.data);
      }
    }

    if (response.config.springClienteId) {
      const cliente = response.data.find(
        (item) => item.id === response.config.springClienteId
      );

      if (!cliente) {
        const erro = new Error("Cliente não encontrado.");
        erro.response = {
          status: 404,
          data: { detail: erro.message },
        };
        return Promise.reject(erro);
      }

      response.data = { cliente };
    }

    return response;
  },
  (erro) => {
    const status = erro.response?.status;
    const dados = erro.response?.data;

    const mensagens = {
      400: "Verifique os campos obrigatórios e os dados informados.",
      401: "Sessão inválida ou expirada. Entre novamente.",
      403: "Seu perfil não possui permissão para esta operação.",
      404: "Recurso não encontrado no backend.",
      409: "A operação entra em conflito com o estado atual dos dados.",
      500: "Erro interno no backend. Consulte o log do Spring.",
    };

    let detail;

    if (typeof dados === "string" && dados.trim()) {
      detail = dados;
    } else if (typeof dados?.detail === "string") {
      detail = dados.detail;
    } else if (dados && typeof dados === "object") {
      detail = Object.values(dados)
        .filter((valor) => typeof valor === "string")
        .join(" ");
    }

    if (erro.response) {
      erro.response.data = {
        detail: detail || mensagens[status] || erro.message,
      };
    }

    return Promise.reject(erro);
  }
);

export function formatApiErrorDetail(detail) {
  if (detail == null) {
    return "Não foi possível realizar a operação.";
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || String(item))
      .join(" ");
  }

  if (typeof detail.msg === "string") {
    return detail.msg;
  }

  if (typeof detail === "object") {
    return Object.values(detail)
      .filter((item) => typeof item === "string")
      .join(" ");
  }

  return String(detail);
}

export const brl = (valor) =>
  Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default api;
