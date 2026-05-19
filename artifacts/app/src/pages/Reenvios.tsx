import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Plus, Loader2, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";
import {
  useListForwardedMessages,
  useForwardMessage,
  getListForwardedMessagesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { GroupPicker } from "@/components/GroupPicker";

const estadoConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pendiente: { label: "Pendiente", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: Clock },
  enviando: { label: "Enviando", color: "#3B82F6", bg: "rgba(59,130,246,0.12)", icon: RefreshCw },
  completado: { label: "Completado", color: "#25D366", bg: "rgba(37,211,102,0.12)", icon: CheckCircle },
  fallido: { label: "Fallido", color: "#EF4444", bg: "rgba(239,68,68,0.12)", icon: AlertCircle },
};

function NuevoReenvioModal({ onClose }: { onClose: () => void }) {
  const [contenido, setContenido] = useState("");
  const [gruposDestino, setGruposDestino] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const forwardMutation = useForwardMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListForwardedMessagesQueryKey() });
        onClose();
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenido.trim() || gruposDestino.length === 0) return;
    forwardMutation.mutate({
      data: {
        contenido,
        gruposDestinoIds: [],
      },
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Send className="w-4 h-4" style={{ color: "#25D366" }} />
            Nuevo Reenvio
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Contenido del mensaje</Label>
            <textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              rows={4}
              placeholder="Escribe el mensaje a reenviar..."
              className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#25D366] resize-none"
              required
            />
          </div>

          <GroupPicker
            label="Grupos de destino"
            hint="Selecciona los grupos a los que reenviarás el mensaje."
            selected={gruposDestino}
            onChange={setGruposDestino}
            placeholder="Seleccionar grupos..."
          />

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-border">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={forwardMutation.isPending || !contenido.trim() || gruposDestino.length === 0}
              className="flex-1"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
            >
              {forwardMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Reenviar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Reenvios() {
  const [showNuevo, setShowNuevo] = useState(false);

  const { data: messages, isLoading } = useListForwardedMessages({
    query: { queryKey: getListForwardedMessagesQueryKey(), refetchInterval: 10000 },
  });

  const completados = messages?.filter((m: any) => m.estado === "completado").length ?? 0;
  const total = messages?.length ?? 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Centro de Reenvios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {completados} de {total} mensajes completados
          </p>
        </div>
        <Button
          onClick={() => setShowNuevo(true)}
          className="gap-2 font-medium"
          style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
        >
          <Plus className="w-4 h-4" />
          Nuevo Reenvio
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Object.entries(estadoConfig).map(([key, cfg]) => {
          const count = messages?.filter((m: any) => m.estado === key).length ?? 0;
          return (
            <div key={key} className="rounded-xl border border-border bg-card p-4">
              <p className="text-2xl font-bold" style={{ color: cfg.color }}>{count}</p>
              <p className="text-xs text-muted-foreground mt-1">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : messages?.length === 0 ? (
        <div className="text-center py-20">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(37,211,102,0.1)" }}
          >
            <Send className="w-8 h-8" style={{ color: "#25D366" }} />
          </div>
          <h3 className="text-foreground font-semibold mb-2">Sin reenvios registrados</h3>
          <p className="text-sm text-muted-foreground mb-6">Crea tu primer reenvio masivo</p>
          <Button
            onClick={() => setShowNuevo(true)}
            style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Reenvio
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {messages?.map((msg: any, i: number) => {
            const cfg = estadoConfig[msg.estado] || estadoConfig.pendiente;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}
                  >
                    <Icon
                      className={`w-4 h-4 ${msg.estado === "enviando" ? "animate-spin" : ""}`}
                      style={{ color: cfg.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{msg.contenido}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      {msg.grupoOrigen && (
                        <span className="text-[10px] text-muted-foreground">
                          Origen: {msg.grupoOrigen}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {(msg.gruposDestino as string[]).length} grupos destino
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleString("es-CO", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Progreso</span>
                        <span style={{ color: cfg.color }}>{msg.progreso}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${msg.progreso}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: cfg.color }}
                        />
                      </div>
                    </div>
                    {(msg.gruposDestino as string[]).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(msg.gruposDestino as string[]).slice(0, 4).map((g: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded border"
                            style={{ borderColor: "rgba(255,255,255,0.1)", color: "#64748B" }}
                          >
                            {g}
                          </span>
                        ))}
                        {(msg.gruposDestino as string[]).length > 4 && (
                          <span className="text-[10px] text-muted-foreground py-0.5">
                            +{(msg.gruposDestino as string[]).length - 4} mas
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div
                    className="flex-shrink-0 text-[10px] px-2 py-1 rounded font-medium"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {showNuevo && <NuevoReenvioModal onClose={() => setShowNuevo(false)} />}
    </div>
  );
}
