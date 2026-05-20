import { useState, useEffect, useRef } from "react";
import { Search, Users, Check, X, ChevronDown, WifiOff } from "lucide-react";

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000"
  : (import.meta.env.VITE_API_URL || "https://autoshoe-backend.onrender.com");

interface SyncedGroup {
  id: number;
  jid: string | null;
  nombre: string;
  participantes: number;
  categoria: string | null;
  sessionId: number;
}

interface GroupPickerProps {
  label: string;
  hint: string;
  selected: string[];
  onChange: (jids: string[]) => void;
  placeholder?: string;
  multiple?: boolean;
}

export function GroupPicker({ label, hint, selected, onChange, placeholder, multiple = true }: GroupPickerProps) {
  const [groups, setGroups] = useState<SyncedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/groups?activo=true`)
      .then((r) => r.json())
      .then((data: SyncedGroup[]) => {
        setGroups(Array.isArray(data) ? data.filter((g) => g.jid) : []);
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = groups.filter(
    (g) =>
      g.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (g.jid || "").includes(search)
  );

  const toggle = (jid: string) => {
    if (!multiple) {
      if (selected.includes(jid)) {
        onChange([]);
      } else {
        onChange([jid]);
        setOpen(false);
      }
    } else {
      if (selected.includes(jid)) {
        onChange(selected.filter((j) => j !== jid));
      } else {
        onChange([...selected, jid]);
      }
    }
  };

  const removeOne = (jid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((j) => j !== jid));
  };

  const getGroupName = (jid: string) =>
    groups.find((g) => g.jid === jid)?.nombre ?? jid;

  const noSession = !loading && groups.length === 0;

  return (
    <div ref={ref} className="relative">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-[38px] bg-muted/30 border border-border rounded-lg px-3 py-2 text-left flex items-center gap-2 flex-wrap hover:border-[#25D366]/50 transition-colors focus:outline-none focus:border-[#25D366]"
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground text-sm">
            {placeholder ?? "Todos los grupos (sin filtro)"}
          </span>
        ) : (
          selected.map((jid) => (
            <span
              key={jid}
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/25 font-medium"
            >
              {getGroupName(jid)}
              <X
                className="w-3 h-3 cursor-pointer hover:text-white transition-colors"
                onClick={(e) => removeOne(jid, e)}
              />
            </span>
          ))
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar grupo..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Cargando grupos...</div>
            ) : noSession ? (
              <div className="px-4 py-6 text-center">
                <WifiOff className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sin grupos sincronizados</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Conecta una sesion de WhatsApp primero</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Sin coincidencias</div>
            ) : (
              filtered.map((g) => {
                const isSelected = selected.includes(g.jid!);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggle(g.jid!)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors ${isSelected ? "bg-[#25D366]/05" : ""}`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? "border-[#25D366] bg-[#25D366]" : "border-border bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">{g.nombre}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{g.jid}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
                      <Users className="w-3 h-3" />
                      {g.participantes}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {selected.length > 0 && (
            <div className="border-t border-border px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {selected.length} seleccionado{selected.length !== 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
              >
                Limpiar seleccion
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
