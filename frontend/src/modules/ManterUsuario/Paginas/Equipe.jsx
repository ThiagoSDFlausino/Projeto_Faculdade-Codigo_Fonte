import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageHeader, Card } from "@/components/Shared";
import { ListPagination, usePagination } from "@/components/ListPagination";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLE_LABEL = { admin: "Dono / Gestor", secretaria: "Recepção", profissional: "Profissional" };
const ROLE_BADGE = { admin: "bg-purple-50 text-purple-600", secretaria: "bg-sky-50 text-sky-600", profissional: "bg-rose-50 text-rose-600" };
const emptyNew = { name: "", email: "", password: "", role: "profissional", specialty: "", commission_pct: 30 };

export default function Equipe() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyNew);

  const { data: staff = [], isLoading } = useQuery({ queryKey: ["staff"], queryFn: async () => (await api.get("/staff")).data });
  const pager = usePagination(staff, { pageSize: 12 });

  const createMut = useMutation({
    mutationFn: (p) => api.post("/staff", p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); setOpen(false); setForm(emptyNew); toast.success("Membro adicionado!"); },
    onError: (e) => toast.error(e.response?.data?.detail || "Erro ao adicionar"),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, p }) => api.put(`/staff/${id}`, p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); setEditing(null); toast.success("Atualizado!"); },
    onError: (e) => toast.error(e.response?.data?.detail || "Erro"),
  });
  const delMut = useMutation({
    mutationFn: (id) => api.delete(`/staff/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); toast.success("Removido"); },
    onError: (e) => toast.error(e.response?.data?.detail || "Erro"),
  });

  const startEdit = (m) => setEditing({ ...m, password: "" });

  return (
    <div>
      <PageHeader
        title="Equipe"
        subtitle="Gerencie acessos: cada perfil não apenas o que precisa"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-staff-button" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-200">
                <Plus className="w-4 h-4 mr-1" /> Novo Membro
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-rose-100">
              <DialogHeader><DialogTitle className="font-display">Novo Membro da Equipe</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createMut.mutate({ ...form, commission_pct: parseFloat(form.commission_pct) || 0 }); }} className="space-y-3">
                <div><Label>Nome</Label><Input data-testid="staff-name-input" className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label>E-mail</Label><Input data-testid="staff-email-input" type="email" className="mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
                  <div>
                    <Label>Senha</Label>
                    <Input
                      data-testid="staff-password-input"
                      type="password"
                      autoComplete="new-password"
                      className="mt-1"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Mín. 8 caracteres"
                      minLength={8}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Perfil</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                      <SelectTrigger data-testid="staff-role-select" className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Dono / Gestor</SelectItem>
                        <SelectItem value="secretaria">Recepção</SelectItem>
                        <SelectItem value="profissional">Profissional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Comissão (%)</Label><Input type="number" className="mt-1" value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: e.target.value })} /></div>
                </div>
                <div><Label>Especialidade</Label><Input className="mt-1" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Ex: Biomédica Esteta" /></div>
                <DialogFooter><Button data-testid="staff-submit-button" type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-2xl ai-shimmer" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="staff-list">
            {pager.pageItems.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-5">
                  <div className="flex items-center gap-3">
                    {m.photo ? <img src={m.photo} alt={m.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-100" /> :
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white font-semibold">{m.name.charAt(0)}</div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{m.name}</p>
                      <p className="text-xs text-slate-400 truncate">{m.email}</p>
                    </div>
                    {!m.active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">Inativo</span>}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-rose-50">
                    <div>
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[m.role]}`}>
                        <ShieldCheck className="w-3 h-3" /> {ROLE_LABEL[m.role]}
                      </span>
                      {m.role === "profissional" && <p className="text-xs text-slate-400 mt-1">{m.specialty} · {m.commission_pct}%</p>}
                    </div>
                    <div className="flex gap-1">
                      <button data-testid={`edit-staff-${m.id}`} onClick={() => startEdit(m)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Pencil className="w-4 h-4" /></button>
                      {m.id !== user.id && (
                        <button data-testid={`delete-staff-${m.id}`} onClick={() => delMut.mutate(m.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          {staff.length > 0 && (
            <Card className="mt-4 overflow-hidden">
              <ListPagination page={pager.page} totalPages={pager.totalPages} total={pager.total} from={pager.from} to={pager.to} onPageChange={pager.setPage} />
            </Card>
          )}
        </>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="rounded-3xl border-rose-100">
          <DialogHeader><DialogTitle className="font-display">Editar Membro</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const p = {
                name: editing.name,
                role: editing.role,
                specialty: editing.specialty,
                commission_pct: parseFloat(editing.commission_pct) || 0,
                active: editing.active,
                photo: editing.photo || "",
              };
              if (editing.password?.trim()) p.password = editing.password.trim();
              updateMut.mutate({ id: editing.id, p });
            }} className="space-y-3">
              <div><Label>Nome</Label><Input className="mt-1" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div>
                <Label>Nova senha (opcional)</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  className="mt-1"
                  value={editing.password || ""}
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                  placeholder="Deixe em branco para manter"
                  minLength={8}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Perfil</Label>
                  <Select value={editing.role} onValueChange={(v) => setEditing({ ...editing, role: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Dono / Gestor</SelectItem>
                      <SelectItem value="secretaria">Recepção</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Comissão (%)</Label><Input type="number" className="mt-1" value={editing.commission_pct} onChange={(e) => setEditing({ ...editing, commission_pct: e.target.value })} /></div>
              </div>
              <div><Label>Especialidade</Label><Input className="mt-1" value={editing.specialty || ""} onChange={(e) => setEditing({ ...editing, specialty: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} /><Label>Ativo</Label></div>
              <DialogFooter><Button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">Salvar</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
