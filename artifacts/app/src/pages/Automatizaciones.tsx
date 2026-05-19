import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Plus, Power, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import {
  useListAutomations,
  useCreateAutomation,
  useToggleAutomation,
  useDeleteAutomation,
  getListAutomationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GroupPicker } from "@/components/GroupPicker";

const triggerLabels: Record<string, string> = {
  foto_referencia: "Foto de referencia",
  respuesta_disponible: "Respuesta disponible",
  precio_proveedor: "Precio de proveedor",
  palabra_clave: "Palabra clave",
  primer_proveedor: "Primer proveedor",
};

const criterioLabels: Record<string, string> = {
  mejor_precio: "Mejor precio",
  primer_respuesta: "Primera respuesta",
  manual: "Manual",
};

const accionLabels: Record<string, string> = {
  reenviar: "Reenviar mensaje",
  guardar_contacto: "Guardar contacto",
  notificar: "Notificar",
  marcar_prioridad: "Marcar prioridad",
};

function AutomationCard({ auto, index }: { auto: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const toggleMutation = useToggleAutomation({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAutomationsQueryKey() }) },
  });

  const deleteMutation = useDeleteAutomation({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAutomationsQueryKey() }) },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="flex items-center gap-4 p-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: auto.activa ? "rgba(37,211,102,0.12)" : "rgba(100,116,139,0.12)" }}
        >
          <Zap className="w-4 h-4" style={{ color: auto.activa ? "#25D366" : "#64748B" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{auto.nombre}</p>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                background: auto.activa ? "rgba(37,211,102,0.12)" : "rgba(100,116,139,0.12)",
                color: auto.activa ? "#25D366" : "#64748B",
              }}
            >
              {auto.activa ? "Activa" : "Inactiva"}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {triggerLabels[auto.triggerTipo] || auto.triggerTipo}
            </span>
          </div>
          {auto.descripcion && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{auto.descripcion}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right text-xs text-muted-foreground hidden sm:block">
            <p className="font-semibold text-foreground">{auto.ejecuciones}</p>
            <p>ejecuciones</p>
          </div>
          <button
            onClick={() => toggleMutation.mutate({ id: auto.id })}
            disabled={toggleMutation.isPending}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            title={auto.activa ? "Desactivar" : "Activar"}
          >
            <Power className="w-4 h-4" style={{ color: auto.activa ? "#25D366" : "#64748B" }} />
          </button>
          <button
            onClick={() => deleteMutation.mutate({ id: auto.id })}
            disabled={deleteMutation.isPending}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border px-4 py-3 bg-muted/10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground mb-0.5">Accion</p>
              <p className="font-medium text-foreground">{accionLabels[auto.accion] || auto.accion}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Criterio</p>
              <p className="font-medium text-foreground">{criterioLabels[auto.criterio] || auto.criterio}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Ventana</p>
              <p className="font-medium text-foreground">{auto.ventanaMinutos} min</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Reenviar al origen</p>
              <p className="font-medium text-foreground">{auto.reenviarAlOrigen ? "Si" : "No"}</p>
            </div>
          </div>
          {(auto.gruposOrigen as string[]).length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">Grupos de origen:</p>
              <div className="flex flex-wrap gap-1">
                {(auto.gruposOrigen as string[]).map((g: string, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground">{g}</span>
                ))}
              </div>
            </div>
          )}
          {(auto.gruposDestino as string[]).length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Grupos de destino:</p>
              <div className="flex flex-wrap gap-1">
                {(auto.gruposDestino as string[]).map((g: string, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground">{g}</span>
                ))}
              </div>
            </div>
          )}
          {(auto.palabrasClave as string[]).length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Palabras clave:</p>
              <div className="flex flex-wrap gap-1">
                {(auto.palabrasClave as string[]).map((k: string, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[#25D366]/10 text-[#25D366]">{k}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

function NuevaAutomacionModal({ onClose }: { onClose: () => void }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [triggerTipo, setTriggerTipo] = useState("foto_referencia");
  const [accion, setAccion] = useState("reenviar");
  const [criterio, setCriterio] = useState("mejor_precio");
  const [ventanaMinutos, setVentanaMinutos] = useState(10);
  const [palabrasKey, setPalabrasKey] = useState("");
  const [gruposOrigen, setGruposOrigen] = useState<string[]>([]);
  const [gruposDestino, setGruposDestino] = useState<string[]>([]);
  const [mensajeConsulta, setMensajeConsulta] = useState("Hola, estoy buscando este modelo. Tienen disponibilidad y precio?");
  const [reenviarAlOrigen, setReenviarAlOrigen] = useState(true);

  const queryClient = useQueryClient();

  const createMutation = useCreateAutomation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAutomationsQueryKey() });
        onClose();
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const palabrasClave = palabrasKey
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    createMutation.mutate({
      data: {
        nombre,
        descripcion: descripcion || undefined,
        triggerTipo: triggerTipo as any,
        accion: accion as any,
        criterio: criterio as any,
        ventanaMinutos,
        palabrasClave,
        gruposOrigen,
        gruposDestino,
        mensajeConsulta: mensajeConsulta || undefined,
        reenviarAlOrigen,
      },
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: "#25D366" }} />
            Nueva Automatizacion
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Nombre</Label>
            <Input
              placeholder="Ej: Deteccion foto de Nike"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-muted/30 border-border text-foreground"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Descripcion (opcional)</Label>
            <Input
              placeholder="Describe que hace esta automatizacion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="bg-muted/30 border-border text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Disparador</Label>
              <Select value={triggerTipo} onValueChange={setTriggerTipo}>
                <SelectTrigger className="bg-muted/30 border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(triggerLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-foreground">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Accion</Label>
              <Select value={accion} onValueChange={setAccion}>
                <SelectTrigger className="bg-muted/30 border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(accionLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-foreground">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Criterio</Label>
              <Select value={criterio} onValueChange={setCriterio}>
                <SelectTrigger className="bg-muted/30 border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {Object.entries(criterioLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-foreground">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Ventana (minutos)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={ventanaMinutos}
                onChange={(e) => setVentanaMinutos(parseInt(e.target.value) || 10)}
                className="bg-muted/30 border-border text-foreground"
              />
            </div>
          </div>
          {triggerTipo === "palabra_clave" && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Palabras clave (separadas por coma)</Label>
              <Input
                placeholder="Nike, Air Max, jordan..."
                value={palabrasKey}
                onChange={(e) => setPalabrasKey(e.target.value)}
                className="bg-muted/30 border-border text-foreground"
              />
            </div>
          )}

          <GroupPicker
            label="Grupos de origen"
            hint="De que grupos llegan las fotos/mensajes."
            selected={gruposOrigen}
            onChange={setGruposOrigen}
            placeholder="Todos los grupos"
          />

          <GroupPicker
            label="Grupos de destino"
            hint="A que grupos se reenvian las consultas."
            selected={gruposDestino}
            onChange={setGruposDestino}
            placeholder="Todos los grupos"
          />

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Mensaje de consulta</Label>
            <textarea
              value={mensajeConsulta}
              onChange={(e) => setMensajeConsulta(e.target.value)}
              rows={2}
              className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#25D366] resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setReenviarAlOrigen(!reenviarAlOrigen)}
              className={`w-10 h-5 rounded-full transition-colors relative ${reenviarAlOrigen ? "bg-[#25D366]" : "bg-muted"}`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${reenviarAlOrigen ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
            <Label className="text-sm text-muted-foreground">Reenviar resultado al grupo de origen</Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-border">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !nombre}
              className="flex-1"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear Automatizacion"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Automatizaciones() {
  const [showNueva, setShowNueva] = useState(false);

  const { data: automaciones, isLoading } = useListAutomations({
    query: { queryKey: getListAutomationsQueryKey(), refetchInterval: 15000 },
  });

  const activas = automaciones?.filter((a: any) => a.activa).length ?? 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automatizaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activas} de {automaciones?.length ?? 0} automatizaciones activas
          </p>
        </div>
        <Button
          onClick={() => setShowNueva(true)}
          className="gap-2 font-medium"
          style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
        >
          <Plus className="w-4 h-4" />
          Nueva Automatizacion
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : automaciones?.length === 0 ? (
        <div className="text-center py-20">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(37,211,102,0.1)" }}
          >
            <Zap className="w-8 h-8" style={{ color: "#25D366" }} />
          </div>
          <h3 className="text-foreground font-semibold mb-2">Sin automatizaciones</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Crea tu primera automatizacion para detectar fotos y consultar precios
          </p>
          <Button
            onClick={() => setShowNueva(true)}
            style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Automatizacion
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {automaciones?.map((auto: any, i: number) => (
            <AutomationCard key={auto.id} auto={auto} index={i} />
          ))}
        </div>
      )}

      {showNueva && <NuevaAutomacionModal onClose={() => setShowNueva(false)} />}
    </div>
  );
}
