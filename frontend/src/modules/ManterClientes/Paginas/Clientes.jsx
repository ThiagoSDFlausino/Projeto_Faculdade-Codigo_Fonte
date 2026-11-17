import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Search, Phone } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { invalidateClienteImpact } from "@/lib/invalidateCliente";
import { PageHeader, Card, StatusBadge } from "@/components/Shared";
import {
  ListPagination,
  usePagination,
} from "@/components/ListPagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const empty = {
  name: "",
  phone: "",
  email: "",
  birthdate: "",
  notes: "",
  status: "Ativo",
};

function mensagemErro(erro) {
  const status = erro.response?.status;

  if (status === 401) {
    return "Sua sessão é inválida ou expirou. Entre novamente.";
  }

  if (status === 403) {
    return "Seu perfil não tem permissão para essa operação.";
  }

  if (status === 404) {
    return "A rota de Clientes não foi encontrada no backend.";
  }

  const dados = erro.response?.data;

  if (typeof dados === "string" && dados.trim()) {
    return dados;
  }

  if (typeof dados?.detail === "string") {
    return dados.detail;
  }

  if (dados && typeof dados === "object") {
    const mensagens = Object.values(dados).filter(
      (valor) => typeof valor === "string"
    );

    if (mensagens.length > 0) {
      return mensagens.join(" ");
    }
  }

  return erro.message || "Não foi possível realizar a operação.";
}

export default function Clientes() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });

  const {
    data: clientes = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data } = await api.get("/clientes");
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: (payload) => api.post("/clientes", payload),

    onSuccess: () => {
      invalidateClienteImpact(qc);
      qc.invalidateQueries({ queryKey: ["clientes"] });

      setOpen(false);
      setForm({ ...empty });

      toast.success("Cliente cadastrado!");
    },

    onError: (erro) => {
      toast.error(mensagemErro(erro));
    },
  });

  const filtered = clientes.filter((cliente) =>
    (cliente.name ?? "")
      .toLowerCase()
      .includes(q.toLowerCase())
  );

  const pager = usePagination(filtered, {
    pageSize: 12,
    resetKey: q,
  });

  const slug = (name) =>
    (name ?? "").toLowerCase().replace(/\s+/g, "-");

  const submit = (event) => {
    event.preventDefault();

    createMut.mutate({
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    });
  };

  return (
    <div>
      <PageHeader
        title="Manter Clientes"
        subtitle="Cadastro e consulta de clientes"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-client-button"
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-200"
              >
                <Plus className="w-4 h-4 mr-1" />
                Novo Cliente
              </Button>
            </DialogTrigger>

            <DialogContent className="rounded-3xl border-rose-100">
              <DialogHeader>
                <DialogTitle className="font-display">
                  Novo Cliente
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={submit} className="space-y-3">
                <div>
                  <Label>Nome</Label>
                  <Input
                    data-testid="client-name-input"
                    className="mt-1"
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      data-testid="client-phone-input"
                      className="mt-1"
                      value={form.phone}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          phone: event.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label>Nascimento</Label>
                    <Input
                      type="date"
                      className="mt-1"
                      value={form.birthdate}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          birthdate: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>E-mail</Label>
                  <Input
                    data-testid="client-email-input"
                    type="email"
                    className="mt-1"
                    value={form.email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email: event.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label>Observações</Label>
                  <Input
                    className="mt-1"
                    value={form.notes}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        notes: event.target.value,
                      })
                    }
                  />
                </div>

                <DialogFooter>
                  <Button
                    data-testid="client-submit-button"
                    type="submit"
                    disabled={createMut.isPending}
                    className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
                  >
                    {createMut.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

        <Input
          data-testid="crm-patient-search-input"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar cliente..."
          className="pl-10 bg-white border-rose-100 focus-visible:ring-rose-300 rounded-xl"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl ai-shimmer"
            />
          ))}
        </div>
      ) : isError ? (
        <Card className="p-10 text-center text-red-600">
          {mensagemErro(error)}
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-slate-400">
          Nenhum cliente encontrado.
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pager.pageItems.map((cliente, index) => (
              <motion.div
                key={cliente.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ y: -3 }}
              >
                <Card
                  className="p-5 cursor-pointer"
                  data-testid={`patient-card-${slug(cliente.name)}`}
                  onClick={() =>
                    navigate(`/clientes/${cliente.id}`)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white font-semibold">
                      {(cliente.name ?? "").charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {cliente.name}
                      </p>

                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {cliente.phone || "—"}
                      </p>

                      <p className="text-xs text-slate-400 truncate mt-1">
                        {cliente.email || "—"}
                      </p>
                    </div>

                    <StatusBadge status={cliente.status} />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="mt-4 overflow-hidden">
            <ListPagination
              page={pager.page}
              totalPages={pager.totalPages}
              total={pager.total}
              from={pager.from}
              to={pager.to}
              onPageChange={pager.setPage}
            />
          </Card>
        </>
      )}
    </div>
  );
}
