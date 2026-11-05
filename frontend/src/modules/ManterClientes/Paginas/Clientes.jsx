import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Search, Phone } from "lucide-react";
import { toast } from "sonner";
import api, { brl } from "@/lib/api";
import { invalidateClienteImpact } from "@/lib/invalidateCliente";
import { PageHeader, Card, StatusBadge } from "@/components/Shared";
import { ListPagination, usePagination } from "@/components/ListPagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

const empty = { name: "", phone: "", email: "", birthdate: "", notes: "", status: "Ativo", tags: [] };

export default function Clientes() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => (await api.get("/clientes")).data,
  });

  const createMut = useMutation({
    mutationFn: (payload) => api.post("/clientes", payload),
    onSuccess: () => {
      invalidateClienteImpact(qc);
      setOpen(false); setForm(empty); toast.success("Cliente cadastrado!");
    },
    onError: () => toast.error("Erro ao cadastrar cliente"),
  });

  const filtered = clientes.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const pager = usePagination(filtered, { pageSize: 12, resetKey: q });

  const slug = (name) => name.toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      <PageHeader
        title="Manter Clientes"
        subtitle="Caso de uso da Recepção (herdado por Adm e Profissional)"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-client-button" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-200">
                <Plus className="w-4 h-4 mr-1" /> Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-rose-100">
              <DialogHeader><DialogTitle className="font-display">Novo Cliente</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form); }} className="space-y-3">
                <div>
                  <Label>Nome</Label>
                  <Input data-testid="client-name-input" className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Telefone</Label>
                    <Input data-testid="client-phone-input" className="mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Nascimento</Label>
                    <Input type="date" className="mt-1" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input data-testid="client-email-input" type="email" className="mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Input className="mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button data-testid="client-submit-button" type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">Salvar</Button>
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
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar paciente..."
          className="pl-10 bg-white border-rose-100 focus-visible:ring-rose-300 rounded-xl"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-2xl ai-shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-slate-400">Nenhum cliente encontrado.</Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pager.pageItems.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -3 }}
              >
                <Card
                  className="p-5 cursor-pointer"
                  data-testid={`patient-card-${slug(c.name)}`}
                  onClick={() => navigate(`/clientes/${c.id}`)}
                >
                  <div className="flex items-center gap-3">
                    {c.photo ? (
                      <img src={c.photo} alt={c.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white font-semibold">
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone || "—"}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-rose-50">
                    <div className="flex gap-1 flex-wrap">
                      {(c.tags || []).slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 font-medium">{t}</span>
                      ))}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase">LTV</p>
                      <p className="font-display font-bold text-rose-600">{brl(c.total_spent)}</p>
                    </div>
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
