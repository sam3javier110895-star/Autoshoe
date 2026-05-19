import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone, Plus, QrCode, Wifi, WifiOff, RefreshCw, Trash2,
  Users, Loader2, Link as LinkIcon, X,
} from "lucide-react";
import {
  useGetWhatsappSessions,
  useCreateWhatsappSession,
  useDeleteWhatsappSession,
  useGetSessionQr,
  getGetWhatsappSessionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function estadoConfig(estado: string): { color: string; bg: string; label: string } {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    conectado: { color: "#25D366", bg: "rgba(37,211,102,0.12)", label: "Conectado" },
    sincronizando: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", label: "Sincronizando" },
    desconectado: { color: "#64748B", bg: "rgba(100,116,139,0.12)", label: "Desconectado" },
    reconectando: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", label: "Reconectando" },
  };
  return map[estado] || map.desconectado;
}

function QRModal({ session, onClose }: { session: any; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: qrData, isLoading, refetch } = useGetSessionQr(
    session.id as number,
    {
      query: {
        queryKey: ["qr", session.id],
        refetchInterval: 3000,
        retry: false,
      },
    }
  );

  if ((qrData as any)?.status === "connected") {
    queryClient.invalidateQueries({ queryKey: getGetWhatsappSessionsQueryKey() });
    onClose();
  }

  const hasQR = (qrData as any)?.qrData;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <QrCode className="w-4 h-4" style={{ color: "#25D366" }} />
            Vincular {session.nombre}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#25D366" }} />
            </div>
          ) : !hasQR ? (
            <div className="text-center py-8 space-y-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto"
                style={{ background: "rgba(245,158,11,0.12)" }}
              >
                <QrCode className="w-8 h-8" style={{ color: "#F59E0B" }} />
              </div>
              <div>
                <p className="text-foreground font-medium">Esperando QR...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  La sesion esta {(qrData as any)?.status || "procesando"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2 border-border"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Actualizar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div
                  className="w-52 h-52 bg-white rounded-xl flex items-center justify-center"
                  style={{ padding: "12px" }}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(hasQR)}`}
                    alt="WhatsApp QR Code"
                    className="w-full h-full rounded"
                  />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">Escanea con WhatsApp</p>
                <p className="text-xs text-muted-foreground">
                  Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo
                </p>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-muted/30 border border-border p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Instrucciones:</p>
            <p>1. Abre WhatsApp en tu telefono</p>
            <p>2. Ve a Configuracion → Dispositivos vinculados</p>
            <p>3. Toca "Vincular un dispositivo"</p>
            <p>4. Escanea el codigo QR de arriba</p>
          </div>

          <Button variant="outline" onClick={onClose} className="w-full border-border">
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NuevaSesionModal({ onClose }: { onClose: () => void }) {
  const [nombre, setNombre] = useState("");
  const queryClient = useQueryClient();

  const createMutation = useCreateWhatsappSession({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWhatsappSessionsQueryKey() });
        onClose();
      },
    },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Smartphone className="w-4 h-4" style={{ color: "#25D366" }} />
            Nueva Sesion de WhatsApp
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Nombre de la sesion</Label>
            <Input
              placeholder="Ej: Numero Principal, Bot Zapatos..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-muted/30 border-border text-foreground"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 border-border">
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate({ data: { nombre } })}
              disabled={!nombre.trim() || createMutation.isPending}
              className="flex-1"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function WhatsApp() {
  const [showNueva, setShowNueva] = useState(false);
  const [showQR, setShowQR] = useState<any>(null);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [syncResult, setSyncResult] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useGetWhatsappSessions({
    query: { queryKey: getGetWhatsappSessionsQueryKey(), refetchInterval: 8000 },
  });

  const deleteMutation = useDeleteWhatsappSession({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWhatsappSessionsQueryKey() }) },
  });

  const handleConnect = async (id: number) => {
    await fetch(`/api/whatsapp/sessions/${id}/connect`, { method: "POST" });
    queryClient.invalidateQueries({ queryKey: getGetWhatsappSessionsQueryKey() });
  };

  const handleDisconnect = async (id: number) => {
    await fetch(`/api/whatsapp/sessions/${id}/disconnect`, { method: "POST" });
    queryClient.invalidateQueries({ queryKey: getGetWhatsappSessionsQueryKey() });
  };

  const handleSyncGroups = async (id: number) => {
    setSyncing(id);
    setSyncResult((prev) => ({ ...prev, [id]: "" }));
    try {
      const r = await fetch(`/api/whatsapp/sessions/${id}/sync-groups`, { method: "POST" });
      const data = await r.json();
      if (data.success) {
        setSyncResult((prev) => ({ ...prev, [id]: `✓ ${data.gruposSincronizados} grupos sincronizados` }));
        queryClient.invalidateQueries({ queryKey: getGetWhatsappSessionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["groups"] });
      }
    } catch {
      setSyncResult((prev) => ({ ...prev, [id]: "Error al sincronizar" }));
    } finally {
      setSyncing(null);
      setTimeout(() => setSyncResult((prev) => { const n = { ...prev }; delete n[id]; return n; }), 4000);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sesiones de WhatsApp</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sessions?.filter((s: any) => s.estado === "conectado").length ?? 0} de{" "}
            {sessions?.length ?? 0} conectadas
          </p>
        </div>
        <Button
          onClick={() => setShowNueva(true)}
          className="gap-2 font-medium"
          style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
        >
          <Plus className="w-4 h-4" />
          Nueva Sesion
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : sessions?.length === 0 ? (
        <div className="text-center py-20">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(37,211,102,0.1)" }}
          >
            <Smartphone className="w-10 h-10" style={{ color: "#25D366" }} />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Sin sesiones configuradas</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Agrega tu primer numero de WhatsApp para comenzar a gestionar grupos y automatizaciones
          </p>
          <Button
            onClick={() => setShowNueva(true)}
            className="gap-2"
            style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
          >
            <Plus className="w-4 h-4" />
            Agregar Sesion
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {sessions?.map((session: any, i: number) => {
              const cfg = estadoConfig(session.estado);
              const isConectado = session.estado === "conectado";
              const isSincronizando = session.estado === "sincronizando" || session.estado === "reconectando";

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {session.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{session.nombre}</p>
                        {session.numero && (
                          <p className="text-xs text-muted-foreground font-mono">+{session.numero}</p>
                        )}
                        <div
                          className="inline-flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded font-medium mt-0.5"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {isConectado ? (
                            <Wifi className="w-2.5 h-2.5" />
                          ) : isSincronizando ? (
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <WifiOff className="w-2.5 h-2.5" />
                          )}
                          {cfg.label}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate({ id: session.id })}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <Users className="w-3.5 h-3.5 text-muted-foreground mb-1" />
                      <p className="text-lg font-bold text-foreground">{session.gruposSincronizados}</p>
                      <p className="text-[10px] text-muted-foreground">Grupos sincronizados</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <Smartphone className="w-3.5 h-3.5 text-muted-foreground mb-1" />
                      <p className="text-lg font-bold text-foreground capitalize">{session.estado}</p>
                      <p className="text-[10px] text-muted-foreground">Estado actual</p>
                    </div>
                  </div>

                  {syncResult[session.id] && (
                    <div className="mb-3 text-xs px-3 py-2 rounded-lg text-center" style={{ background: "rgba(37,211,102,0.1)", color: "#25D366" }}>
                      {syncResult[session.id]}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {isConectado ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSyncGroups(session.id)}
                          disabled={syncing === session.id}
                          className="flex-1 text-xs gap-1.5"
                          style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
                        >
                          {syncing === session.id ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Sincronizando...</>
                          ) : (
                            <><RefreshCw className="w-3 h-3" /> Sincronizar Grupos</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(session.id)}
                          className="border-border text-xs"
                        >
                          <WifiOff className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => { handleConnect(session.id); setShowQR(session); }}
                          className="flex-1 text-xs"
                          style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
                        >
                          <QrCode className="w-3 h-3 mr-1.5" />
                          Conectar con QR
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowQR(session)}
                          className="border-border text-xs"
                        >
                          <LinkIcon className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {showNueva && <NuevaSesionModal onClose={() => setShowNueva(false)} />}
      {showQR && <QRModal session={showQR} onClose={() => setShowQR(null)} />}
    </div>
  );
}
