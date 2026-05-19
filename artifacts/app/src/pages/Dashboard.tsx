import { motion } from "framer-motion";
import {
  Smartphone, Users, Send, Zap, Package, MessageSquare, Clock,
} from "lucide-react";
import {
  useGetDashboardStats,
  useGetDashboardActivity,
  useGetGroupStats,
  getGetDashboardStatsQueryKey,
  getGetDashboardActivityQueryKey,
  getGetGroupStatsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold" style={{ color: "#25D366" }}>{payload[0]?.value} mensajes</p>
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

const statCards = [
  { key: "whatsappsConectados", label: "WhatsApps Conectados", icon: Smartphone, color: "#25D366", bg: "rgba(37,211,102,0.1)" },
  { key: "gruposSincronizados", label: "Grupos Sincronizados", icon: Users, color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  { key: "mensajesReenviadosHoy", label: "Reenvios Hoy", icon: Send, color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  { key: "automatizacionesActivas", label: "Automatizaciones Activas", icon: Zap, color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  { key: "proveedoresDetectados", label: "Proveedores", icon: Package, color: "#14B8A6", bg: "rgba(20,184,166,0.1)" },
  { key: "respuestasHoy", label: "Respuestas Hoy", icon: MessageSquare, color: "#EC4899", bg: "rgba(236,72,153,0.1)" },
];

export default function Dashboard() {
  const { data: stats, isLoading: loadingStats } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey(), refetchInterval: 15000 },
  });

  const { data: activity, isLoading: loadingActivity } = useGetDashboardActivity({
    query: { queryKey: getGetDashboardActivityQueryKey(), refetchInterval: 10000 },
  });

  const { data: groupStats } = useGetGroupStats({
    query: { queryKey: getGetGroupStatsQueryKey(), refetchInterval: 30000 },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground">Panel Principal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vista general del sistema de automatizacion
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map(({ key, label, icon: Icon, color, bg }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: bg }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            {loadingStats ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                {(stats as any)?.[key] ?? 0}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Messages chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">Mensajes Hoy</h3>
            <div className="w-2 h-2 rounded-full ml-1" style={{ background: "#25D366", animation: "pulse 2s infinite" }} />
          </div>
          {loadingStats ? (
            <Skeleton className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={stats?.mensajesHoy || []}>
                <defs>
                  <linearGradient id="colorMensajes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25D366" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#25D366" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#25D366"
                  strokeWidth={2}
                  fill="url(#colorMensajes)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Top groups */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h3 className="font-semibold text-foreground text-sm mb-4">Grupos mas Activos</h3>
          <div className="space-y-3">
            {groupStats?.slice(0, 6).map((g: any, i: number) => (
              <div key={g.groupId} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{g.nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        background: "#25D366",
                        width: `${Math.min((g.mensajes / (groupStats[0]?.mensajes || 1)) * 100, 100)}%`,
                        minWidth: "8px",
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground">{g.mensajes}/dia</span>
                  </div>
                </div>
              </div>
            ))}
            {(!groupStats || groupStats.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-4">Sin datos de grupos</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Activity feed */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-border bg-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-sm">Actividad Reciente</h3>
          <div className="w-2 h-2 rounded-full ml-1" style={{ background: "#25D366", animation: "pulse 2s infinite" }} />
        </div>
        {loadingActivity ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {activity?.slice(0, 8).map((item: any) => (
              <div
                key={item.id}
                className="flex items-center gap-4 py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: tipoColor(item.tipo) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{item.descripcion}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.grupoOrigen && (
                      <span className="text-[10px] text-muted-foreground">de: {item.grupoOrigen}</span>
                    )}
                    {item.grupoDestino && (
                      <span className="text-[10px] text-muted-foreground">a: {item.grupoDestino}</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {new Date(item.timestamp).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
            {(!activity || activity.length === 0) && (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Sin actividad reciente</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
