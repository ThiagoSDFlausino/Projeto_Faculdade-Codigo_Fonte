import { useRef, useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft, Sparkles, Loader2, Plus, ClipboardList, Activity, CalendarDays, Phone, Mail,
  Camera, History, Upload, Trash2, ArrowRight, StickyNote, Bell, Star, MessageSquare, Paperclip, ExternalLink, X, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import api, { brl } from "@/lib/api";
import { invalidateClienteImpact } from "@/lib/invalidateCliente";
import { Card, StatusBadge } from "@/components/Shared";
import { PaginatedItems } from "@/components/ListPagination";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIMELINE_SEGMENT_COLORS = [
  "from-rose-400 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-cyan-500",
  "from-fuchsia-400 to-pink-500",
  "from-violet-400 to-purple-500",
  "from-emerald-400 to-lime-500",
];

function formatTimelineDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function ClientHorizontalTimeline({ items }) {
  const scrollerRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState({ left: 0, width: 100, canScroll: false });

  const updateProgress = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const canScroll = max > 4;
    const width = canScroll ? Math.max(18, (el.clientWidth / el.scrollWidth) * 100) : 100;
    const left = canScroll ? (el.scrollLeft / max) * (100 - width) : 0;
    setProgress({ left, width, canScroll });
  }, []);

  useEffect(() => {
    updateProgress();
    const el = scrollerRef.current;
    if (!el) return undefined;
    const onScroll = () => updateProgress();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateProgress) : null;
    ro?.observe(el);
    window.addEventListener("resize", updateProgress);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro?.disconnect();
      window.removeEventListener("resize", updateProgress);
    };
  }, [items, updateProgress]);

  const onPointerDown = (e) => {
    const el = scrollerRef.current;
    if (!el || e.button === 2) return;
    drag.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: false };
    setDragging(true);
    el.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const el = scrollerRef.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.scrollLeft - dx;
  };

  const endDrag = (e) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    try {
      scrollerRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
    }
  };

  if (items.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-6 px-6">Sem histórico ainda.</p>;
  }

  const n = items.length;

  return (
    <div data-testid="timeline" className="select-none">
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={(e) => { if (drag.current.active) endDrag(e); }}
        className={`overflow-x-auto px-4 sm:px-6 py-5 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ touchAction: "pan-y" }}
      >
        <div className="relative" style={{ width: Math.max(n * 190, 360) }}>
          <div
            className="absolute h-3 rounded-full shadow-md shadow-slate-200/80 overflow-hidden flex pointer-events-none"
            style={{ left: 48, right: 48, top: "50%", transform: "translateY(-50%)" }}
          >
            {items.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-full bg-gradient-to-r ${TIMELINE_SEGMENT_COLORS[i % TIMELINE_SEGMENT_COLORS.length]}`}
              />
            ))}
          </div>

          <div className="relative z-10 flex">
            {items.map((t, i) => {
              const contentAbove = i % 2 === 1;
              const Icon = t.icon;
              const color = TIMELINE_SEGMENT_COLORS[i % TIMELINE_SEGMENT_COLORS.length];

              const eventBlock = (
                <div className="w-[150px] text-center pointer-events-none">
                  <p className="text-[10px] uppercase tracking-wider text-rose-500 font-semibold mb-1">{t.type}</p>
                  <p className="font-semibold text-slate-800 text-sm leading-snug">{t.label}</p>
                  {t.sub && <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{t.sub}</p>}
                </div>
              );

              const dateBlock = (
                <div className="w-[150px] text-center pointer-events-none">
                  <p className="font-display font-bold text-slate-700 text-base leading-tight">
                    {formatTimelineDate(t.date)}
                  </p>
                </div>
              );

              return (
                <motion.div
                  key={`${t.type}-${t.date}-${i}-${t.label}`}
                  initial={{ opacity: 0, y: contentAbove ? -10 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.04 }}
                  className="flex flex-col items-center w-[190px] shrink-0"
                >
                  <div className="h-[120px] flex flex-col items-center justify-end gap-2 pb-1">
                    {contentAbove ? eventBlock : dateBlock}
                    <div className="w-px h-7 bg-slate-300" />
                  </div>

                  <div
                    className={`relative z-20 w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shadow-lg ring-[5px] ring-white shrink-0 pointer-events-none`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>

                  <div className="h-[120px] flex flex-col items-center justify-start gap-2 pt-1">
                    <div className="w-px h-7 bg-slate-300" />
                    {contentAbove ? dateBlock : eventBlock}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 pb-4 pt-1">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-[11px] text-slate-400">
            {progress.canScroll ? "Arraste para o lado para ver mais" : `${items.length} evento${items.length === 1 ? "" : "s"}`}
          </p>
          <p className="text-[11px] text-slate-400 tabular-nums">{items.length} no histórico</p>
        </div>
        <div
          className="relative h-1.5 rounded-full bg-rose-100 overflow-hidden cursor-pointer"
          onClick={(e) => {
            const el = scrollerRef.current;
            if (!el || !progress.canScroll) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
            const max = el.scrollWidth - el.clientWidth;
            el.scrollTo({ left: ratio * max, behavior: "smooth" });
          }}
          role="scrollbar"
          aria-orientation="horizontal"
          aria-valuenow={Math.round(progress.left)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="absolute top-0 h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-500 transition-[left,width] duration-75"
            style={{ left: `${progress.left}%`, width: `${progress.width}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function renderMarkdown(md) {
  const lines = md.split("\n");
  let html = "";
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("|") && lines[i + 1] && /^\s*\|?[-:\s|]+\|?\s*$/.test(lines[i + 1])) {
      const header = line.split("|").filter((c) => c.trim() !== "");
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(lines[i].split("|").filter((c) => c.trim() !== ""));
        i++;
      }
      html += `<div class='overflow-x-auto my-2'><table class='w-full text-xs border border-rose-100 rounded-lg'><thead><tr class='bg-rose-50'>${header.map((h) => `<th class='px-2 py-1 text-left text-slate-600 font-semibold'>${inline(h.trim())}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr class='border-t border-rose-50'>${r.map((c) => `<td class='px-2 py-1 text-slate-600'>${inline(c.trim())}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      continue;
    }
    if (/^###\s+/.test(line)) html += `<h4 class='font-display font-semibold text-rose-600 mt-3 mb-1'>${inline(line.replace(/^###\s+/, ""))}</h4>`;
    else if (/^##\s+/.test(line)) html += `<h3 class='font-display font-semibold text-rose-600 mt-3 mb-1'>${inline(line.replace(/^##\s+/, ""))}</h3>`;
    else if (/^#\s+/.test(line)) html += `<h3 class='font-display font-bold text-slate-800 mt-3 mb-1 text-base'>${inline(line.replace(/^#\s+/, ""))}</h3>`;
    else if (/^\s*[-*]\s+/.test(line)) html += `<li class='ml-4 list-disc text-slate-600'>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`;
    else if (line.trim() === "" || /^[-\s]+$/.test(line)) html += "<div class='h-2'></div>";
    else html += `<p class='text-slate-600'>${inline(line)}</p>`;
    i++;
  }
  return { __html: html };
}
function inline(t) {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong class='text-slate-800'>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

const galEmpty = { title: "", procedure: "", before_image: "", after_image: "", notes: "", date: "" };
const anamEmpty = {
  skin_type: "", allergies: "", health_conditions: "", medications: "", area: "", observations: "",
  attachment: "", attachment_name: "", attachment_type: "",
};

export default function ClienteDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isPro = user?.role === "profissional";
  const [aiSummary, setAiSummary] = useState("");
  const [anamneseOpen, setAnamneseOpen] = useState(false);
  const [sessaoOpen, setSessaoOpen] = useState(false);
  const [galOpen, setGalOpen] = useState(false);
  const [anam, setAnam] = useState({ ...anamEmpty, cliente_id: id });
  const [sess, setSess] = useState({ cliente_id: id, procedure: "", professional_id: "", date: "", value: "", notes: "" });
  const [gal, setGal] = useState({ ...galEmpty, cliente_id: id });
  const [anamPreview, setAnamPreview] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editingAnamId, setEditingAnamId] = useState(null);
  const [editingSessId, setEditingSessId] = useState(null);
  const [editingGalId, setEditingGalId] = useState(null);
  const [editingNotaId, setEditingNotaId] = useState(null);
  const [editingLemId, setEditingLemId] = useState(null);
  const [editingAvId, setEditingAvId] = useState(null);
  const [editingIntId, setEditingIntId] = useState(null);
  const [notaOpen, setNotaOpen] = useState(false);
  const [lemOpen, setLemOpen] = useState(false);
  const [avOpen, setAvOpen] = useState(false);
  const [intOpen, setIntOpen] = useState(false);
  const [nota, setNota] = useState({ titulo: "", conteudo: "", is_pinned: false });
  const [lem, setLem] = useState({ titulo: "", descricao: "", data_vencimento: "", prioridade: "media", status: "pendente" });
  const [av, setAv] = useState({ nota: 9, comentario: "", tipo: "nps" });
  const [inter, setInter] = useState({ tipo: "ligacao", canal: "telefone", descricao: "", resultado: "" });

  const { data, isLoading } = useQuery({ queryKey: ["cliente", id], queryFn: async () => (await api.get(`/clientes/${id}`)).data });
  const { data: professionals = [] } = useQuery({ queryKey: ["professionals"], queryFn: async () => (await api.get("/professionals")).data });
  const { data: procedures = [] } = useQuery({ queryKey: ["procedures"], queryFn: async () => (await api.get("/procedures")).data });

  const refresh = () => invalidateClienteImpact(qc, id);
  const askDel = (label) => window.confirm(`Remover ${label}? Esta ação não pode ser desfeita.`);

  const aiMut = useMutation({ mutationFn: () => api.post("/ai/client-summary", { cliente_id: id }), onSuccess: (r) => setAiSummary(r.data.summary), onError: (e) => toast.error(e.response?.data?.detail || "Erro na IA") });
  const editMut = useMutation({
    mutationFn: (payload) => api.put(`/clientes/${id}`, payload),
    onSuccess: () => { refresh(); setEditOpen(false); toast.success("Cliente atualizado!"); },
    onError: (e) => toast.error(e.response?.data?.detail || "Erro ao atualizar"),
  });

  const anamMut = useMutation({
    mutationFn: (p) => editingAnamId ? api.put(`/anamneses/${editingAnamId}`, p) : api.post("/anamneses", p),
    onSuccess: () => { refresh(); setAnamneseOpen(false); setEditingAnamId(null); setAnam({ ...anamEmpty, cliente_id: id }); toast.success(editingAnamId ? "Anamnese atualizada!" : "Anamnese registrada!"); },
    onError: (e) => toast.error(e.response?.data?.detail || "Erro ao salvar anamnese"),
  });
  const anamDelMut = useMutation({
    mutationFn: (aid) => api.delete(`/anamneses/${aid}`),
    onSuccess: () => { refresh(); toast.success("Anamnese removida"); },
  });

  const sessMut = useMutation({
    mutationFn: (p) => editingSessId ? api.put(`/sessoes/${editingSessId}`, p) : api.post("/sessoes", p),
    onSuccess: () => {
      refresh();
      setSessaoOpen(false); setEditingSessId(null);
      setSess({ cliente_id: id, procedure: "", procedure_id: "", professional_id: "", date: "", value: "", notes: "" });
      toast.success(editingSessId ? "Sessão atualizada!" : "Sessão registrada!");
    },
  });
  const sessDelMut = useMutation({
    mutationFn: (sid) => api.delete(`/sessoes/${sid}`),
    onSuccess: () => { refresh(); toast.success("Sessão removida"); },
  });

  const galMut = useMutation({
    mutationFn: (p) => editingGalId ? api.put(`/gallery/${editingGalId}`, p) : api.post("/gallery", p),
    onSuccess: () => { refresh(); setGalOpen(false); setEditingGalId(null); setGal({ ...galEmpty, cliente_id: id }); toast.success(editingGalId ? "Registro atualizado!" : "Registro adicionado!"); },
  });
  const galDelMut = useMutation({
    mutationFn: (gid) => api.delete(`/gallery/${gid}`),
    onSuccess: () => { refresh(); toast.success("Removido"); },
  });

  const notaMut = useMutation({
    mutationFn: (p) => editingNotaId ? api.put(`/notas/${editingNotaId}`, p) : api.post(`/clientes/${id}/notas`, p),
    onSuccess: () => { refresh(); setNotaOpen(false); setEditingNotaId(null); setNota({ titulo: "", conteudo: "", is_pinned: false }); toast.success("Nota salva"); },
  });
  const notaDelMut = useMutation({
    mutationFn: (nid) => api.delete(`/notas/${nid}`),
    onSuccess: () => { refresh(); toast.success("Nota removida"); },
  });

  const lemMut = useMutation({
    mutationFn: (p) => editingLemId ? api.put(`/lembretes/${editingLemId}`, p) : api.post(`/clientes/${id}/lembretes`, p),
    onSuccess: () => { refresh(); setLemOpen(false); setEditingLemId(null); setLem({ titulo: "", descricao: "", data_vencimento: "", prioridade: "media", status: "pendente" }); toast.success("Lembrete salvo"); },
  });
  const lemDelMut = useMutation({
    mutationFn: (lid) => api.delete(`/lembretes/${lid}`),
    onSuccess: () => { refresh(); toast.success("Lembrete removido"); },
  });

  const avMut = useMutation({
    mutationFn: (p) => editingAvId ? api.put(`/avaliacoes/${editingAvId}`, p) : api.post(`/clientes/${id}/avaliacoes`, p),
    onSuccess: () => { refresh(); setAvOpen(false); setEditingAvId(null); setAv({ nota: 9, comentario: "", tipo: "nps" }); toast.success("Avaliação salva"); },
  });
  const avDelMut = useMutation({
    mutationFn: (aid) => api.delete(`/avaliacoes/${aid}`),
    onSuccess: () => { refresh(); toast.success("Avaliação removida"); },
  });

  const intMut = useMutation({
    mutationFn: (p) => editingIntId ? api.put(`/interacoes/${editingIntId}`, p) : api.post(`/clientes/${id}/interacoes`, p),
    onSuccess: () => { refresh(); setIntOpen(false); setEditingIntId(null); setInter({ tipo: "ligacao", canal: "telefone", descricao: "", resultado: "" }); toast.success("Interação salva"); },
  });
  const intDelMut = useMutation({
    mutationFn: (iid) => api.delete(`/interacoes/${iid}`),
    onSuccess: () => { refresh(); toast.success("Interação removida"); },
  });

  const ItemActions = ({ onEdit, onDelete }) => (
    <div className="flex items-center gap-0.5 shrink-0">
      <button type="button" onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50" title="Editar"><Pencil className="w-4 h-4" /></button>
      <button type="button" onClick={onDelete} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50" title="Remover"><Trash2 className="w-4 h-4" /></button>
    </div>
  );

  const upload = (key, file) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("Imagem muito grande (máx 3MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => setGal((g) => ({ ...g, [key]: reader.result }));
    reader.readAsDataURL(file);
  };

  const uploadAnamAttachment = (file) => {
    if (!file) return;
    const okTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];
    if (file.type && !okTypes.includes(file.type) && !file.type.startsWith("image/")) {
      toast.error("Envie foto (JPG/PNG) ou PDF da ficha assinada");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAnam((a) => ({
        ...a,
        attachment: reader.result,
        attachment_name: file.name,
        attachment_type: file.type || "image/jpeg",
      }));
    };
    reader.readAsDataURL(file);
  };

  const openEdit = () => {
    if (!data?.cliente) return;
    const c = data.cliente;
    setEditForm({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      birthdate: c.birthdate || "",
      notes: c.notes || "",
      status: c.status || "Ativo",
      tags: Array.isArray(c.tags) ? c.tags.join(", ") : "",
      photo: c.photo || "",
    });
    setEditOpen(true);
  };

  const uploadClientPhoto = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Envie uma imagem"); return; }
    if (file.size > 3 * 1024 * 1024) { toast.error("Foto muito grande (máx. 3MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => setEditForm((f) => ({ ...f, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  if (isLoading || !data) return <div className="text-rose-400">Carregando ficha...</div>;
  const { cliente, anamneses, sessoes, appointments, gallery = [], notas = [], lembretes = [], avaliacoes = [], interacoes = [] } = data;

  const timeline = [
    ...appointments.map((a) => ({ type: "agendamento", date: (a.datetime || "").slice(0, 10), label: a.procedure, sub: `${a.professional || ""} • ${a.status}`, icon: CalendarDays })),
    ...sessoes.map((s) => ({
      type: "sessão",
      date: s.date,
      label: s.procedure,
      sub: `${s.professional || ""}${!s.value_hidden && s.value ? " • " + brl(s.value) : ""}`,
      icon: Activity,
    })),
    ...anamneses.map((a) => ({
      type: "anamnese",
      date: (a.created_at || "").slice(0, 10),
      label: "Ficha de Anamnese",
      sub: [a.area || a.skin_type, a.attachment ? "com anexo" : null].filter(Boolean).join(" · "),
      icon: ClipboardList,
    })),
    ...interacoes.map((i) => ({ type: "interação", date: (i.created_at || "").slice(0, 10), label: i.tipo, sub: i.descricao, icon: MessageSquare })),
  ].filter((t) => t.date).sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div>
      <button data-testid="back-button" onClick={() => navigate("/clientes")} className="flex items-center gap-1 text-slate-500 hover:text-rose-500 mb-5 text-sm"><ArrowLeft className="w-4 h-4" /> Voltar</button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 text-center" data-testid="client-profile-card">
              {cliente.photo ? <img src={cliente.photo} alt={cliente.name} className="w-20 h-20 rounded-full object-cover mx-auto ring-4 ring-rose-100" /> :
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white text-2xl font-bold mx-auto">{cliente.name.charAt(0)}</div>}
              <h2 className="font-display text-xl font-bold text-slate-800 mt-3">{cliente.name}</h2>
              <div className="flex justify-center mt-2"><StatusBadge status={cliente.status} /></div>
              <div className="flex justify-center gap-1 flex-wrap mt-2">{(cliente.tags || []).map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 font-medium">{t}</span>)}</div>
              <div className="mt-4 space-y-2 text-sm text-slate-500 text-left">
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-rose-400" /> {cliente.phone || "—"}</p>
                <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-rose-400" /> {cliente.email || "—"}</p>
                {cliente.birthdate && (
                  <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-rose-400" /> {cliente.birthdate}</p>
                )}
                {cliente.notes && <p className="text-xs text-slate-400 pt-1 border-t border-rose-50 mt-2">{cliente.notes}</p>}
              </div>
              <div className="mt-4 pt-4 border-t border-rose-50">
                <p className="text-xs text-slate-400 uppercase">
                  {cliente.total_spent_own_only ? "Seu faturamento neste cliente" : "Valor Total (LTV)"}
                </p>
                <p className="font-display text-2xl font-bold text-rose-600">{brl(cliente.total_spent)}</p>
              </div>
              <Button
                data-testid="edit-client-button"
                variant="outline"
                className="w-full mt-3 rounded-xl text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={openEdit}
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar cliente
              </Button>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-5 overflow-hidden relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
                <div><p className="font-display font-semibold text-slate-800 text-sm">Assistente IA</p><p className="text-[10px] text-slate-400">Resumo inteligente do cliente</p></div>
              </div>
              <Button data-testid="ai-summary-generate-button" onClick={() => aiMut.mutate()} disabled={aiMut.isPending} className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 hover:opacity-90 text-white rounded-xl">
                {aiMut.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</> : <><Sparkles className="w-4 h-4 mr-2" /> Gerar Resumo com IA</>}
              </Button>
              {aiMut.isPending && <div className="mt-4 space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-3 rounded ai-shimmer" style={{ width: `${90 - i * 12}%` }} />)}</div>}
              {aiSummary && !aiMut.isPending && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="ai-summary-result" className="mt-4 text-sm leading-relaxed" dangerouslySetInnerHTML={renderMarkdown(aiSummary)} />}
            </Card>
          </motion.div>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="timeline">
            <TabsList className="bg-rose-50/80 flex-wrap h-auto">
              <TabsTrigger value="timeline" data-testid="tab-timeline"><History className="w-4 h-4 mr-1" /> Linha do Tempo</TabsTrigger>
              <TabsTrigger value="antes-depois" data-testid="tab-gallery"><Camera className="w-4 h-4 mr-1" /> Antes & Depois</TabsTrigger>
              <TabsTrigger value="sessoes" data-testid="tab-sessoes"><Activity className="w-4 h-4 mr-1" /> Tratamentos</TabsTrigger>
              <TabsTrigger value="notas" data-testid="tab-notas"><StickyNote className="w-4 h-4 mr-1" /> Notas</TabsTrigger>
              <TabsTrigger value="lembretes" data-testid="tab-lembretes"><Bell className="w-4 h-4 mr-1" /> Lembretes</TabsTrigger>
              {!isPro && (
                <TabsTrigger value="avaliacoes" data-testid="tab-avaliacoes"><Star className="w-4 h-4 mr-1" /> Avaliações</TabsTrigger>
              )}
              <TabsTrigger value="interacoes" data-testid="tab-interacoes"><MessageSquare className="w-4 h-4 mr-1" /> Interações</TabsTrigger>
              <TabsTrigger value="anamnese" data-testid="tab-anamnese"><ClipboardList className="w-4 h-4 mr-1" /> Anamnese</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4">
              <Card className="overflow-hidden py-4" data-testid="timeline-card">
                <ClientHorizontalTimeline items={timeline} />
              </Card>
            </TabsContent>

            <TabsContent value="antes-depois" className="mt-4">
              <div className="flex justify-end mb-3">
                <Dialog open={galOpen} onOpenChange={(o) => { setGalOpen(o); if (!o) { setEditingGalId(null); setGal({ ...galEmpty, cliente_id: id }); } }}>
                  <DialogTrigger asChild>
                    <Button data-testid="add-gallery-button" size="sm" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl" onClick={() => { setEditingGalId(null); setGal({ ...galEmpty, cliente_id: id }); }}><Plus className="w-4 h-4 mr-1" /> Adicionar Registro</Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl border-rose-100 max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="font-display">{editingGalId ? "Editar Antes & Depois" : "Antes & Depois"}</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); if (!gal.before_image || !gal.after_image) { toast.error("Envie as duas imagens"); return; } galMut.mutate(gal); }} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><Label>Título</Label><Input data-testid="gallery-title-input" className="mt-1" value={gal.title} onChange={(e) => setGal({ ...gal, title: e.target.value })} placeholder="Ex: Preenchimento" required /></div>
                        <div><Label>Data</Label><Input type="date" className="mt-1" value={gal.date} onChange={(e) => setGal({ ...gal, date: e.target.value })} /></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {["before_image", "after_image"].map((k) => (
                          <div key={k}>
                            <Label>{k === "before_image" ? "Antes" : "Depois"}</Label>
                            <label className="mt-1 flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-rose-200 cursor-pointer hover:bg-rose-50 overflow-hidden">
                              {gal[k] ? <img src={gal[k]} alt="" className="w-full h-full object-cover" /> : <><Upload className="w-5 h-5 text-rose-300" /><span className="text-[10px] text-slate-400 mt-1">Enviar foto</span></>}
                              <input data-testid={`gallery-${k}-input`} type="file" accept="image/*" className="hidden" onChange={(e) => upload(k, e.target.files?.[0])} />
                            </label>
                          </div>
                        ))}
                      </div>
                      <div><Label>Observações</Label><Textarea className="mt-1" value={gal.notes} onChange={(e) => setGal({ ...gal, notes: e.target.value })} /></div>
                      <DialogFooter><Button data-testid="gallery-submit-button" type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">Salvar</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              {gallery.length === 0 ? <Card className="p-8 text-center text-slate-400">Nenhum registro de antes e depois.</Card> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="gallery-grid">
                  {gallery.map((g) => (
                    <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="overflow-hidden">
                        <div className="grid grid-cols-2 relative">
                          <div className="relative"><img src={g.before_image} alt="Antes" className="w-full h-40 object-cover" /><span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/50 text-white">Antes</span></div>
                          <div className="relative"><img src={g.after_image} alt="Depois" className="w-full h-40 object-cover" /><span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white">Depois</span></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center"><ArrowRight className="w-4 h-4 text-rose-400" /></div>
                        </div>
                        <div className="p-4 flex items-start justify-between gap-2">
                          <div><p className="font-semibold text-slate-700">{g.title || g.procedure}</p><p className="text-xs text-slate-400">{g.date}</p>{g.notes && <p className="text-sm text-slate-500 mt-1">{g.notes}</p>}</div>
                          <ItemActions
                            onEdit={() => { setEditingGalId(g.id); setGal({ ...galEmpty, cliente_id: id, title: g.title || "", date: g.date || "", notes: g.notes || "", before_image: g.before_image || "", after_image: g.after_image || "", procedure: g.procedure || "" }); setGalOpen(true); }}
                            onDelete={() => askDel("este registro") && galDelMut.mutate(g.id)}
                          />
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sessoes" className="mt-4">
              <div className="flex justify-end mb-3">
                <Dialog open={sessaoOpen} onOpenChange={(o) => { setSessaoOpen(o); if (!o) { setEditingSessId(null); setSess({ cliente_id: id, procedure: "", procedure_id: "", professional_id: "", date: "", value: "", notes: "" }); } }}>
                  <DialogTrigger asChild>
                    <Button data-testid="add-sessao-button" size="sm" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl" onClick={() => setEditingSessId(null)}><Plus className="w-4 h-4 mr-1" /> Nova Sessão</Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl border-rose-100">
                    <DialogHeader><DialogTitle className="font-display">{editingSessId ? "Editar Sessão" : "Registrar Sessão"}</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); sessMut.mutate({ ...sess, value: parseFloat(sess.value) || 0 }); }} className="space-y-3">
                      <div>
                        <Label>Procedimento</Label>
                        <Select value={sess.procedure_id || ""} onValueChange={(v) => { const p = procedures.find((x) => x.id === v); setSess({ ...sess, procedure_id: v, procedure: p?.name || "", value: p ? p.price : sess.value }); }}>
                          <SelectTrigger data-testid="sessao-procedure-select" className="mt-1"><SelectValue placeholder="Selecione o procedimento" /></SelectTrigger>
                          <SelectContent>{procedures.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {brl(p.price)}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      {!isPro && (
                        <div>
                          <Label>Profissional</Label>
                          <Select value={sess.professional_id || ""} onValueChange={(v) => setSess({ ...sess, professional_id: v })}>
                            <SelectTrigger data-testid="sessao-professional-select" className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>{professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><Label>Data</Label><Input type="date" className="mt-1" value={sess.date} onChange={(e) => setSess({ ...sess, date: e.target.value })} /></div>
                        <div><Label>Valor (R$)</Label><Input type="number" step="0.01" className="mt-1" value={sess.value} onChange={(e) => setSess({ ...sess, value: e.target.value })} /></div>
                      </div>
                      <div><Label>Observações</Label><Textarea className="mt-1" value={sess.notes} onChange={(e) => setSess({ ...sess, notes: e.target.value })} /></div>
                      <DialogFooter><Button data-testid="sessao-submit-button" type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">Salvar</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-3">
                {sessoes.length === 0 && <Card className="p-8 text-center text-slate-400">Nenhuma sessão registrada.</Card>}
                <PaginatedItems items={sessoes} pageSize={10}>
                  {(s) => {
                    const canEditSess = !isPro || !s.professional_id || s.professional_id === user?.id;
                    const showValue = !isPro || (!s.value_hidden && s.professional_id === user?.id);
                    return (
                    <Card key={s.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0"><p className="font-semibold text-slate-700">{s.procedure}</p><p className="text-xs text-slate-400">{s.professional || "—"} • {s.date}</p>{s.notes && <p className="text-sm text-slate-500 mt-1">{s.notes}</p>}</div>
                      <div className="flex items-center gap-2 shrink-0">
                        {showValue ? (
                          <p className="font-display font-bold text-emerald-600">{brl(s.value)}</p>
                        ) : (
                          <p className="text-xs text-slate-400">Valor oculto</p>
                        )}
                        {canEditSess && (
                        <ItemActions
                          onEdit={() => { setEditingSessId(s.id); setSess({ cliente_id: id, procedure: s.procedure || "", procedure_id: s.procedure_id || "", professional_id: s.professional_id || "", date: s.date || "", value: s.value ?? "", notes: s.notes || "" }); setSessaoOpen(true); }}
                          onDelete={() => askDel("esta sessão") && sessDelMut.mutate(s.id)}
                        />
                        )}
                      </div>
                    </Card>
                    );
                  }}
                </PaginatedItems>
              </div>
            </TabsContent>

            <TabsContent value="anamnese" className="mt-4">
              <div className="flex justify-end mb-3">
                {!isPro && (
                <Dialog open={anamneseOpen} onOpenChange={(o) => { setAnamneseOpen(o); if (!o) { setEditingAnamId(null); setAnam({ ...anamEmpty, cliente_id: id }); } }}>
                  <DialogTrigger asChild>
                    <Button data-testid="anamnese-new-form-button" size="sm" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl" onClick={() => setEditingAnamId(null)}><Plus className="w-4 h-4 mr-1" /> Nova Anamnese</Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl border-rose-100 max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle className="font-display">{editingAnamId ? "Editar Anamnese" : "Ficha de Anamnese"}</DialogTitle></DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); anamMut.mutate({ ...anam, cliente_id: id }); }} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><Label>Tipo de Pele</Label><Input data-testid="anamnese-skin-input" className="mt-1" value={anam.skin_type} onChange={(e) => setAnam({ ...anam, skin_type: e.target.value })} placeholder="Oleosa, Seca, Mista" /></div>
                        <div><Label>Área Tratada</Label><Input className="mt-1" value={anam.area} onChange={(e) => setAnam({ ...anam, area: e.target.value })} placeholder="Face, Corpo" /></div>
                      </div>
                      <div><Label>Alergias</Label><Input className="mt-1" value={anam.allergies} onChange={(e) => setAnam({ ...anam, allergies: e.target.value })} /></div>
                      <div><Label>Condições de Saúde</Label><Input className="mt-1" value={anam.health_conditions} onChange={(e) => setAnam({ ...anam, health_conditions: e.target.value })} /></div>
                      <div><Label>Medicações</Label><Input className="mt-1" value={anam.medications} onChange={(e) => setAnam({ ...anam, medications: e.target.value })} /></div>
                      <div><Label>Observações</Label><Textarea className="mt-1" value={anam.observations} onChange={(e) => setAnam({ ...anam, observations: e.target.value })} /></div>

                      <div>
                        <Label className="flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5 text-rose-400" /> Foto / PDF da ficha assinada</Label>
                        <p className="text-[11px] text-slate-400 mt-0.5 mb-2">Tire foto da ficha preenchida à mão e anexe aqui (JPG, PNG ou PDF · máx. 5MB).</p>
                        {anam.attachment ? (
                          <div className="relative rounded-xl border border-rose-100 overflow-hidden bg-rose-50/40">
                            {anam.attachment_type?.includes("pdf") || anam.attachment.startsWith("data:application/pdf") ? (
                              <div className="flex items-center gap-3 p-4">
                                <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center"><Paperclip className="w-5 h-5" /></div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-700 truncate">{anam.attachment_name || "ficha.pdf"}</p>
                                  <p className="text-[11px] text-slate-400">PDF anexado</p>
                                </div>
                              </div>
                            ) : (
                              <img src={anam.attachment} alt="Ficha assinada" className="w-full max-h-48 object-contain bg-white" />
                            )}
                            <button
                              type="button"
                              onClick={() => setAnam({ ...anam, attachment: "", attachment_name: "", attachment_type: "" })}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-red-400 hover:bg-red-50 shadow-sm"
                              title="Remover anexo"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label
                            data-testid="anamnese-attachment-input"
                            className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-rose-200 cursor-pointer hover:bg-rose-50 transition-colors"
                          >
                            <Upload className="w-5 h-5 text-rose-300" />
                            <span className="text-xs text-slate-500 mt-1.5">Clique para enviar foto ou PDF</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">ou use a câmera do celular</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf,.pdf"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => uploadAnamAttachment(e.target.files?.[0])}
                            />
                          </label>
                        )}
                      </div>

                      <DialogFooter>
                        <Button data-testid="anamnese-submit-button" type="submit" disabled={anamMut.isPending} className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">
                          {anamMut.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                )}
              </div>
              <div className="space-y-3">
                {anamneses.length === 0 && <Card className="p-8 text-center text-slate-400">Nenhuma ficha de anamnese.</Card>}
                {anamneses.map((a) => (
                  <Card key={a.id} className="p-5" data-testid="anamnese-card">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-xs text-slate-400 uppercase">Ficha · {(a.created_at || "").slice(0, 10) || "—"}</p>
                      {!isPro && (
                      <ItemActions
                        onEdit={() => {
                          setEditingAnamId(a.id);
                          setAnam({
                            ...anamEmpty,
                            cliente_id: id,
                            skin_type: a.skin_type || "",
                            allergies: a.allergies || "",
                            health_conditions: a.health_conditions || "",
                            medications: a.medications || "",
                            area: a.area || "",
                            observations: a.observations || "",
                            attachment: a.attachment || "",
                            attachment_name: a.attachment_name || "",
                            attachment_type: a.attachment_type || "",
                          });
                          setAnamneseOpen(true);
                        }}
                        onDelete={() => askDel("esta anamnese") && anamDelMut.mutate(a.id)}
                      />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-xs text-slate-400 uppercase">Tipo de Pele</p><p className="text-slate-700">{a.skin_type || "—"}</p></div>
                      <div><p className="text-xs text-slate-400 uppercase">Área</p><p className="text-slate-700">{a.area || "—"}</p></div>
                      <div><p className="text-xs text-slate-400 uppercase">Alergias</p><p className="text-slate-700">{a.allergies || "—"}</p></div>
                      <div><p className="text-xs text-slate-400 uppercase">Condições</p><p className="text-slate-700">{a.health_conditions || "—"}</p></div>
                      <div><p className="text-xs text-slate-400 uppercase">Medicações</p><p className="text-slate-700">{a.medications || "—"}</p></div>
                    </div>
                    {a.observations && <p className="text-sm text-slate-500 mt-3 pt-3 border-t border-rose-50">{a.observations}</p>}
                    {a.attachment && (
                      <div className="mt-3 pt-3 border-t border-rose-50">
                        <p className="text-xs text-slate-400 uppercase mb-2 flex items-center gap-1"><Paperclip className="w-3 h-3" /> Ficha assinada</p>
                        {a.attachment_type?.includes("pdf") || String(a.attachment).startsWith("data:application/pdf") ? (
                          <a
                            href={a.attachment}
                            download={a.attachment_name || "ficha-anamnese.pdf"}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium hover:bg-rose-100"
                          >
                            <ExternalLink className="w-4 h-4" /> {a.attachment_name || "Abrir PDF"}
                          </a>
                        ) : (
                          <button type="button" onClick={() => setAnamPreview(a)} className="block w-full text-left group">
                            <img
                              src={a.attachment}
                              alt={a.attachment_name || "Ficha assinada"}
                              className="w-full max-h-56 object-contain rounded-xl border border-rose-100 bg-white group-hover:ring-2 group-hover:ring-rose-200 transition"
                            />
                            <p className="text-[11px] text-rose-500 mt-1.5">Toque para ampliar</p>
                          </button>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <Dialog open={!!anamPreview} onOpenChange={(o) => !o && setAnamPreview(null)}>
                <DialogContent className="rounded-3xl border-rose-100 max-w-3xl p-2 sm:p-4">
                  <DialogHeader className="px-2 pt-2">
                    <DialogTitle className="font-display text-base">Ficha assinada — {anamPreview?.attachment_name || "anamnese"}</DialogTitle>
                  </DialogHeader>
                  {anamPreview?.attachment && (
                    <img src={anamPreview.attachment} alt="Ficha" className="w-full max-h-[75vh] object-contain rounded-2xl bg-slate-50" />
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="notas" className="mt-4">
              <div className="flex justify-end mb-3">
                {!isPro && (
                <Dialog open={notaOpen} onOpenChange={(o) => { setNotaOpen(o); if (!o) { setEditingNotaId(null); setNota({ titulo: "", conteudo: "", is_pinned: false }); } }}>
                  <DialogTrigger asChild><Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl" onClick={() => setEditingNotaId(null)}><Plus className="w-4 h-4 mr-1" /> Nota</Button></DialogTrigger>
                  <DialogContent className="rounded-3xl border-rose-100">
                    <DialogHeader><DialogTitle className="font-display">{editingNotaId ? "Editar nota" : "Nova nota"}</DialogTitle></DialogHeader>
                    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); notaMut.mutate(nota); }}>
                      <div><Label>Título</Label><Input className="mt-1" value={nota.titulo} onChange={(e) => setNota({ ...nota, titulo: e.target.value })} /></div>
                      <div><Label>Conteúdo</Label><Textarea className="mt-1" value={nota.conteudo} onChange={(e) => setNota({ ...nota, conteudo: e.target.value })} required /></div>
                      <DialogFooter><Button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">Salvar</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                )}
              </div>
              <div className="space-y-3">
                {notas.length === 0 && <Card className="p-8 text-center text-slate-400">Sem notas.</Card>}
                <PaginatedItems items={notas} pageSize={10}>
                  {(n) => (
                    <Card key={n.id} className="p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">{n.titulo || "Nota"} {n.is_pinned ? "📌" : ""}</p>
                        <p className="text-sm text-slate-600 mt-1">{n.conteudo}</p>
                      </div>
                      {!isPro && (
                      <ItemActions
                        onEdit={() => { setEditingNotaId(n.id); setNota({ titulo: n.titulo || "", conteudo: n.conteudo || "", is_pinned: !!n.is_pinned }); setNotaOpen(true); }}
                        onDelete={() => askDel("esta nota") && notaDelMut.mutate(n.id)}
                      />
                      )}
                    </Card>
                  )}
                </PaginatedItems>
              </div>
            </TabsContent>

            <TabsContent value="lembretes" className="mt-4">
              <div className="flex justify-end mb-3">
                {!isPro && (
                <Dialog open={lemOpen} onOpenChange={(o) => { setLemOpen(o); if (!o) { setEditingLemId(null); setLem({ titulo: "", descricao: "", data_vencimento: "", prioridade: "media", status: "pendente" }); } }}>
                  <DialogTrigger asChild><Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl" onClick={() => setEditingLemId(null)}><Plus className="w-4 h-4 mr-1" /> Lembrete</Button></DialogTrigger>
                  <DialogContent className="rounded-3xl border-rose-100">
                    <DialogHeader><DialogTitle className="font-display">{editingLemId ? "Editar lembrete" : "Novo lembrete"}</DialogTitle></DialogHeader>
                    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); lemMut.mutate(lem); }}>
                      <div><Label>Título</Label><Input className="mt-1" value={lem.titulo} onChange={(e) => setLem({ ...lem, titulo: e.target.value })} required /></div>
                      <div><Label>Descrição</Label><Textarea className="mt-1" value={lem.descricao} onChange={(e) => setLem({ ...lem, descricao: e.target.value })} /></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><Label>Vencimento</Label><Input type="date" className="mt-1" value={lem.data_vencimento} onChange={(e) => setLem({ ...lem, data_vencimento: e.target.value })} /></div>
                        <div>
                          <Label>Prioridade</Label>
                          <Select value={lem.prioridade || "media"} onValueChange={(v) => setLem({ ...lem, prioridade: v })}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baixa">Baixa</SelectItem>
                              <SelectItem value="media">Média</SelectItem>
                              <SelectItem value="alta">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {editingLemId && (
                        <div>
                          <Label>Status</Label>
                          <Select value={lem.status || "pendente"} onValueChange={(v) => setLem({ ...lem, status: v })}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="concluido">Concluído</SelectItem>
                              <SelectItem value="cancelado">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <DialogFooter><Button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">Salvar</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                )}
              </div>
              <div className="space-y-3">
                {lembretes.length === 0 && <Card className="p-8 text-center text-slate-400">Sem lembretes.</Card>}
                {lembretes.map((l) => (
                  <Card key={l.id} className="p-4 flex justify-between items-center gap-3">
                    <div className="min-w-0"><p className="font-semibold">{l.titulo}</p><p className="text-xs text-slate-400">{l.data_vencimento} · {l.prioridade}</p></div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={l.status} />
                      {!isPro && (
                      <ItemActions
                        onEdit={() => { setEditingLemId(l.id); setLem({ titulo: l.titulo || "", descricao: l.descricao || "", data_vencimento: l.data_vencimento || "", prioridade: l.prioridade || "media", status: l.status || "pendente" }); setLemOpen(true); }}
                        onDelete={() => askDel("este lembrete") && lemDelMut.mutate(l.id)}
                      />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {!isPro && (
            <TabsContent value="avaliacoes" className="mt-4">
              <div className="flex justify-end mb-3">
                <Dialog open={avOpen} onOpenChange={(o) => { setAvOpen(o); if (!o) { setEditingAvId(null); setAv({ nota: 9, comentario: "", tipo: "nps" }); } }}>
                  <DialogTrigger asChild><Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl" onClick={() => setEditingAvId(null)}><Plus className="w-4 h-4 mr-1" /> Avaliação</Button></DialogTrigger>
                  <DialogContent className="rounded-3xl border-rose-100">
                    <DialogHeader><DialogTitle className="font-display">{editingAvId ? "Editar avaliação" : "Nova avaliação"}</DialogTitle></DialogHeader>
                    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); avMut.mutate({ ...av, nota: Number(av.nota) }); }}>
                      <div><Label>Nota (1-10)</Label><Input type="number" min={1} max={10} className="mt-1" value={av.nota} onChange={(e) => setAv({ ...av, nota: e.target.value })} /></div>
                      <div><Label>Comentário</Label><Textarea className="mt-1" value={av.comentario} onChange={(e) => setAv({ ...av, comentario: e.target.value })} /></div>
                      <DialogFooter><Button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">Salvar</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-3">
                {avaliacoes.length === 0 && <Card className="p-8 text-center text-slate-400">Sem avaliações.</Card>}
                {avaliacoes.map((a) => (
                  <Card key={a.id} className="p-4 flex items-start justify-between gap-3">
                    <div><p className="font-semibold text-rose-600">Nota {a.nota}/10 · {a.tipo}</p><p className="text-sm text-slate-600 mt-1">{a.comentario}</p></div>
                    <ItemActions
                      onEdit={() => { setEditingAvId(a.id); setAv({ nota: a.nota ?? 9, comentario: a.comentario || "", tipo: a.tipo || "nps" }); setAvOpen(true); }}
                      onDelete={() => askDel("esta avaliação") && avDelMut.mutate(a.id)}
                    />
                  </Card>
                ))}
              </div>
            </TabsContent>
            )}

            <TabsContent value="interacoes" className="mt-4">
              <div className="flex justify-end mb-3">
                {!isPro && (
                <Dialog open={intOpen} onOpenChange={(o) => { setIntOpen(o); if (!o) { setEditingIntId(null); setInter({ tipo: "ligacao", canal: "telefone", descricao: "", resultado: "" }); } }}>
                  <DialogTrigger asChild><Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl" onClick={() => setEditingIntId(null)}><Plus className="w-4 h-4 mr-1" /> Interação</Button></DialogTrigger>
                  <DialogContent className="rounded-3xl border-rose-100">
                    <DialogHeader><DialogTitle className="font-display">{editingIntId ? "Editar interação" : "Registrar interação"}</DialogTitle></DialogHeader>
                    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); intMut.mutate(inter); }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><Label>Tipo</Label><Input className="mt-1" value={inter.tipo} onChange={(e) => setInter({ ...inter, tipo: e.target.value })} /></div>
                        <div><Label>Canal</Label><Input className="mt-1" value={inter.canal} onChange={(e) => setInter({ ...inter, canal: e.target.value })} /></div>
                      </div>
                      <div><Label>Descrição</Label><Textarea className="mt-1" value={inter.descricao} onChange={(e) => setInter({ ...inter, descricao: e.target.value })} /></div>
                      <DialogFooter><Button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">Salvar</Button></DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                )}
              </div>
              <div className="space-y-3">
                {interacoes.length === 0 && <Card className="p-8 text-center text-slate-400">Sem interações.</Card>}
                <PaginatedItems items={interacoes} pageSize={10}>
                  {(i) => (
                    <Card key={i.id} className="p-4 flex items-start justify-between gap-3">
                      <div><p className="font-semibold">{i.tipo} · {i.canal}</p><p className="text-sm text-slate-600 mt-1">{i.descricao}</p></div>
                      {!isPro && (
                      <ItemActions
                        onEdit={() => { setEditingIntId(i.id); setInter({ tipo: i.tipo || "ligacao", canal: i.canal || "telefone", descricao: i.descricao || "", resultado: i.resultado || "" }); setIntOpen(true); }}
                        onDelete={() => askDel("esta interação") && intDelMut.mutate(i.id)}
                      />
                      )}
                    </Card>
                  )}
                </PaginatedItems>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-3xl border-rose-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Editar cliente</DialogTitle></DialogHeader>
          {editForm && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!editForm.name.trim()) { toast.error("Nome obrigatório"); return; }
                editMut.mutate({
                  name: editForm.name.trim(),
                  phone: editForm.phone,
                  email: editForm.email,
                  birthdate: editForm.birthdate,
                  notes: editForm.notes,
                  status: editForm.status,
                  photo: editForm.photo,
                  tags: editForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
                });
              }}
            >
              <div className="flex justify-center">
                <label className="relative cursor-pointer group">
                  {editForm.photo ? (
                    <img src={editForm.photo} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-rose-100" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-rose-100">
                      {(editForm.name || "?").charAt(0)}
                    </div>
                  )}
                  <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-medium transition-opacity">
                    Trocar foto
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadClientPhoto(e.target.files?.[0])} />
                </label>
              </div>
              {editForm.photo && (
                <button
                  type="button"
                  className="w-full text-xs text-slate-400 hover:text-red-400"
                  onClick={() => setEditForm({ ...editForm, photo: "" })}
                >
                  Remover foto
                </button>
              )}
              <div>
                <Label>Nome</Label>
                <Input data-testid="edit-client-name" className="mt-1" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Telefone</Label>
                  <Input data-testid="edit-client-phone" className="mt-1" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div>
                  <Label>Nascimento</Label>
                  <Input type="date" className="mt-1" value={editForm.birthdate} onChange={(e) => setEditForm({ ...editForm, birthdate: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" className="mt-1" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags (separadas por vírgula)</Label>
                <Input className="mt-1" value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="VIP, Fidelidade Ouro" />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea className="mt-1" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button data-testid="edit-client-submit" type="submit" disabled={editMut.isPending} className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl">
                  {editMut.isPending ? "Salvando..." : "Salvar alterações"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
