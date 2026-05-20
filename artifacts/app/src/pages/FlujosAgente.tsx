import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch, Plus, Play, Trash2, Power, ChevronDown, ChevronUp,
  Loader2, Send, MessageSquare, CheckCircle2, Radio, ArrowRight,
  Image, Clock, Users, Megaphone, Bot, Zap, X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useListFlujos,
  useCreateFlujo,
  useDeleteFlujo,
  useToggleFlujo,
  simularFlujo,
  getListFlujosQueryKey,
} from "@workspace/api-client-react";

const faseColors: Record<number, string> = { 1: "#25D366", 2: "#F59E0B", 3: "#3B82F6" };
const faseIcons = [Send, MessageSquare, Megaphone];
const faseLabels = ["Reenvío Masivo", "Confirmación", "Publicación"];

function LogLine({ log, i }: { log: { fase: number; mensaje: string; tipo: string }; i: number }) {
  const color = faseColors[log.fase];
  const iconMap: Record<string, string> = {
    info: "→", success: "✓", wait: "⋯", bot: "🤖", done: "★",
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.04 }}
      className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0"
    >
      <span
        className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
        style={{ background: `${color}20`, color }}
      >
        F{log.fase}
      </span>
      <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5 font-mono">
        {iconMap[log.tipo] || "·"}
      </span>
      <span className="text-xs text-foreground leading-relaxed">{log.mensaje}</span>
    </motion.div>
  );
}

function SimularModal({ flujo, onClose }: { flujo: Record<string, unknown>; onClose: () => void }) {
  const [proveedor, setProveedor] = useState("Proveedor Shoes Colombia");
  const [precio, setPrecio] = useState("$85.000");
  const [numero, setNumero] = useState("+57 310 000 0000");
  const [resultado, setResultado] = useState<Record<string, unknown> | null>(null);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<Array<{ fase: number; mensaje: string; tipo: string }>>([]);

  const handleSimular = async () => {
    setRunning(true);
    setLogs([]);
    setResultado(null);
    try {
      const res = await simularFlujo(flujo.id as number, { proveedor, precio, numero });
      // Stream logs progressively
      for (let i = 0; i < res.logs.length; i++) {
        await new Promise((r) => setTimeout(r, 350));
        setLogs((prev) => [...prev, res.logs[i]]);
      }
      setResultado(res.resultado);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Play className="w-4 h-4" style={{ color: "#25D366" }} />
            Simular — {flujo.nombre as string}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-lg border border-border/50 bg-muted/10 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">¿Qué hace la simulación?</p>
            <p>Ejecuta el flujo completo con datos ficticios, mostrando cada paso en tiempo real. No envía mensajes reales de WhatsApp.</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Proveedor (demo)</Label>
              <Input value={proveedor} onChange={(e) => setProveedor(e.target.value)} className="bg-muted/30 border-border text-foreground text-xs h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Precio demo</Label>
              <Input value={precio} onChange={(e) => setPrecio(e.target.value)} className="bg-muted/30 border-border text-foreground text-xs h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Número demo</Label>
              <Input value={numero} onChange={(e) => setNumero(e.target.value)} className="bg-muted/30 border-border text-foreground text-xs h-8" />
            </div>
          </div>

          <Button
            onClick={handleSimular}
            disabled={running}
            className="w-full gap-2"
            style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
          >
            {running ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Ejecutando flujo...</>
            ) : (
              <><Play className="w-4 h-4" /> Iniciar Simulación</>
            )}
          </Button>

          {logs.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-border bg-muted/10 p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-3 h-3 animate-pulse" style={{ color: running ? "#25D366" : "#64748B" }} />
                <span className="text-xs font-medium text-foreground">
                  {running ? "Ejecutando..." : "Completado"}
                </span>
              </div>
              <div className="space-y-0">
                {logs.map((log, i) => <LogLine key={i} log={log} i={i} />)}
              </div>
            </motion.div>
          )}

          {resultado && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border p-4 space-y-3"
              style={{ borderColor: "#25D366", background: "rgba(37,211,102,0.05)" }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: "#25D366" }} />
                <span className="text-sm font-semibold text-foreground">Flujo completado con éxito</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="text-muted-foreground">Proveedor</p>
                  <p className="font-semibold text-foreground mt-0.5">{resultado.proveedor as string}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="text-muted-foreground">Número</p>
                  <p className="font-semibold text-foreground font-mono mt-0.5">{resultado.numero as string}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="text-muted-foreground">Precio confirmado</p>
                  <p className="font-semibold mt-0.5" style={{ color: "#25D366" }}>{resultado.precio as string}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="text-muted-foreground">Publicado en</p>
                  <p className="font-semibold text-foreground mt-0.5">{resultado.grupoPublicacion as string || "Grupo G"}</p>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-2 text-xs">
                <p className="text-muted-foreground mb-0.5">Mensaje publicado</p>
                <p className="text-foreground font-medium">"{resultado.mensajeFinal as string}"</p>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NuevoFlujoModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const [nombre, setNombre] = useState("Flujo Zapatos Principales");
  const [grupoOrigen, setGrupoOrigen] = useState("");
  const [gruposDestino, setGruposDestino] = useState("");
  const [imagenesPorLote, setImagenesPorLote] = useState(3);
  const [intervaloSegundos, setIntervaloSegundos] = useState(15);
  const [mensajeConsulta, setMensajeConsulta] = useState("¿Tienen esta zapatilla? Precio y disponibilidad");
  const [preguntaConfirmacion, setPreguntaConfirmacion] = useState("¿Es segura/fija a ese precio?");
  const [palabrasConfirmacion, setPalabrasConfirmacion] = useState("si,sí,segura,fija,confirmado,dale,ok,va");
  const [timeoutMin, setTimeoutMin] = useState(30);
  const [grupoPublicacion, setGrupoPublicacion] = useState("");
  const [plantilla, setPlantilla] = useState("Proveedor confirmado: {numero} — Precio fijo: {precio}");

  const createMutation = useCreateFlujo({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFlujosQueryKey() });
        onClose();
      },
    }
  });

  const handleSubmit = () => {
    createMutation.mutate({
      data: {
        nombre,
        grupoOrigen,
        gruposDestino: gruposDestino.split(",").map((g) => g.trim()).filter(Boolean),
        imagenesPorLote,
        intervaloSegundos,
        mensajeConsulta,
        preguntaConfirmacion,
        palabrasConfirmacion: palabrasConfirmacion.split(",").map((p) => p.trim()).filter(Boolean),
        timeoutConfirmacionMin: timeoutMin,
        grupoPublicacion,
        plantillaPublicacion: plantilla,
      }
    });
  };

  const steps = [
    { n: 1, label: "Reenvío", icon: Send, color: "#25D366" },
    { n: 2, label: "Confirmación", icon: MessageSquare, color: "#F59E0B" },
    { n: 3, label: "Publicación", icon: Megaphone, color: "#3B82F6" },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <GitBranch className="w-4 h-4" style={{ color: "#25D366" }} />
            Nuevo Flujo de Agente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nombre del flujo</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} className="bg-muted/30 border-border text-foreground" />
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => setStep(s.n)}
                  className="flex items-center gap-1.5 flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors"
                  style={step === s.n ? { background: `${s.color}15`, color: s.color, borderColor: s.color, border: `1px solid ${s.color}40` } : { background: "transparent", color: "#64748B", border: "1px solid transparent" }}
                >
                  <s.icon className="w-3 h-3 flex-shrink-0" />
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.n}</span>
                </button>
                {i < 2 && <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.2)" }}>
                  <p className="font-medium" style={{ color: "#25D366" }}>📤 Fase 1 — Reenvío Masivo</p>
                  <p className="text-muted-foreground">Detecta fotos en el grupo origen y las reenvía en lotes a los grupos proveedores.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1"><Image className="w-3 h-3" /> Imágenes por lote</Label>
                    <Input type="number" min={1} max={10} value={imagenesPorLote} onChange={(e) => setImagenesPorLote(parseInt(e.target.value) || 3)} className="bg-muted/30 border-border text-foreground" />
                    <p className="text-[10px] text-muted-foreground">Fotos a enviar por ciclo</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Intervalo (segundos)</Label>
                    <Input type="number" min={5} max={3600} value={intervaloSegundos} onChange={(e) => setIntervaloSegundos(parseInt(e.target.value) || 15)} className="bg-muted/30 border-border text-foreground" />
                    <p className="text-[10px] text-muted-foreground">Tiempo entre envíos</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Radio className="w-3 h-3" /> Grupo origen (A)</Label>
                  <Input placeholder="Ej: Novedades Zapatos, Clientes VIP..." value={grupoOrigen} onChange={(e) => setGrupoOrigen(e.target.value)} className="bg-muted/30 border-border text-foreground" />
                  <p className="text-[10px] text-muted-foreground">Grupo donde llegan las fotos de referencias</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Grupos destino (B,C,D,E,F)</Label>
                  <Input placeholder="Grupo B, Grupo C, Proveedor Nike, Proveedor Adidas..." value={gruposDestino} onChange={(e) => setGruposDestino(e.target.value)} className="bg-muted/30 border-border text-foreground" />
                  <p className="text-[10px] text-muted-foreground">Grupos proveedores separados por coma</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Mensaje de consulta</Label>
                  <textarea value={mensajeConsulta} onChange={(e) => setMensajeConsulta(e.target.value)} rows={2} className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#25D366] resize-none" />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <p className="font-medium" style={{ color: "#F59E0B" }}>💬 Fase 2 — Confirmación de precio</p>
                  <p className="text-muted-foreground">Cuando un proveedor responde con precio, el agente les pregunta si es seguro/fijo y espera confirmación.</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Bot className="w-3 h-3" /> Pregunta del agente</Label>
                  <Input value={preguntaConfirmacion} onChange={(e) => setPreguntaConfirmacion(e.target.value)} className="bg-muted/30 border-border text-foreground" />
                  <p className="text-[10px] text-muted-foreground">El agente envía esto al proveedor que respondió</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Palabras de confirmación</Label>
                  <Input value={palabrasConfirmacion} onChange={(e) => setPalabrasConfirmacion(e.target.value)} className="bg-muted/30 border-border text-foreground" />
                  <p className="text-[10px] text-muted-foreground">Cuando el proveedor dice alguna de estas palabras, se confirma. Separadas por coma.</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Timeout (minutos)</Label>
                  <Input type="number" min={5} max={1440} value={timeoutMin} onChange={(e) => setTimeoutMin(parseInt(e.target.value) || 30)} className="bg-muted/30 border-border text-foreground" />
                  <p className="text-[10px] text-muted-foreground">Si no responde en este tiempo, se marca como sin respuesta</p>
                </div>
                <div className="rounded-lg bg-muted/20 p-3 text-xs space-y-1.5">
                  <p className="font-medium text-foreground">Ejemplo del diálogo:</p>
                  <div className="space-y-1">
                    <div className="flex gap-2"><span className="text-muted-foreground">Proveedor:</span><span className="text-foreground">"Sí tengo, está a $85.000"</span></div>
                    <div className="flex gap-2"><span style={{ color: "#F59E0B" }}>Agente:</span><span className="text-foreground">"{preguntaConfirmacion}"</span></div>
                    <div className="flex gap-2"><span className="text-muted-foreground">Proveedor:</span><span style={{ color: "#25D366" }}>"sí, es fija"</span></div>
                    <div className="flex gap-2"><span style={{ color: "#25D366" }}>✓</span><span className="text-foreground">Confirmado → pasa a Fase 3</span></div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <p className="font-medium" style={{ color: "#3B82F6" }}>📢 Fase 3 — Publicación en grupo G</p>
                  <p className="text-muted-foreground">Con precio confirmado, el agente va al grupo de publicación, señala la zapatilla y pega el número con el precio.</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Megaphone className="w-3 h-3" /> Grupo de publicación (G)</Label>
                  <Input placeholder="Ej: Catálogo Clientes, Ventas VIP..." value={grupoPublicacion} onChange={(e) => setGrupoPublicacion(e.target.value)} className="bg-muted/30 border-border text-foreground" />
                  <p className="text-[10px] text-muted-foreground">Grupo donde se publica el resultado final</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Plantilla del mensaje</Label>
                  <textarea value={plantilla} onChange={(e) => setPlantilla(e.target.value)} rows={3} className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#3B82F6] resize-none" />
                  <p className="text-[10px] text-muted-foreground">Usa <code className="bg-muted px-1 rounded">{"{numero}"}</code> y <code className="bg-muted px-1 rounded">{"{precio}"}</code> como variables</p>
                </div>
                <div className="rounded-lg bg-muted/20 p-3 text-xs">
                  <p className="font-medium text-foreground mb-1">Vista previa del mensaje:</p>
                  <p className="text-foreground font-medium p-2 rounded bg-muted/30">
                    "{plantilla.replace("{numero}", "+57 310 000 0000").replace("{precio}", "$85.000")}"
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 pt-1">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="border-border">
                ← Anterior
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} className="flex-1" style={{ background: `linear-gradient(135deg, ${faseColors[step]}, ${faseColors[step]}88)` }}>
                Siguiente →
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={createMutation.isPending || !nombre} className="flex-1" style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4 mr-1.5" /> Crear Flujo</>}
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="border-border">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FlujoCard({ flujo, index }: { flujo: Record<string, unknown>; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const queryClient = useQueryClient();

  const toggleMut = useToggleFlujo({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFlujosQueryKey() }),
    }
  });
  const deleteMut = useDeleteFlujo({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFlujosQueryKey() }),
    }
  });

  const destinos = (flujo.gruposDestino as string[]) ?? [];
  const palabras = (flujo.palabrasConfirmacion as string[]) ?? [];
  const activo = flujo.activo as boolean;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="flex items-center gap-3 p-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: activo ? "rgba(37,211,102,0.12)" : "rgba(100,116,139,0.12)" }}>
            <GitBranch className="w-4 h-4" style={{ color: activo ? "#25D366" : "#64748B" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{flujo.nombre as string}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: activo ? "rgba(37,211,102,0.12)" : "rgba(100,116,139,0.12)", color: activo ? "#25D366" : "#64748B" }}>
                {activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {flujo.grupoOrigen as string || "Sin origen"} → {destinos.length} grupos → {flujo.grupoPublicacion as string || "Sin destino final"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="text-right text-xs text-muted-foreground hidden sm:block mr-1">
              <p className="font-semibold text-foreground">{(flujo.ejecuciones as number) ?? 0}</p>
              <p>ejecuciones</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowSim(true)} className="h-7 px-2 border-border gap-1 text-[11px]" style={{ color: "#25D366", borderColor: "rgba(37,211,102,0.3)" }}>
              <Play className="w-3 h-3" /> Probar
            </Button>
            <button onClick={() => toggleMut.mutate({ id: flujo.id as number })} disabled={toggleMut.isPending} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
              <Power className="w-4 h-4" style={{ color: activo ? "#25D366" : "#64748B" }} />
            </button>
            <button onClick={() => deleteMut.mutate({ id: flujo.id as number })} disabled={deleteMut.isPending} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 3-phase mini-diagram */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1">
            {[
              { label: `${flujo.imagenesPorLote as number} fotos / ${flujo.intervaloSegundos as number}s`, icon: Send, color: "#25D366" },
              { label: `"${(flujo.preguntaConfirmacion as string)?.substring(0, 20)}..."`, icon: MessageSquare, color: "#F59E0B" },
              { label: flujo.grupoPublicacion as string || "Grupo G", icon: Megaphone, color: "#3B82F6" },
            ].map((phase, i) => (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div className="flex-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[10px]" style={{ background: `${phase.color}10` }}>
                  <phase.icon className="w-2.5 h-2.5 flex-shrink-0" style={{ color: phase.color }} />
                  <span className="text-muted-foreground truncate">{phase.label}</span>
                </div>
                {i < 2 && <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/50 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-border px-4 py-3 bg-muted/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-2">
                <p className="font-semibold" style={{ color: "#25D366" }}>Fase 1 — Reenvío</p>
                <div><span className="text-muted-foreground">Origen: </span><span className="text-foreground">{flujo.grupoOrigen as string || "—"}</span></div>
                <div>
                  <p className="text-muted-foreground mb-1">Destinos:</p>
                  <div className="flex flex-wrap gap-1">
                    {destinos.map((g, i) => <span key={i} className="px-1.5 py-0.5 rounded text-[10px] border border-border text-muted-foreground">{g}</span>)}
                  </div>
                </div>
                <div><span className="text-muted-foreground">Mensaje: </span><span className="text-foreground italic">"{(flujo.mensajeConsulta as string)?.substring(0, 50)}..."</span></div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold" style={{ color: "#F59E0B" }}>Fase 2 — Confirmación</p>
                <div><span className="text-muted-foreground">Pregunta: </span><span className="text-foreground">"{flujo.preguntaConfirmacion as string}"</span></div>
                <div>
                  <p className="text-muted-foreground mb-1">Palabras OK:</p>
                  <div className="flex flex-wrap gap-1">
                    {palabras.map((p, i) => <span key={i} className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>{p}</span>)}
                  </div>
                </div>
                <div><span className="text-muted-foreground">Timeout: </span><span className="text-foreground">{flujo.timeoutConfirmacionMin as number} min</span></div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold" style={{ color: "#3B82F6" }}>Fase 3 — Publicación</p>
                <div><span className="text-muted-foreground">Grupo G: </span><span className="text-foreground">{flujo.grupoPublicacion as string || "—"}</span></div>
                <div><span className="text-muted-foreground">Plantilla: </span><span className="text-foreground italic">"{flujo.plantillaPublicacion as string}"</span></div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {showSim && <SimularModal flujo={flujo} onClose={() => setShowSim(false)} />}
    </>
  );
}

export default function FlujosAgente() {
  const [showNuevo, setShowNuevo] = useState(false);

  const { data: flujos, isLoading } = useListFlujos({
    query: {
      refetchInterval: 20000,
    } as any
  });

  const activos = (flujos as any[])?.filter((f) => f.activo).length ?? 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flujos de Agente</h1>
          <p className="text-sm text-muted-foreground mt-1">{activos} de {(flujos as unknown[])?.length ?? 0} flujos activos</p>
        </div>
        <Button onClick={() => setShowNuevo(true)} className="gap-2 font-medium" style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}>
          <Plus className="w-4 h-4" /> Nuevo Flujo
        </Button>
      </motion.div>

      {/* How it works */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-border bg-card p-4 mb-6">
        <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" style={{ color: "#25D366" }} /> Cómo funciona un Flujo de 3 Fases
        </p>
        <div className="flex items-start gap-2">
          {[
            { n: "1", title: "Reenvío", desc: "Detecta fotos en Grupo A y las reenvía cada X segundos a grupos B-F con un mensaje de consulta", color: "#25D366", icon: Send },
            { n: "2", title: "Confirmación", desc: "Cuando un proveedor responde con precio, el agente le pregunta si es seguro/fijo y espera confirmación", color: "#F59E0B", icon: MessageSquare },
            { n: "3", title: "Publicación", desc: "Con precio confirmado, extrae el número, busca la zapatilla en Grupo G y publica número + precio", color: "#3B82F6", icon: Megaphone },
          ].map((phase, i) => (
            <div key={i} className="flex-1 flex gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${phase.color}20`, color: phase.color }}>
                  {phase.n}
                </div>
                {i < 2 && <div className="flex-1 w-px mt-1" style={{ background: `${phase.color}30` }} />}
              </div>
              <div className="flex-1 pb-4">
                <p className="text-xs font-semibold mb-0.5" style={{ color: phase.color }}>
                  <phase.icon className="w-3 h-3 inline mr-1" />{phase.title}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{phase.desc}</p>
              </div>
              {i < 2 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 mt-1 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : (flujos as unknown[])?.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(37,211,102,0.1)" }}>
            <GitBranch className="w-8 h-8" style={{ color: "#25D366" }} />
          </div>
          <h3 className="text-foreground font-semibold mb-2">Sin flujos configurados</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Crea un flujo de 3 fases para automatizar: consulta de precios → confirmación → publicación
          </p>
          <Button onClick={() => setShowNuevo(true)} style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}>
            <Plus className="w-4 h-4 mr-2" /> Crear primer flujo
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(flujos as any[]).map((f, i) => <FlujoCard key={f.id as number} flujo={f} index={i} />)}
        </div>
      )}

      {showNuevo && <NuevoFlujoModal onClose={() => setShowNuevo(false)} />}
    </div>
  );
}
