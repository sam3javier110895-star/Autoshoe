import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Wifi, WifiOff, Zap, MessageSquare, Clock, Timer,
  CheckCircle,
} from "lucide-react";
import {
  useGetDashboardActivity,
  useGetWhatsappSessions,
  useListForwardedMessages,
  useListAutomations,
  getGetDashboardActivityQueryKey,
  getGetWhatsappSessionsQueryKey,
  getListForwardedMessagesQueryKey,
  getListAutomationsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000"
  : (import.meta.env.VITE_API_URL || "https://autoshoe-backend.onrender.com");

function PulseOrb({ color, size }: { color: string; size: number }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full animate-ping opacity-50"
        style={{ background: color }}
      />
      <div className="relative rounded-full" style={{ width: size, height: size, background: color }} />
    </div>
  );
}

function tipoColor(tipo: string) {
  const map: Record<string, string> = {
    reenvio: "#25D366",
    consulta: "#F59E0B",
    automatizacion: "#8B5CF6",
    conexion: "#3B82F6",
    respuesta: "#F59E0B",
  };
  return map[tipo] || "#64748B";
}

function CountdownTimer({ expiraEn }: { expiraEn: string }) {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(expiraEn).getTime() - Date.now()) / 1000));
    setSecs(calc());
    const iv = setInterval(() => setSecs(calc()), 1000);
    return () => clearInterval(iv);
  }, [expiraEn]);

  const min = Math.floor(secs / 60);
  const sec = secs % 60;
  const pct = Math.min(100, (secs / 600) * 100);
  const color = secs < 60 ? "#EF4444" : secs < 180 ? "#F59E0B" : "#25D366";

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#222" strokeWidth="3" />
          <circle
            cx="16" cy="16" r="14" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 14}`}
            strokeDashoffset={`${2 * Math.PI * 14 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Timer className="w-3 h-3" style={{ color }} />
        </div>
      </div>
      <span className="text-xs font-mono font-bold" style={{ color }}>
        {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
      </span>
    </div>
  );
}

function ActiveConsultas() {
  const [consultas, setConsultas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConsultas = async () => {
    try {
      const r = await fetch(`${API_URL}/api/consultas/activas`);
      const data = await r.json();
      if (Array.isArray(data)) setConsultas(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchConsultas();
    const iv = setInterval(fetchConsultas, 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PulseOrb color="#F59E0B" size={6} />
          <span className="text-xs font-semibold text-foreground">Consultas Activas</span>
        </div>
        <span className="text-xs text-muted-foreground">{consultas.length} en curso</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : consultas.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Sin consultas activas</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Las consultas aparecen cuando llega una foto</p>
          </div>
        ) : (
          <AnimatePresence>
            {consultas.map((c: any) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 rounded-lg border border-[#F59E0B]/20 bg-[#F59E0B]/5"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-foreground truncate">{c.grupoOrigenNombre}</p>
                    <p className="text-[10px] text-muted-foreground">{c.automationNombre}</p>
                  </div>
                  <CountdownTimer expiraEn={c.expiraEn} />
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {c.respuestasCount} respuestas
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#25D366]" />
                    {c.respuestasConPrecio} con precio
                  </span>
                  <span className="ml-auto px-1.5 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] rounded text-[9px] font-medium">
                    {c.criterio === "mejor_precio" ? "Mejor precio" : c.criterio === "primer_respuesta" ? "Primera respuesta" : "Manual"}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default function Monitor() {
  const { data: activity, isLoading: loadingActivity } = useGetDashboardActivity({
    query: { queryKey: getGetDashboardActivityQueryKey(), refetchInterval: 5000 },
  });

  const { data: sessions, isLoading: loadingSessions } = useGetWhatsappSessions({
    query: { queryKey: getGetWhatsappSessionsQueryKey(), refetchInterval: 5000 },
  });

  const { data: forwarded, isLoading: loadingForwarded } = useListForwardedMessages({
    query: { queryKey: getListForwardedMessagesQueryKey(), refetchInterval: 5000 },
  });

  const { data: automaciones } = useListAutomations({
    query: { queryKey: getListAutomationsQueryKey(), refetchInterval: 10000 },
  });

  const connectedSessions = sessions?.filter((s: any) => s.estado === "conectado").length ?? 0;
  const activasCount = automaciones?.filter((a: any) => a.activa).length ?? 0;
  const recentForwarded = forwarded?.slice(0, 5) ?? [];

  return (
    <div className="p-6 h-full flex flex-col" style={{ minHeight: "calc(100vh - 0px)" }}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(37,211,102,0.12)" }}>
            <Activity className="w-5 h-5" style={{ color: "#25D366" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Monitor en Tiempo Real</h1>
            <p className="text-xs text-muted-foreground">Actualizacion cada 5 segundos</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#25D366" }}>
          <PulseOrb color="#25D366" size={8} />
          <span>En vivo</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Sesiones Activas", value: connectedSessions, color: "#25D366", icon: Wifi },
          { label: "Automatizaciones", value: activasCount, color: "#8B5CF6", icon: Zap },
          { label: "Reenvios Totales", value: forwarded?.length ?? 0, color: "#3B82F6", icon: MessageSquare },
          { label: "Eventos Hoy", value: activity?.length ?? 0, color: "#F59E0B", icon: Clock },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${stat.color}18` }}>
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        <div className="lg:col-span-1 rounded-xl border border-border bg-card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <PulseOrb color="#25D366" size={6} />
            <span className="text-xs font-semibold text-foreground">Actividad en Vivo</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {loadingActivity ? (
              <div className="space-y-2 p-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : (
              <AnimatePresence>
                {activity?.slice(0, 12).map((item: any) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2 px-2 py-2.5 rounded-lg hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: tipoColor(item.tipo) }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-foreground line-clamp-2">{item.descripcion}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(item.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            {!loadingActivity && !activity?.length && (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Sin actividad reciente</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <ActiveConsultas />
        </div>

        <div className="lg:col-span-1 rounded-xl border border-border bg-card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <PulseOrb color="#3B82F6" size={6} />
            <span className="text-xs font-semibold text-foreground">Estado de Sesiones</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loadingSessions ? (
              <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : sessions?.length === 0 ? (
              <div className="text-center py-8">
                <WifiOff className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Sin sesiones configuradas</p>
              </div>
            ) : (
              sessions?.map((s: any) => {
                const isConectado = s.estado === "conectado";
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <div className="relative">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
                        style={{ background: isConectado ? "rgba(37,211,102,0.12)" : "rgba(239,68,68,0.12)", color: isConectado ? "#25D366" : "#EF4444" }}
                      >
                        {s.nombre.charAt(0)}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card" style={{ background: isConectado ? "#25D366" : "#EF4444" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{s.nombre}</p>
                      <p className="text-[10px] text-muted-foreground">{s.gruposSincronizados ?? 0} grupos</p>
                    </div>
                    <div
                      className="text-[10px] font-medium px-2 py-1 rounded"
                      style={{ background: isConectado ? "rgba(37,211,102,0.12)" : "rgba(239,68,68,0.12)", color: isConectado ? "#25D366" : "#EF4444" }}
                    >
                      {isConectado ? "Activo" : "Inactivo"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-1 rounded-xl border border-border bg-card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <PulseOrb color="#8B5CF6" size={6} />
            <span className="text-xs font-semibold text-foreground">Reenvios Recientes</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loadingForwarded ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : recentForwarded.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Sin reenvios recientes</p>
              </div>
            ) : (
              recentForwarded.map((msg: any) => (
                <div key={msg.id} className="p-3 rounded-lg border border-border">
                  <p className="text-[11px] text-foreground line-clamp-2 mb-1">{msg.contenido}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {(msg.gruposDestino as string[]).length} grupos
                    </span>
                    <div className="h-1 rounded-full flex-1 mx-3 overflow-hidden bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${msg.progreso}%`, background: msg.estado === "completado" ? "#25D366" : msg.estado === "fallido" ? "#EF4444" : "#3B82F6" }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{msg.progreso}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
