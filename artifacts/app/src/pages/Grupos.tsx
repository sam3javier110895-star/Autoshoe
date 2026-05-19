import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Search, Edit2, MessageSquare, Clock,
} from "lucide-react";
import {
  useListGroups,
  useUpdateGroup,
  getListGroupsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const categorias = [
  "Todas",
  "Proveedores Medellin",
  "Nike Originales",
  "Adidas Disponibles",
  "Grupo Mayoristas",
  "Envios",
  "Clientes VIP",
  "Sin categoria",
];

const categoriaColors: Record<string, { color: string; bg: string }> = {
  "Proveedores Medellin": { color: "#25D366", bg: "rgba(37,211,102,0.12)" },
  "Nike Originales": { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  "Adidas Disponibles": { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  "Grupo Mayoristas": { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  "Envios": { color: "#14B8A6", bg: "rgba(20,184,166,0.12)" },
  "Clientes VIP": { color: "#EC4899", bg: "rgba(236,72,153,0.12)" },
};

function getCatColor(cat: string | null) {
  if (!cat) return { color: "#64748B", bg: "rgba(100,116,139,0.12)" };
  return categoriaColors[cat] || { color: "#64748B", bg: "rgba(100,116,139,0.12)" };
}

function EditarGrupoModal({ group, onClose }: { group: any; onClose: () => void }) {
  const [categoria, setCategoria] = useState(group.categoria || "");
  const queryClient = useQueryClient();

  const updateMutation = useUpdateGroup({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
        onClose();
      },
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar Grupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{group.nombre}</p>
            <p className="text-xs text-muted-foreground">{group.participantes} participantes</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="bg-muted/30 border-border text-foreground">
                <SelectValue placeholder="Seleccionar categoria" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {categorias.slice(1).map((c) => (
                  <SelectItem key={c} value={c} className="text-foreground">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border-border">
              Cancelar
            </Button>
            <Button
              onClick={() => updateMutation.mutate({ id: group.id, data: { categoria } })}
              disabled={updateMutation.isPending}
              className="flex-1"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
            >
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Grupos() {
  const [search, setSearch] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [editando, setEditando] = useState<any>(null);

  const { data: grupos, isLoading } = useListGroups(
    {
      search: search || undefined,
      category: categoriaFiltro !== "Todas" ? categoriaFiltro : undefined,
    },
    { query: { queryKey: getListGroupsQueryKey(), refetchInterval: 30000 } }
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Grupos de WhatsApp</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explora y organiza tus grupos sincronizados
        </p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar grupos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border text-foreground"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaFiltro(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                categoriaFiltro === cat
                  ? "text-white"
                  : "text-muted-foreground bg-card border border-border hover:text-foreground"
              }`}
              style={
                categoriaFiltro === cat
                  ? { background: "linear-gradient(135deg, #25D366, #128C7E)" }
                  : {}
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 mb-5">
        {[
          { label: "Total grupos", value: grupos?.length ?? 0 },
          { label: "Activos hoy", value: grupos?.filter((g: any) => g.mensajesDiarios > 0).length ?? 0 },
          { label: "Promedio mensajes", value: grupos?.length ? Math.round(grupos.reduce((a: number, g: any) => a + g.mensajesDiarios, 0) / grupos.length) : 0 },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground text-sm">{stat.value}</span>
            {stat.label}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : grupos?.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">Sin grupos encontrados</p>
          <p className="text-sm text-muted-foreground">Ajusta los filtros o sincroniza tu WhatsApp</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {grupos?.map((grupo: any, i: number) => {
            const catColor = getCatColor(grupo.categoria);
            return (
              <motion.div
                key={grupo.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card p-4 hover:border-muted-foreground/20 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: catColor.bg, color: catColor.color }}
                    >
                      {grupo.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{grupo.nombre}</p>
                      {grupo.categoria && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: catColor.bg, color: catColor.color }}
                        >
                          {grupo.categoria}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditando(grupo)}
                    className="p-1 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted/50 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {grupo.participantes} miembros
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MessageSquare className="w-3 h-3" />
                    {grupo.mensajesDiarios}/dia
                  </div>
                </div>

                {grupo.ultimaActividad && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-2">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(grupo.ultimaActividad).toLocaleString("es-CO", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                )}

                <div
                  className="mt-3 h-1 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${catColor.color} ${Math.min(grupo.mensajesDiarios, 100)}%, rgba(255,255,255,0.05) 0%)`,
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {editando && (
        <EditarGrupoModal group={editando} onClose={() => setEditando(null)} />
      )}
    </div>
  );
}
