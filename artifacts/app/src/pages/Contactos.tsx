import { useState } from "react";
import { motion } from "framer-motion";
import { Contact, Plus, Search, Zap, Shield, RefreshCw, Loader2 } from "lucide-react";
import {
  useListContacts,
  useCreateContact,
  getListContactsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const clasificacionConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  rapido: { label: "Rapido", icon: Zap, color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  confiable: { label: "Confiable", icon: Shield, color: "#25D366", bg: "rgba(37,211,102,0.12)" },
  frecuente: { label: "Frecuente", icon: RefreshCw, color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
};

function NuevoContactoModal({ onClose }: { onClose: () => void }) {
  const [nombre, setNombre] = useState("");
  const [numero, setNumero] = useState("");
  const [tipo, setTipo] = useState<"contact" | "provider">("provider");
  const [clasificacion, setClasificacion] = useState("");
  const [grupoOrigen, setGrupoOrigen] = useState("");
  const queryClient = useQueryClient();

  const createMutation = useCreateContact({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
        onClose();
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        nombre,
        numero,
        tipo,
        grupoOrigen: grupoOrigen || undefined,
        clasificacion: (clasificacion || undefined) as any,
      },
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Contact className="w-4 h-4" style={{ color: "#3B82F6" }} />
            Nuevo Contacto
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Nombre</Label>
            <Input
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-muted/30 border-border text-foreground"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Numero de WhatsApp</Label>
            <Input
              placeholder="+57 300 000 0000"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="bg-muted/30 border-border text-foreground"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                <SelectTrigger className="bg-muted/30 border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="provider" className="text-foreground">Proveedor</SelectItem>
                  <SelectItem value="contact" className="text-foreground">Contacto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Clasificacion</Label>
              <Select value={clasificacion} onValueChange={setClasificacion}>
                <SelectTrigger className="bg-muted/30 border-border text-foreground">
                  <SelectValue placeholder="Ninguna" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="rapido" className="text-foreground">Rapido</SelectItem>
                  <SelectItem value="confiable" className="text-foreground">Confiable</SelectItem>
                  <SelectItem value="frecuente" className="text-foreground">Frecuente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Grupo de origen (opcional)</Label>
            <Input
              placeholder="Nombre del grupo"
              value={grupoOrigen}
              onChange={(e) => setGrupoOrigen(e.target.value)}
              className="bg-muted/30 border-border text-foreground"
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-border">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1"
              style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContactCard({ contact, index }: { contact: any; index: number }) {
  const isProvider = contact.tipo === "provider";
  const clasif = contact.clasificacion ? clasificacionConfig[contact.clasificacion] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border border-border bg-card p-4 flex items-center gap-4"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{
          background: isProvider ? "rgba(37,211,102,0.12)" : "rgba(59,130,246,0.12)",
          color: isProvider ? "#25D366" : "#3B82F6",
        }}
      >
        {contact.nombre.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">{contact.nombre}</p>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
            style={{
              background: isProvider ? "rgba(37,211,102,0.12)" : "rgba(59,130,246,0.12)",
              color: isProvider ? "#25D366" : "#3B82F6",
            }}
          >
            {isProvider ? "Proveedor" : "Contacto"}
          </span>
          {clasif && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1"
              style={{ background: clasif.bg, color: clasif.color }}
            >
              <clasif.icon className="w-2.5 h-2.5" />
              {clasif.label}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">{contact.numero}</p>
        {contact.grupoOrigen && (
          <p className="text-[10px] text-muted-foreground mt-0.5">Grupo: {contact.grupoOrigen}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-semibold text-foreground">{contact.historial}</p>
        <p className="text-[10px] text-muted-foreground">cotizaciones</p>
      </div>
    </motion.div>
  );
}

export default function Contactos() {
  const [showNuevo, setShowNuevo] = useState(false);
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  const { data: contactos, isLoading } = useListContacts(
    {
      type: (tipoFiltro !== "todos" ? tipoFiltro : undefined) as any,
      search: search || undefined,
    },
    { query: { queryKey: getListContactsQueryKey(), refetchInterval: 30000 } }
  );

  const providers = contactos?.filter((c: any) => c.tipo === "provider").length ?? 0;
  const contacts = contactos?.filter((c: any) => c.tipo === "contact").length ?? 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contactos y Proveedores</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {providers} proveedores · {contacts} contactos
          </p>
        </div>
        <Button
          onClick={() => setShowNuevo(true)}
          style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}
          className="gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo Contacto
        </Button>
      </motion.div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contactos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border text-foreground"
          />
        </div>
        {["todos", "provider", "contact"].map((f) => (
          <button
            key={f}
            onClick={() => setTipoFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              tipoFiltro === f
                ? "border-[#25D366] text-[#25D366] bg-[#25D366]/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "todos" ? "Todos" : f === "provider" ? "Proveedores" : "Contactos"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : contactos?.length === 0 ? (
        <div className="text-center py-20">
          <Contact className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">Sin contactos</p>
          <p className="text-sm text-muted-foreground mb-6">Agrega tu primer proveedor</p>
          <Button
            onClick={() => setShowNuevo(true)}
            style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8)" }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Contacto
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {contactos?.map((c: any, i: number) => (
            <ContactCard key={c.id} contact={c} index={i} />
          ))}
        </div>
      )}

      {showNuevo && <NuevoContactoModal onClose={() => setShowNuevo(false)} />}
    </div>
  );
}
