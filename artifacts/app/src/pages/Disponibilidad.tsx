import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Star, Filter } from "lucide-react";
import {
  useListResponses,
  useUpdateResponse,
  getListResponsesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const estadoConfig: Record<string, { label: string; color: string; bg: string }> = {
  disponible: { label: "Disponible", color: "#25D366", bg: "rgba(37,211,102,0.12)" },
  agotado: { label: "Agotado", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  pendiente: { label: "Pendiente", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  confirmado: { label: "Confirmado", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
};

export default function Disponibilidad() {
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos");
  const queryClient = useQueryClient();

  const { data: responses, isLoading } = useListResponses(
    estadoFiltro !== "todos" ? { status: estadoFiltro as any } : {},
    { query: { queryKey: getListResponsesQueryKey(), refetchInterval: 15000 } }
  );

  const updateMutation = useUpdateResponse({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListResponsesQueryKey() }),
    },
  });

  const resumenEstados = ["disponible", "agotado", "pendiente", "confirmado"].reduce((acc, e) => {
    acc[e] = responses?.filter((r: any) => r.estado === e).length ?? 0;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Panel de Disponibilidad</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Respuestas de proveedores y estado de referencias
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Object.entries(estadoConfig).map(([key, cfg]) => (
          <motion.button
            key={key}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setEstadoFiltro(estadoFiltro === key ? "todos" : key)}
            className={`rounded-xl border p-4 text-left transition-all ${
              estadoFiltro === key ? "border-current" : "border-border"
            }`}
            style={estadoFiltro === key ? { borderColor: cfg.color, background: cfg.bg } : { background: "hsl(var(--card))" }}
          >
            <p className="text-2xl font-bold" style={{ color: cfg.color }}>
              {resumenEstados[key] ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{cfg.label}</p>
          </motion.button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">
            {responses?.length ?? 0} registros
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEstadoFiltro("todos")}
            className="border-border text-xs"
          >
            <Filter className="w-3 h-3 mr-1.5" />
            {estadoFiltro === "todos" ? "Todos" : estadoConfig[estadoFiltro]?.label}
          </Button>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : responses?.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">Sin respuestas registradas</p>
            <p className="text-sm text-muted-foreground">Las respuestas se detectaran automaticamente</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {responses?.map((resp: any, i: number) => {
              const cfg = estadoConfig[resp.estado] || estadoConfig.pendiente;
              return (
                <motion.div
                  key={resp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors"
                >
                  <button
                    onClick={() =>
                      updateMutation.mutate({ id: resp.id, data: { prioridad: !resp.prioridad } })
                    }
                    className="flex-shrink-0"
                  >
                    <Star
                      className="w-4 h-4 transition-colors"
                      style={{
                        color: resp.prioridad ? "#F59E0B" : "#374151",
                        fill: resp.prioridad ? "#F59E0B" : "none",
                      }}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{resp.referencia}</p>
                    <p className="text-xs text-muted-foreground">{resp.grupoOrigen}</p>
                  </div>

                  <div className="min-w-0 w-40 hidden md:block">
                    <p className="text-xs font-medium text-foreground truncate">{resp.proveedorNombre}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{resp.proveedorNumero}</p>
                  </div>

                  <div className="w-24 hidden lg:block">
                    <p className="text-xs font-medium text-foreground">
                      {resp.precio || <span className="text-muted-foreground">—</span>}
                    </p>
                  </div>

                  <div className="text-[10px] text-muted-foreground w-20 text-right hidden sm:block">
                    {new Date(resp.timestamp).toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  <Select
                    value={resp.estado}
                    onValueChange={(val) =>
                      updateMutation.mutate({ id: resp.id, data: { estado: val as any } })
                    }
                  >
                    <SelectTrigger
                      className="w-32 h-7 text-xs border-0 rounded-lg"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {Object.entries(estadoConfig).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-xs text-foreground">
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
