import { useState, useCallback } from "react";
import {
  Copy, Check, Truck, Upload, Search,
  ChevronUp, ChevronDown, Sun, AlertTriangle,
  CheckCircle, BarChart2, Package, Users, X,
} from "lucide-react";

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastItem { id: number; message: string; type: "success" | "error" | "info"; }
let toastId = 0;

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: number) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl pointer-events-auto"
          style={{ background: "#0c1220", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9", fontFamily: "'DM Mono', monospace", fontSize: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.7)", minWidth: "280px" }}>
          <span style={{ color: t.type === "success" ? "#4ade80" : t.type === "error" ? "#f87171" : "#60a5fa" }}>
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
          </span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} style={{ color: "#475569" }}><X size={12} /></button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const remove = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), []);
  const show = useCallback((message: string, type: ToastItem["type"] = "info") => {
    const id = ++toastId;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, remove, show };
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface AMRow {
  idRuta: string;
  nombreRuta: string;
  idSeller: string;
  sellerName: string;
  volTeorico: number;
  capAsignada: number;
  shpsProyectados: number;
  horaCorte: string;
  riesgo: "ALTO" | "MEDIO" | "BAJO";
}

// ── Datos de muestra ──────────────────────────────────────────────────────────

const INITIAL_AM_ROWS: AMRow[] = [
  { idRuta: "142511001", nombreRuta: "ARXBA3_NOR_HSD110N", idSeller: "192050101", sellerName: "LOGIPRO NORTE",     volTeorico: 4.8,  capAsignada: 3.2,  shpsProyectados: 312,  horaCorte: "08:00", riesgo: "ALTO"  },
  { idRuta: "142511002", nombreRuta: "ARXBA3_NOR_HSA221N", idSeller: "192050102", sellerName: "DISTRIBUCIONES XL", volTeorico: 3.6,  capAsignada: 3.6,  shpsProyectados: 240,  horaCorte: "08:30", riesgo: "BAJO"  },
  { idRuta: "142511003", nombreRuta: "ARXBA3_CEN_HSC330C", idSeller: "192050103", sellerName: "MERCADO CENTRAL",   volTeorico: 5.1,  capAsignada: 3.8,  shpsProyectados: 408,  horaCorte: "09:00", riesgo: "ALTO"  },
  { idRuta: "142511004", nombreRuta: "ARXBA3_CEN_HSF441C", idSeller: "192050104", sellerName: "FULL SHOP ARG",     volTeorico: 2.9,  capAsignada: 3.2,  shpsProyectados: 195,  horaCorte: "09:00", riesgo: "BAJO"  },
  { idRuta: "142511005", nombreRuta: "ARXBA3_SUR_HSG552S", idSeller: "192050105", sellerName: "GLOBAL STORE BA",   volTeorico: 4.2,  capAsignada: 3.5,  shpsProyectados: 285,  horaCorte: "09:30", riesgo: "MEDIO" },
  { idRuta: "142511006", nombreRuta: "ARXBA3_OES_HSH663B", idSeller: "192050106", sellerName: "DEPOSITO OESTE",    volTeorico: 3.8,  capAsignada: 3.2,  shpsProyectados: 260,  horaCorte: "10:00", riesgo: "MEDIO" },
  { idRuta: "142511007", nombreRuta: "ARXBA3_NOR_HSJ774N", idSeller: "192050107", sellerName: "TECH MELI NORTE",   volTeorico: 6.0,  capAsignada: 3.8,  shpsProyectados: 520,  horaCorte: "07:30", riesgo: "ALTO"  },
  { idRuta: "142511008", nombreRuta: "ARXBA3_SUR_HSK885S", idSeller: "192050108", sellerName: "ECOMM SOLUTIONS",   volTeorico: 2.4,  capAsignada: 3.2,  shpsProyectados: 160,  horaCorte: "10:00", riesgo: "BAJO"  },
];

// ── CSV Parser client-side ────────────────────────────────────────────────────

const CAP_MAP: Record<string, number> = {
  "Camioneta": 5.0, "Semi": 25.0, "Chasis": 10.0,
  "Chasis Liviano": 8.0, "Chasis Pesado": 15.0,
};

function parseVol(raw: string): number { return parseFloat(raw.replace(/[^\d.]/g, "")) || 0; }
function parseHorario(raw: string): string { return raw.split(" a ")[0].trim() || "09:00"; }

function splitLine(line: string): string[] {
  const result: string[] = [];
  let cur = "", inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) { result.push(cur); cur = ""; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

// Normaliza texto: elimina tildes y convierte a minúsculas para comparar headers
// independientemente del encoding con que el browser leyó el archivo
function norm(s: string): string {
  return s.toLowerCase()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i").replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u").replace(/[ñ]/g, "n")
    .trim();
}

function findCol(headers: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const i = headers.findIndex(h => norm(h) === norm(c));
    if (i !== -1) return i;
  }
  return -1;
}

function parseCSV(text: string): AMRow[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV vacío o sin datos");
  const headers = splitLine(lines[0]);

  // Buscar columnas con nombres normalizados (tolerante a tildes y encoding)
  const idx = {
    idRuta:     findCol(headers, "ID de Ruta"),
    nombreRuta: findCol(headers, "Nombre de Ruta"),
    tipoVh:     findCol(headers, "Tipo de vehiculo", "Tipo de vehículo"),
    tipoParada: findCol(headers, "Tipo de parada"),
    parada:     findCol(headers, "Parada"),
    idParada:   findCol(headers, "ID de Parada"),
    horario:    findCol(headers, "Horario"),
    pkgsEst:    findCol(headers, "Paquetes estimados"),
    volCol:     findCol(headers, "Volumen colectado"),
    topSeller:  findCol(headers, "Top Seller"),
  };

  // Fallback posicional si alguna columna no se encontró por nombre
  // Basado en el orden conocido del CSV de MLA
  const POS: Record<string, number> = {
    idRuta: 0, nombreRuta: 1, tipoVh: 10, tipoParada: 11,
    parada: 12, idParada: 13, horario: 14, pkgsEst: 15,
    volCol: 19, topSeller: 21,
  };
  const get = (key: keyof typeof idx) => idx[key] !== -1 ? idx[key] : POS[key];

  const groups = new Map<string, string[][]>();
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (cols.length < 10) continue;
    const id = cols[get("idRuta")];
    if (!id) continue;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id)!.push(cols);
  }

  if (groups.size === 0) throw new Error("No se encontraron rutas en el archivo.");

  const result: AMRow[] = [];
  groups.forEach((filas, idRuta) => {
    const vendedores = filas.filter(f => f[get("tipoParada")] === "Vendedor");
    if (!vendedores.length) return;
    const tipoVh = filas[0][get("tipoVh")] || "Camioneta";
    const capAsignada = CAP_MAP[tipoVh] ?? 10.0;
    const volTeorico = parseFloat(filas.reduce((acc, f) => acc + parseVol(f[get("volCol")]), 0).toFixed(3));
    const shpsProyectados = vendedores.reduce((acc, f) => acc + (parseInt(f[get("pkgsEst")]) || 0), 0);
    const nombreRuta = filas[0][get("nombreRuta")] || idRuta;
    const horaCorte = parseHorario(vendedores[0][get("horario")]);
    const topSeller = vendedores.find(f => f[get("topSeller")] === "Si") ?? vendedores[0];
    const sellerName = topSeller[get("parada")] || "Sin nombre";
    const idSeller = String(topSeller[get("idParada")] || idRuta);
    const sat = capAsignada > 0 ? (volTeorico / capAsignada) * 100 : 0;
    const riesgo: AMRow["riesgo"] = sat > 85 ? "ALTO" : sat > 65 ? "MEDIO" : "BAJO";
    result.push({ idRuta, nombreRuta, idSeller, sellerName, volTeorico, capAsignada, shpsProyectados, horaCorte, riesgo });
  });
  result.sort((a, b) => (b.volTeorico / b.capAsignada) - (a.volTeorico / a.capAsignada));
  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function copyText(v: string) {
  const el = document.createElement("textarea");
  el.value = v; el.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
  document.body.appendChild(el); el.focus(); el.select();
  document.execCommand("copy"); document.body.removeChild(el);
}

function CopyBtn({ text, onCopied }: { text: string; onCopied: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={e => { e.stopPropagation(); copyText(text); setDone(true); setTimeout(() => setDone(false), 1500); onCopied(); }}
      className="inline-flex items-center justify-center w-6 h-6 rounded transition-all active:scale-90"
      style={{ background: done ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)", border: `1px solid ${done ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)"}`, color: done ? "#4ade80" : "#64748b", flexShrink: 0 }}>
      {done ? <Check size={10} /> : <Copy size={10} />}
    </button>
  );
}

// ── Dispatch Modal ────────────────────────────────────────────────────────────

interface ModalProps {
  seller: { name: string; id: string; volTeorico: number; capAsignada: number; idRuta: string } | null;
  onClose: () => void;
  onConfirm: (buRouteId: string) => void;
}

function DispatchModal({ seller, onClose, onConfirm }: ModalProps) {
  const [buId, setBuId] = useState("");
  const [err, setErr] = useState(false);
  if (!seller) return null;

  const pct = Math.min(100, Math.round((seller.volTeorico / seller.capAsignada) * 100));
  const accent = pct >= 100 ? "#ef4444" : pct > 85 ? "#f97316" : "#3b82f6";

  const confirm = () => { if (!buId.trim()) { setErr(true); return; } onConfirm(buId.trim()); onClose(); setBuId(""); setErr(false); };
  const close = () => { setBuId(""); setErr(false); onClose(); };

  return (
    <div onClick={e => e.target === e.currentTarget && close()}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ background: "#0b1120", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 40px 80px rgba(0,0,0,0.9)", width: "clamp(320px,90vw,460px)" }}>

        {/* Accent top bar */}
        <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />

        <div className="p-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)" }}>
                <Truck size={17} style={{ color: "#60a5fa" }} />
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: "#f1f5f9" }}>Asignar BU Preventivo</div>
                <div className="text-xs mt-0.5" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>Turno AM · Despacho preventivo</div>
              </div>
            </div>
            <button onClick={close} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569" }}>
              <X size={13} />
            </button>
          </div>

          {/* Seller info */}
          <div className="rounded-xl p-3.5 flex items-center justify-between"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div>
              <div className="text-xs mb-0.5" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>SELLER EN RIESGO</div>
              <div className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>{seller.name}</div>
              <div className="text-xs mt-0.5" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{seller.id}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontFamily: "'DM Mono', monospace" }}>
                {seller.volTeorico}m³ / {seller.capAsignada}m³
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
                </div>
                <span className="text-xs font-bold tabular-nums" style={{ color: accent, fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace" }}>
              ID de Ruta del BU asignado
            </label>
            <input autoFocus type="text" value={buId}
              onChange={e => { setBuId(e.target.value); setErr(false); }}
              onKeyDown={e => e.key === "Enter" && confirm()}
              placeholder="Ej: 142913999..."
              className="w-full px-4 py-2.5 rounded-xl outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: `1.5px solid ${err ? "rgba(239,68,68,0.6)" : buId ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)"}`, color: "#f1f5f9", fontFamily: "'DM Mono', monospace", fontSize: "13px", letterSpacing: "0.04em" }} />
            {err && <span className="text-xs" style={{ color: "#f87171", fontFamily: "'DM Mono', monospace" }}>⚠ Campo obligatorio</span>}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={close} className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#64748b", fontFamily: "'DM Mono', monospace" }}>
              Cancelar
            </button>
            <button onClick={confirm} className="flex-[2] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg,#15803d,#16a34a)", border: "1px solid rgba(34,197,94,0.3)", color: "#fff", fontFamily: "'DM Mono', monospace", boxShadow: "0 4px 16px rgba(34,197,94,0.2)" }}>
              <CheckCircle size={14} /> Confirmar Despacho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const { toasts, remove, show } = useToast();
  const [amRows, setAmRows]         = useState<AMRow[]>(INITIAL_AM_ROWS);
  const [isLoading, setIsLoading]   = useState(false);
  const [fileName, setFileName]     = useState<string | null>(null);
  const [sortCol, setSortCol]       = useState<"idRuta" | "shpsProyectados" | "volTeorico">("volTeorico");
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [search, setSearch]         = useState("");
  const [assignedBUs, setAssignedBUs] = useState<Record<string, string>>({});
  const [modalSeller, setModalSeller] = useState<{ name: string; id: string; volTeorico: number; capAsignada: number; idRuta: string } | null>(null);

  // ── CSV loader ────────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true); setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target?.result as string;
        if (!text || text.length < 10) throw new Error("Archivo vacío o ilegible");
        const parsed = parseCSV(text);
        setAmRows(parsed); setAssignedBUs({});
        show(`✓ ${parsed.length} rutas cargadas desde ${file.name}`, "success");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Archivo inválido";
        show(`Error al parsear: ${msg}`, "error");
        console.error("[parseCSV]", err);
      } finally { setIsLoading(false); e.target.value = ""; }
    };
    reader.onerror = () => { show("No se pudo leer el archivo.", "error"); setIsLoading(false); };
    // UTF-8 explícito — evita que Windows lo lea como latin-1
    reader.readAsText(file, "UTF-8");
  };

  // ── Sort ──────────────────────────────────────────────────────────────────
  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };
  const SortIco = ({ col }: { col: typeof sortCol }) =>
    sortCol === col
      ? sortDir === "desc" ? <ChevronDown size={10} /> : <ChevronUp size={10} />
      : <ChevronDown size={10} style={{ opacity: 0.25 }} />;

  // ── Métricas ──────────────────────────────────────────────────────────────
  const totalShps   = amRows.reduce((s, r) => s + r.shpsProyectados, 0);
  const totalVolTeo = amRows.reduce((s, r) => s + r.volTeorico, 0);
  const totalVolCap = amRows.reduce((s, r) => s + r.capAsignada, 0);
  const altoCount   = amRows.filter(r => r.riesgo === "ALTO").length;
  const medioCount  = amRows.filter(r => r.riesgo === "MEDIO").length;
  const bajoCount   = amRows.filter(r => r.riesgo === "BAJO").length;
  const satPct      = totalVolCap > 0 ? Math.round((totalVolTeo / totalVolCap) * 100) : 0;
  const satColor    = satPct >= 100 ? "#f87171" : satPct > 85 ? "#fb923c" : "#4ade80";

  // ── Tabla ─────────────────────────────────────────────────────────────────
  const filtered = amRows
    .filter(r => !search ||
      r.sellerName.toLowerCase().includes(search.toLowerCase()) ||
      r.idSeller.includes(search) || r.idRuta.includes(search) ||
      r.nombreRuta.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const cmp = sortCol === "shpsProyectados" ? a.shpsProyectados - b.shpsProyectados
        : sortCol === "volTeorico" ? a.volTeorico - b.volTeorico
        : Number(a.idRuta) - Number(b.idRuta);
      return sortDir === "desc" ? -cmp : cmp;
    });

  const rCfg = (r: "ALTO"|"MEDIO"|"BAJO") => ({
    ALTO:  { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)",  color: "#f87171", label: "🔴 ALTO"  },
    MEDIO: { bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.35)", color: "#fb923c", label: "🟠 MEDIO" },
    BAJO:  { bg: "rgba(34,197,94,0.09)",  border: "rgba(34,197,94,0.28)",  color: "#4ade80", label: "🟢 BAJO"  },
  }[r]);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#070d1a", fontFamily: "'Inter', sans-serif" }}>
      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b flex flex-col"
        style={{ background: "rgba(7,13,26,0.97)", borderColor: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>

        {/* Row 1 */}
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.45)" }}>
              <Sun size={15} style={{ color: "#60a5fa" }} />
            </div>
            <div>
              <div className="font-bold tracking-tight" style={{ color: "#f1f5f9", fontSize: "15px" }}>BU &amp; UZ Control Center</div>
              <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#60a5fa" }} />
                Gestión AM Preventivo · High Volume Saturation Radar · {new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>

          {/* Stats + botón */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              {[
                { label: "Rutas AM",    value: amRows.length,              color: "#94a3b8" },
                { label: "SHPs Proy.",  value: totalShps.toLocaleString(), color: "#60a5fa" },
                { label: "Riesgo Alto", value: altoCount,                  color: "#f87171" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-right">
                  <div className="text-xs" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>{label}</div>
                  <div className="font-bold tabular-nums" style={{ color, fontFamily: "'DM Mono', monospace", fontSize: "15px" }}>{value}</div>
                </div>
              ))}
            </div>

            {fileName && !isLoading && (
              <span className="hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                style={{ color: "#4ade80", background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", fontFamily: "'DM Mono', monospace" }}>
                <CheckCircle size={10} /> {fileName}
              </span>
            )}

            <label className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all select-none"
              style={{
                background: isLoading ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.12)",
                border: `1.5px solid ${isLoading ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.5)"}`,
                color: "#f87171", fontFamily: "'DM Mono', monospace",
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 0 12px rgba(239,68,68,0.08)",
              }}>
              {isLoading
                ? <><span className="w-3 h-3 rounded-full border-2 animate-spin shrink-0" style={{ borderColor: "rgba(248,113,113,0.3)", borderTopColor: "#f87171" }} /> Procesando...</>
                : <><Upload size={12} /> Cargar Archivo Diario</>}
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={isLoading} />
            </label>
          </div>
        </div>

        {/* Row 2: tab único AM */}
        <div className="flex items-end border-t px-5" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2 px-5 py-2.5 -mb-px"
            style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", fontWeight: 700, letterSpacing: "0.02em", color: "#60a5fa", background: "rgba(59,130,246,0.08)", borderBottom: "2px solid rgba(59,130,246,0.7)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#60a5fa" }} />
            [ Gestión AM Preventivo ]
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "#60a5fa", fontSize: "9px" }}>ACTIVO</span>
          </div>
        </div>
      </header>

      {/* ── MAIN GRID ──────────────────────────────────────────────────────── */}
      <main className="flex-1 px-5 py-4 flex flex-col gap-4 overflow-hidden min-h-0">

        {/* ── KPI STRIP — mismo estilo que PM ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
          {[
            { icon: <Package size={15}/>,       label: "SHPs Proyectados",    value: totalShps.toLocaleString(), sub: "paquetes AM",              color: "#60a5fa", bg: "rgba(59,130,246,0.08)",   border: "rgba(59,130,246,0.22)"  },
            { icon: <BarChart2 size={15}/>,     label: "Saturación de Cap.",  value: `${satPct}%`,               sub: `${totalVolTeo.toFixed(1)} / ${totalVolCap.toFixed(1)} m³`, color: satColor, bg: satPct >= 100 ? "rgba(239,68,68,0.08)" : satPct > 85 ? "rgba(249,115,22,0.08)" : "rgba(34,197,94,0.07)", border: satPct >= 100 ? "rgba(239,68,68,0.22)" : satPct > 85 ? "rgba(249,115,22,0.22)" : "rgba(34,197,94,0.2)" },
            { icon: <AlertTriangle size={15}/>, label: "Rutas en Riesgo ALTO",value: altoCount,                  sub: `${medioCount} MEDIO · ${bajoCount} BAJO`,                  color: "#f87171", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.22)"  },
            { icon: <Users size={15}/>,         label: "Sellers procesados",   value: amRows.length,              sub: "turno AM preventivo",      color: "#94a3b8", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.15)" },
          ].map(({ icon, label, value, sub, color, bg, border }) => (
            <div key={label} className="rounded-xl px-4 py-3 flex flex-col gap-1" style={{ background: bg, border: `1px solid ${border}` }}>
              <div className="flex items-center gap-1.5 text-xs mb-0.5" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
                <span style={{ color }}>{icon}</span>{label}
              </div>
              <div className="font-black tabular-nums leading-none" style={{ color, fontFamily: "'DM Mono', monospace", fontSize: "30px", letterSpacing: "-0.04em" }}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* ── TABLA PRINCIPAL — estilo PM ── */}
        <div className="rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0"
          style={{ background: "#0c1526", border: "1px solid rgba(59,130,246,0.15)" }}>

          {/* Table header bar */}
          <div className="px-5 py-3 flex items-center gap-3 border-b shrink-0"
            style={{ borderColor: "rgba(59,130,246,0.1)", background: "rgba(59,130,246,0.04)" }}>
            <BarChart2 size={14} style={{ color: "#60a5fa" }} />
            <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Tabla de Pronóstico AM — Volumen de Colecta</span>
            <span className="ml-auto text-xs px-2 py-1 rounded-lg"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd", fontFamily: "'DM Mono', monospace" }}>
              {amRows.length} rutas procesadas
            </span>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#334155" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar seller, ID, ruta..."
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1", fontFamily: "'DM Mono', monospace", width: "200px" }} />
            </div>
          </div>

          {/* Table scroll */}
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: "900px" }}>
              <thead className="sticky top-0 z-10" style={{ background: "#0a1120" }}>
                <tr>
                  {([
                    { label: "ID Ruta",        col: "idRuta"          as typeof sortCol | null, align: "left"   },
                    { label: "Nombre Ruta",    col: null,                                        align: "left"   },
                    { label: "ID Seller",      col: null,                                        align: "left"   },
                    { label: "Seller / Place", col: null,                                        align: "left"   },
                    { label: "Vol. Colectado", col: "volTeorico"      as typeof sortCol | null, align: "center" },
                    { label: "Cap. Asignada",  col: null,                                        align: "center" },
                    { label: "SHPs Proy.",     col: "shpsProyectados" as typeof sortCol | null, align: "center" },
                    { label: "Hora Corte",     col: null,                                        align: "center" },
                    { label: "Riesgo",         col: null,                                        align: "left"   },
                    { label: "Acción",         col: null,                                        align: "center" },
                  ] as { label: string; col: typeof sortCol | null; align: string }[]).map(({ label, col, align }) => (
                    <th key={label} className={`px-4 py-3 text-${align} ${col ? "cursor-pointer" : ""}`}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                      onClick={col ? () => toggleSort(col!) : undefined}>
                      <span className={`inline-flex items-center gap-1 text-xs uppercase tracking-widest`}
                        style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
                        {label} {col && <SortIco col={col} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!filtered.length && (
                  <tr><td colSpan={10} className="py-16 text-center text-sm" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>Sin resultados</td></tr>
                )}
                {filtered.map((row, idx) => {
                  const rc      = rCfg(row.riesgo);
                  const pct     = Math.min(150, Math.round((row.volTeorico / row.capAsignada) * 100));
                  const accent  = pct >= 100 ? "#ef4444" : pct > 85 ? "#f97316" : "#3b82f6";
                  const isSat   = pct > 85;
                  const buAsig  = assignedBUs[row.idRuta];
                  return (
                    <tr key={row.idRuta} className="group transition-colors"
                      style={{
                        borderLeft: `3px solid ${accent}`,
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: buAsig ? "rgba(34,197,94,0.04)" : idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                        opacity: buAsig ? 0.6 : 1,
                      }}>

                      {/* ID Ruta */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold tabular-nums" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{row.idRuta}</span>
                      </td>

                      {/* Nombre Ruta */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold" style={{ color: "#93c5fd", fontFamily: "'DM Mono', monospace" }}>{row.nombreRuta}</span>
                      </td>

                      {/* ID Seller */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs tabular-nums font-semibold" style={{ color: "#e2e8f0", fontFamily: "'DM Mono', monospace" }}>{row.idSeller}</span>
                          <CopyBtn text={row.idSeller} onCopied={() => show("¡ID copiado!", "success")} />
                        </div>
                      </td>

                      {/* Seller name */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium" style={{ color: "#f1f5f9", fontSize: "13px" }}>{row.sellerName}</span>
                      </td>

                      {/* Vol. Colectado — número grande + mini barra */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="font-black tabular-nums leading-none"
                            style={{ color: accent, fontFamily: "'DM Mono', monospace", fontSize: "22px", letterSpacing: "-0.04em" }}>
                            {row.volTeorico}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${accent}18`, color: accent, fontFamily: "'DM Mono', monospace", fontSize: "9px" }}>m³</span>
                          <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: accent }} />
                          </div>
                        </div>
                      </td>

                      {/* Cap asignada */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm tabular-nums font-semibold" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{row.capAsignada}m³</span>
                      </td>

                      {/* SHPs */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="font-black tabular-nums leading-none" style={{ color: "#60a5fa", fontFamily: "'DM Mono', monospace", fontSize: "22px", letterSpacing: "-0.04em" }}>
                            {row.shpsProyectados}
                          </span>
                          <span className="text-xs rounded px-1.5 py-0.5" style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", fontFamily: "'DM Mono', monospace", fontSize: "9px" }}>SHPs</span>
                        </div>
                      </td>

                      {/* Hora */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-xs font-bold tabular-nums" style={{ color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>{row.horaCorte}</span>
                      </td>

                      {/* Riesgo */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.color, fontFamily: "'DM Mono', monospace" }}>
                          {rc.label}
                        </span>
                      </td>

                      {/* Acción */}
                      <td className="px-4 py-3.5 text-center">
                        {buAsig ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
                            <CheckCircle size={12} style={{ color: "#4ade80" }} />
                            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>
                              BU {buAsig}
                            </span>
                          </div>
                        ) : isSat ? (
                          <button
                            onClick={() => setModalSeller({ name: row.sellerName, id: row.idSeller, volTeorico: row.volTeorico, capAsignada: row.capAsignada, idRuta: row.idRuta })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-90 active:scale-95"
                            style={{ background: "linear-gradient(135deg,rgba(239,68,68,0.18),rgba(239,68,68,0.1))", border: "1.5px solid rgba(239,68,68,0.55)", color: "#f87171", fontFamily: "'DM Mono', monospace", fontSize: "11px", boxShadow: "0 0 10px rgba(239,68,68,0.15)", whiteSpace: "nowrap" }}>
                            <Truck size={11} /> ASIGNAR BU
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                            style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>
                            ✓ OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-5 py-2.5 border-t flex items-center justify-between flex-wrap gap-2 shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "#080f1d" }}>
            <div className="flex items-center gap-4 text-xs" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>
              <span>{filtered.length} filas en vista</span>
              <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
              <span>{filtered.reduce((s, r) => s + r.shpsProyectados, 0).toLocaleString()} SHPs proyectados</span>
              <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
              <span style={{ color: "#f87171" }}>{altoCount} rutas en riesgo alto</span>
              <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
              <span style={{ color: "#22c55e" }}>{Object.keys(assignedBUs).length} BUs asignados</span>
            </div>
            <div className="flex items-center gap-3">
              {[{ color: "#ef4444", label: "≥ 100% cap." }, { color: "#f97316", label: "85–99%" }, { color: "#3b82f6", label: "< 85%" }].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />{label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer versión */}
        <div className="flex items-center justify-between text-xs shrink-0 pb-1" style={{ color: "#1e293b", fontFamily: "'DM Mono', monospace" }}>
          <span>LogiPredict · BU &amp; UZ Control Center · v4.1.0</span>
          <span>Turno AM · {amRows.length} sellers procesados</span>
        </div>
      </main>

      <DispatchModal
        seller={modalSeller}
        onClose={() => setModalSeller(null)}
        onConfirm={buRouteId => {
          if (modalSeller) {
            setAssignedBUs(p => ({ ...p, [modalSeller.idRuta]: buRouteId }));
            show(`¡BU ${buRouteId} registrado para ruta ${modalSeller.idRuta}!`, "success");
          }
        }}
      />
    </div>
  );
}    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, remove, show };
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface AMRow {
  idRuta: string;
  nombreRuta: string;
  idSeller: string;
  sellerName: string;
  volTeorico: number;
  capAsignada: number;
  shpsProyectados: number;
  horaCorte: string;
  riesgo: "ALTO" | "MEDIO" | "BAJO";
}

// ── Datos de muestra ──────────────────────────────────────────────────────────

const INITIAL_AM_ROWS: AMRow[] = [
  { idRuta: "142511001", nombreRuta: "ARXBA3_NOR_HSD110N", idSeller: "192050101", sellerName: "LOGIPRO NORTE",     volTeorico: 4.8,  capAsignada: 3.2,  shpsProyectados: 312,  horaCorte: "08:00", riesgo: "ALTO"  },
  { idRuta: "142511002", nombreRuta: "ARXBA3_NOR_HSA221N", idSeller: "192050102", sellerName: "DISTRIBUCIONES XL", volTeorico: 3.6,  capAsignada: 3.6,  shpsProyectados: 240,  horaCorte: "08:30", riesgo: "BAJO"  },
  { idRuta: "142511003", nombreRuta: "ARXBA3_CEN_HSC330C", idSeller: "192050103", sellerName: "MERCADO CENTRAL",   volTeorico: 5.1,  capAsignada: 3.8,  shpsProyectados: 408,  horaCorte: "09:00", riesgo: "ALTO"  },
  { idRuta: "142511004", nombreRuta: "ARXBA3_CEN_HSF441C", idSeller: "192050104", sellerName: "FULL SHOP ARG",     volTeorico: 2.9,  capAsignada: 3.2,  shpsProyectados: 195,  horaCorte: "09:00", riesgo: "BAJO"  },
  { idRuta: "142511005", nombreRuta: "ARXBA3_SUR_HSG552S", idSeller: "192050105", sellerName: "GLOBAL STORE BA",   volTeorico: 4.2,  capAsignada: 3.5,  shpsProyectados: 285,  horaCorte: "09:30", riesgo: "MEDIO" },
  { idRuta: "142511006", nombreRuta: "ARXBA3_OES_HSH663B", idSeller: "192050106", sellerName: "DEPOSITO OESTE",    volTeorico: 3.8,  capAsignada: 3.2,  shpsProyectados: 260,  horaCorte: "10:00", riesgo: "MEDIO" },
  { idRuta: "142511007", nombreRuta: "ARXBA3_NOR_HSJ774N", idSeller: "192050107", sellerName: "TECH MELI NORTE",   volTeorico: 6.0,  capAsignada: 3.8,  shpsProyectados: 520,  horaCorte: "07:30", riesgo: "ALTO"  },
  { idRuta: "142511008", nombreRuta: "ARXBA3_SUR_HSK885S", idSeller: "192050108", sellerName: "ECOMM SOLUTIONS",   volTeorico: 2.4,  capAsignada: 3.2,  shpsProyectados: 160,  horaCorte: "10:00", riesgo: "BAJO"  },
];

// ── CSV Parser client-side ────────────────────────────────────────────────────

const CAP_MAP: Record<string, number> = {
  "Camioneta": 5.0, "Semi": 25.0, "Chasis": 10.0,
  "Chasis Liviano": 8.0, "Chasis Pesado": 15.0,
};

function parseVol(raw: string): number { return parseFloat(raw.replace(/[^\d.]/g, "")) || 0; }
function parseHorario(raw: string): string { return raw.split(" a ")[0].trim() || "09:00"; }

function splitLine(line: string): string[] {
  const result: string[] = [];
  let cur = "", inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) { result.push(cur); cur = ""; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

function parseCSV(text: string): AMRow[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV vacío o sin datos");
  const headers = splitLine(lines[0]);
  const idx = {
    idRuta: headers.indexOf("ID de Ruta"), nombreRuta: headers.indexOf("Nombre de Ruta"),
    tipoVh: headers.indexOf("Tipo de vehículo"), tipoParada: headers.indexOf("Tipo de parada"),
    parada: headers.indexOf("Parada"), idParada: headers.indexOf("ID de Parada"),
    horario: headers.indexOf("Horario"), pkgsEst: headers.indexOf("Paquetes estimados"),
    volCol: headers.indexOf("Volumen colectado"), topSeller: headers.indexOf("Top Seller"),
  };
  const missing = Object.entries(idx).filter(([, v]) => v === -1).map(([k]) => k);
  if (missing.length) throw new Error(`Columnas no encontradas: ${missing.join(", ")}`);

  const groups = new Map<string, string[][]>();
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (cols.length < 10) continue;
    const id = cols[idx.idRuta];
    if (!id) continue;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id)!.push(cols);
  }

  const result: AMRow[] = [];
  groups.forEach((filas, idRuta) => {
    const vendedores = filas.filter(f => f[idx.tipoParada] === "Vendedor");
    if (!vendedores.length) return;
    const tipoVh = filas[0][idx.tipoVh] || "Camioneta";
    const capAsignada = CAP_MAP[tipoVh] ?? 10.0;
    const volTeorico = parseFloat(filas.reduce((acc, f) => acc + parseVol(f[idx.volCol]), 0).toFixed(3));
    const shpsProyectados = vendedores.reduce((acc, f) => acc + (parseInt(f[idx.pkgsEst]) || 0), 0);
    const nombreRuta = filas[0][idx.nombreRuta] || idRuta;
    const horaCorte = parseHorario(vendedores[0][idx.horario]);
    const topSeller = vendedores.find(f => f[idx.topSeller] === "Si") ?? vendedores[0];
    const sellerName = topSeller[idx.parada] || "Sin nombre";
    const idSeller = String(topSeller[idx.idParada] || idRuta);
    const sat = capAsignada > 0 ? (volTeorico / capAsignada) * 100 : 0;
    const riesgo: AMRow["riesgo"] = sat > 85 ? "ALTO" : sat > 65 ? "MEDIO" : "BAJO";
    result.push({ idRuta, nombreRuta, idSeller, sellerName, volTeorico, capAsignada, shpsProyectados, horaCorte, riesgo });
  });
  result.sort((a, b) => (b.volTeorico / b.capAsignada) - (a.volTeorico / a.capAsignada));
  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function copyText(v: string) {
  const el = document.createElement("textarea");
  el.value = v; el.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
  document.body.appendChild(el); el.focus(); el.select();
  document.execCommand("copy"); document.body.removeChild(el);
}

function CopyBtn({ text, onCopied }: { text: string; onCopied: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={e => { e.stopPropagation(); copyText(text); setDone(true); setTimeout(() => setDone(false), 1500); onCopied(); }}
      className="inline-flex items-center justify-center w-6 h-6 rounded transition-all active:scale-90"
      style={{ background: done ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)", border: `1px solid ${done ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)"}`, color: done ? "#4ade80" : "#64748b", flexShrink: 0 }}>
      {done ? <Check size={10} /> : <Copy size={10} />}
    </button>
  );
}

// ── Dispatch Modal ────────────────────────────────────────────────────────────

interface ModalProps {
  seller: { name: string; id: string; volTeorico: number; capAsignada: number; idRuta: string } | null;
  onClose: () => void;
  onConfirm: (buRouteId: string) => void;
}

function DispatchModal({ seller, onClose, onConfirm }: ModalProps) {
  const [buId, setBuId] = useState("");
  const [err, setErr] = useState(false);
  if (!seller) return null;

  const pct = Math.min(100, Math.round((seller.volTeorico / seller.capAsignada) * 100));
  const accent = pct >= 100 ? "#ef4444" : pct > 85 ? "#f97316" : "#3b82f6";

  const confirm = () => { if (!buId.trim()) { setErr(true); return; } onConfirm(buId.trim()); onClose(); setBuId(""); setErr(false); };
  const close = () => { setBuId(""); setErr(false); onClose(); };

  return (
    <div onClick={e => e.target === e.currentTarget && close()}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}>
      <div className="flex flex-col rounded-2xl overflow-hidden"
        style={{ background: "#0b1120", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 40px 80px rgba(0,0,0,0.9)", width: "clamp(320px,90vw,460px)" }}>

        {/* Accent top bar */}
        <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />

        <div className="p-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)" }}>
                <Truck size={17} style={{ color: "#60a5fa" }} />
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: "#f1f5f9" }}>Asignar BU Preventivo</div>
                <div className="text-xs mt-0.5" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>Turno AM · Despacho preventivo</div>
              </div>
            </div>
            <button onClick={close} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569" }}>
              <X size={13} />
            </button>
          </div>

          {/* Seller info */}
          <div className="rounded-xl p-3.5 flex items-center justify-between"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div>
              <div className="text-xs mb-0.5" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>SELLER EN RIESGO</div>
              <div className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>{seller.name}</div>
              <div className="text-xs mt-0.5" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{seller.id}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontFamily: "'DM Mono', monospace" }}>
                {seller.volTeorico}m³ / {seller.capAsignada}m³
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
                </div>
                <span className="text-xs font-bold tabular-nums" style={{ color: accent, fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace" }}>
              ID de Ruta del BU asignado
            </label>
            <input autoFocus type="text" value={buId}
              onChange={e => { setBuId(e.target.value); setErr(false); }}
              onKeyDown={e => e.key === "Enter" && confirm()}
              placeholder="Ej: 142913999..."
              className="w-full px-4 py-2.5 rounded-xl outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: `1.5px solid ${err ? "rgba(239,68,68,0.6)" : buId ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)"}`, color: "#f1f5f9", fontFamily: "'DM Mono', monospace", fontSize: "13px", letterSpacing: "0.04em" }} />
            {err && <span className="text-xs" style={{ color: "#f87171", fontFamily: "'DM Mono', monospace" }}>⚠ Campo obligatorio</span>}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={close} className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#64748b", fontFamily: "'DM Mono', monospace" }}>
              Cancelar
            </button>
            <button onClick={confirm} className="flex-[2] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg,#15803d,#16a34a)", border: "1px solid rgba(34,197,94,0.3)", color: "#fff", fontFamily: "'DM Mono', monospace", boxShadow: "0 4px 16px rgba(34,197,94,0.2)" }}>
              <CheckCircle size={14} /> Confirmar Despacho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const { toasts, remove, show } = useToast();
  const [amRows, setAmRows]         = useState<AMRow[]>(INITIAL_AM_ROWS);
  const [isLoading, setIsLoading]   = useState(false);
  const [fileName, setFileName]     = useState<string | null>(null);
  const [sortCol, setSortCol]       = useState<"idRuta" | "shpsProyectados" | "volTeorico">("volTeorico");
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [search, setSearch]         = useState("");
  const [assignedBUs, setAssignedBUs] = useState<Record<string, string>>({});
  const [modalSeller, setModalSeller] = useState<{ name: string; id: string; volTeorico: number; capAsignada: number; idRuta: string } | null>(null);

  // ── CSV loader ────────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true); setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = parseCSV(ev.target?.result as string);
        if (!parsed.length) { show("CSV sin rutas con vendedores.", "error"); return; }
        setAmRows(parsed); setAssignedBUs({});
        show(`✓ ${parsed.length} rutas cargadas desde ${file.name}`, "success");
      } catch (err) {
        show(`Error: ${err instanceof Error ? err.message : "Archivo inválido"}`, "error");
      } finally { setIsLoading(false); e.target.value = ""; }
    };
    reader.onerror = () => { show("No se pudo leer el archivo.", "error"); setIsLoading(false); };
    reader.readAsText(file, "UTF-8");
  };

  // ── Sort ──────────────────────────────────────────────────────────────────
  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };
  const SortIco = ({ col }: { col: typeof sortCol }) =>
    sortCol === col
      ? sortDir === "desc" ? <ChevronDown size={10} /> : <ChevronUp size={10} />
      : <ChevronDown size={10} style={{ opacity: 0.25 }} />;

  // ── Métricas ──────────────────────────────────────────────────────────────
  const totalShps   = amRows.reduce((s, r) => s + r.shpsProyectados, 0);
  const totalVolTeo = amRows.reduce((s, r) => s + r.volTeorico, 0);
  const totalVolCap = amRows.reduce((s, r) => s + r.capAsignada, 0);
  const altoCount   = amRows.filter(r => r.riesgo === "ALTO").length;
  const medioCount  = amRows.filter(r => r.riesgo === "MEDIO").length;
  const bajoCount   = amRows.filter(r => r.riesgo === "BAJO").length;
  const satPct      = totalVolCap > 0 ? Math.round((totalVolTeo / totalVolCap) * 100) : 0;
  const satColor    = satPct >= 100 ? "#f87171" : satPct > 85 ? "#fb923c" : "#4ade80";

  // ── Tabla ─────────────────────────────────────────────────────────────────
  const filtered = amRows
    .filter(r => !search ||
      r.sellerName.toLowerCase().includes(search.toLowerCase()) ||
      r.idSeller.includes(search) || r.idRuta.includes(search) ||
      r.nombreRuta.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const cmp = sortCol === "shpsProyectados" ? a.shpsProyectados - b.shpsProyectados
        : sortCol === "volTeorico" ? a.volTeorico - b.volTeorico
        : Number(a.idRuta) - Number(b.idRuta);
      return sortDir === "desc" ? -cmp : cmp;
    });

  const rCfg = (r: "ALTO"|"MEDIO"|"BAJO") => ({
    ALTO:  { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)",  color: "#f87171", label: "🔴 ALTO"  },
    MEDIO: { bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.35)", color: "#fb923c", label: "🟠 MEDIO" },
    BAJO:  { bg: "rgba(34,197,94,0.09)",  border: "rgba(34,197,94,0.28)",  color: "#4ade80", label: "🟢 BAJO"  },
  }[r]);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#070d1a", fontFamily: "'Inter', sans-serif" }}>
      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="shrink-0 border-b flex flex-col"
        style={{ background: "rgba(7,13,26,0.97)", borderColor: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>

        {/* Row 1 */}
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.45)" }}>
              <Sun size={15} style={{ color: "#60a5fa" }} />
            </div>
            <div>
              <div className="font-bold tracking-tight" style={{ color: "#f1f5f9", fontSize: "15px" }}>BU &amp; UZ Control Center</div>
              <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#60a5fa" }} />
                Gestión AM Preventivo · High Volume Saturation Radar · {new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>

          {/* Stats + botón */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6">
              {[
                { label: "Rutas AM",    value: amRows.length,              color: "#94a3b8" },
                { label: "SHPs Proy.",  value: totalShps.toLocaleString(), color: "#60a5fa" },
                { label: "Riesgo Alto", value: altoCount,                  color: "#f87171" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-right">
                  <div className="text-xs" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>{label}</div>
                  <div className="font-bold tabular-nums" style={{ color, fontFamily: "'DM Mono', monospace", fontSize: "15px" }}>{value}</div>
                </div>
              ))}
            </div>

            {fileName && !isLoading && (
              <span className="hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                style={{ color: "#4ade80", background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", fontFamily: "'DM Mono', monospace" }}>
                <CheckCircle size={10} /> {fileName}
              </span>
            )}

            <label className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all select-none"
              style={{
                background: isLoading ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.12)",
                border: `1.5px solid ${isLoading ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.5)"}`,
                color: "#f87171", fontFamily: "'DM Mono', monospace",
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 0 12px rgba(239,68,68,0.08)",
              }}>
              {isLoading
                ? <><span className="w-3 h-3 rounded-full border-2 animate-spin shrink-0" style={{ borderColor: "rgba(248,113,113,0.3)", borderTopColor: "#f87171" }} /> Procesando...</>
                : <><Upload size={12} /> Cargar Archivo Diario</>}
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={isLoading} />
            </label>
          </div>
        </div>

        {/* Row 2: tab único AM */}
        <div className="flex items-end border-t px-5" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2 px-5 py-2.5 -mb-px"
            style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", fontWeight: 700, letterSpacing: "0.02em", color: "#60a5fa", background: "rgba(59,130,246,0.08)", borderBottom: "2px solid rgba(59,130,246,0.7)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#60a5fa" }} />
            [ Gestión AM Preventivo ]
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "#60a5fa", fontSize: "9px" }}>ACTIVO</span>
          </div>
        </div>
      </header>

      {/* ── MAIN GRID ──────────────────────────────────────────────────────── */}
      <main className="flex-1 px-5 py-4 flex flex-col gap-4 overflow-hidden min-h-0">

        {/* ── KPI STRIP — mismo estilo que PM ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
          {[
            { icon: <Package size={15}/>,       label: "SHPs Proyectados",    value: totalShps.toLocaleString(), sub: "paquetes AM",              color: "#60a5fa", bg: "rgba(59,130,246,0.08)",   border: "rgba(59,130,246,0.22)"  },
            { icon: <BarChart2 size={15}/>,     label: "Saturación de Cap.",  value: `${satPct}%`,               sub: `${totalVolTeo.toFixed(1)} / ${totalVolCap.toFixed(1)} m³`, color: satColor, bg: satPct >= 100 ? "rgba(239,68,68,0.08)" : satPct > 85 ? "rgba(249,115,22,0.08)" : "rgba(34,197,94,0.07)", border: satPct >= 100 ? "rgba(239,68,68,0.22)" : satPct > 85 ? "rgba(249,115,22,0.22)" : "rgba(34,197,94,0.2)" },
            { icon: <AlertTriangle size={15}/>, label: "Rutas en Riesgo ALTO",value: altoCount,                  sub: `${medioCount} MEDIO · ${bajoCount} BAJO`,                  color: "#f87171", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.22)"  },
            { icon: <Users size={15}/>,         label: "Sellers procesados",   value: amRows.length,              sub: "turno AM preventivo",      color: "#94a3b8", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.15)" },
          ].map(({ icon, label, value, sub, color, bg, border }) => (
            <div key={label} className="rounded-xl px-4 py-3 flex flex-col gap-1" style={{ background: bg, border: `1px solid ${border}` }}>
              <div className="flex items-center gap-1.5 text-xs mb-0.5" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
                <span style={{ color }}>{icon}</span>{label}
              </div>
              <div className="font-black tabular-nums leading-none" style={{ color, fontFamily: "'DM Mono', monospace", fontSize: "30px", letterSpacing: "-0.04em" }}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* ── TABLA PRINCIPAL — estilo PM ── */}
        <div className="rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0"
          style={{ background: "#0c1526", border: "1px solid rgba(59,130,246,0.15)" }}>

          {/* Table header bar */}
          <div className="px-5 py-3 flex items-center gap-3 border-b shrink-0"
            style={{ borderColor: "rgba(59,130,246,0.1)", background: "rgba(59,130,246,0.04)" }}>
            <BarChart2 size={14} style={{ color: "#60a5fa" }} />
            <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Tabla de Pronóstico AM — Volumen de Colecta</span>
            <span className="ml-auto text-xs px-2 py-1 rounded-lg"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd", fontFamily: "'DM Mono', monospace" }}>
              {amRows.length} rutas procesadas
            </span>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#334155" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar seller, ID, ruta..."
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1", fontFamily: "'DM Mono', monospace", width: "200px" }} />
            </div>
          </div>

          {/* Table scroll */}
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: "900px" }}>
              <thead className="sticky top-0 z-10" style={{ background: "#0a1120" }}>
                <tr>
                  {([
                    { label: "ID Ruta",        col: "idRuta"          as typeof sortCol | null, align: "left"   },
                    { label: "Nombre Ruta",    col: null,                                        align: "left"   },
                    { label: "ID Seller",      col: null,                                        align: "left"   },
                    { label: "Seller / Place", col: null,                                        align: "left"   },
                    { label: "Vol. Colectado", col: "volTeorico"      as typeof sortCol | null, align: "center" },
                    { label: "Cap. Asignada",  col: null,                                        align: "center" },
                    { label: "SHPs Proy.",     col: "shpsProyectados" as typeof sortCol | null, align: "center" },
                    { label: "Hora Corte",     col: null,                                        align: "center" },
                    { label: "Riesgo",         col: null,                                        align: "left"   },
                    { label: "Acción",         col: null,                                        align: "center" },
                  ] as { label: string; col: typeof sortCol | null; align: string }[]).map(({ label, col, align }) => (
                    <th key={label} className={`px-4 py-3 text-${align} ${col ? "cursor-pointer" : ""}`}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                      onClick={col ? () => toggleSort(col!) : undefined}>
                      <span className={`inline-flex items-center gap-1 text-xs uppercase tracking-widest`}
                        style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
                        {label} {col && <SortIco col={col} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!filtered.length && (
                  <tr><td colSpan={10} className="py-16 text-center text-sm" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>Sin resultados</td></tr>
                )}
                {filtered.map((row, idx) => {
                  const rc      = rCfg(row.riesgo);
                  const pct     = Math.min(150, Math.round((row.volTeorico / row.capAsignada) * 100));
                  const accent  = pct >= 100 ? "#ef4444" : pct > 85 ? "#f97316" : "#3b82f6";
                  const isSat   = pct > 85;
                  const buAsig  = assignedBUs[row.idRuta];
                  return (
                    <tr key={row.idRuta} className="group transition-colors"
                      style={{
                        borderLeft: `3px solid ${accent}`,
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: buAsig ? "rgba(34,197,94,0.04)" : idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                        opacity: buAsig ? 0.6 : 1,
                      }}>

                      {/* ID Ruta */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold tabular-nums" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{row.idRuta}</span>
                      </td>

                      {/* Nombre Ruta */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-semibold" style={{ color: "#93c5fd", fontFamily: "'DM Mono', monospace" }}>{row.nombreRuta}</span>
                      </td>

                      {/* ID Seller */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs tabular-nums font-semibold" style={{ color: "#e2e8f0", fontFamily: "'DM Mono', monospace" }}>{row.idSeller}</span>
                          <CopyBtn text={row.idSeller} onCopied={() => show("¡ID copiado!", "success")} />
                        </div>
                      </td>

                      {/* Seller name */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium" style={{ color: "#f1f5f9", fontSize: "13px" }}>{row.sellerName}</span>
                      </td>

                      {/* Vol. Colectado — número grande + mini barra */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="font-black tabular-nums leading-none"
                            style={{ color: accent, fontFamily: "'DM Mono', monospace", fontSize: "22px", letterSpacing: "-0.04em" }}>
                            {row.volTeorico}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${accent}18`, color: accent, fontFamily: "'DM Mono', monospace", fontSize: "9px" }}>m³</span>
                          <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: accent }} />
                          </div>
                        </div>
                      </td>

                      {/* Cap asignada */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-sm tabular-nums font-semibold" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{row.capAsignada}m³</span>
                      </td>

                      {/* SHPs */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className="font-black tabular-nums leading-none" style={{ color: "#60a5fa", fontFamily: "'DM Mono', monospace", fontSize: "22px", letterSpacing: "-0.04em" }}>
                            {row.shpsProyectados}
                          </span>
                          <span className="text-xs rounded px-1.5 py-0.5" style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", fontFamily: "'DM Mono', monospace", fontSize: "9px" }}>SHPs</span>
                        </div>
                      </td>

                      {/* Hora */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-xs font-bold tabular-nums" style={{ color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>{row.horaCorte}</span>
                      </td>

                      {/* Riesgo */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                          style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.color, fontFamily: "'DM Mono', monospace" }}>
                          {rc.label}
                        </span>
                      </td>

                      {/* Acción */}
                      <td className="px-4 py-3.5 text-center">
                        {buAsig ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
                            <CheckCircle size={12} style={{ color: "#4ade80" }} />
                            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>
                              BU {buAsig}
                            </span>
                          </div>
                        ) : isSat ? (
                          <button
                            onClick={() => setModalSeller({ name: row.sellerName, id: row.idSeller, volTeorico: row.volTeorico, capAsignada: row.capAsignada, idRuta: row.idRuta })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-90 active:scale-95"
                            style={{ background: "linear-gradient(135deg,rgba(239,68,68,0.18),rgba(239,68,68,0.1))", border: "1.5px solid rgba(239,68,68,0.55)", color: "#f87171", fontFamily: "'DM Mono', monospace", fontSize: "11px", boxShadow: "0 0 10px rgba(239,68,68,0.15)", whiteSpace: "nowrap" }}>
                            <Truck size={11} /> ASIGNAR BU
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                            style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>
                            ✓ OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-5 py-2.5 border-t flex items-center justify-between flex-wrap gap-2 shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "#080f1d" }}>
            <div className="flex items-center gap-4 text-xs" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>
              <span>{filtered.length} filas en vista</span>
              <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
              <span>{filtered.reduce((s, r) => s + r.shpsProyectados, 0).toLocaleString()} SHPs proyectados</span>
              <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
              <span style={{ color: "#f87171" }}>{altoCount} rutas en riesgo alto</span>
              <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
              <span style={{ color: "#22c55e" }}>{Object.keys(assignedBUs).length} BUs asignados</span>
            </div>
            <div className="flex items-center gap-3">
              {[{ color: "#ef4444", label: "≥ 100% cap." }, { color: "#f97316", label: "85–99%" }, { color: "#3b82f6", label: "< 85%" }].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />{label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer versión */}
        <div className="flex items-center justify-between text-xs shrink-0 pb-1" style={{ color: "#1e293b", fontFamily: "'DM Mono', monospace" }}>
          <span>LogiPredict · BU &amp; UZ Control Center · v4.1.0</span>
          <span>Turno AM · {amRows.length} sellers procesados</span>
        </div>
      </main>

      <DispatchModal
        seller={modalSeller}
        onClose={() => setModalSeller(null)}
        onConfirm={buRouteId => {
          if (modalSeller) {
            setAssignedBUs(p => ({ ...p, [modalSeller.idRuta]: buRouteId }));
            show(`¡BU ${buRouteId} registrado para ruta ${modalSeller.idRuta}!`, "success");
          }
        }}
      />
    </div>
  );
}    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, remove, show };
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface AMRow {
  idRuta: string;
  nombreRuta: string;
  idSeller: string;
  sellerName: string;
  volTeorico: number;
  capAsignada: number;
  shpsProyectados: number;
  horaCorte: string;
  riesgo: "ALTO" | "MEDIO" | "BAJO";
}

// ── Datos de muestra ──────────────────────────────────────────────────────────

const INITIAL_AM_ROWS: AMRow[] = [
  { idRuta: "142511001", nombreRuta: "ARXBA3_NOR_HSD110N", idSeller: "192050101", sellerName: "LOGIPRO NORTE",      volTeorico: 4.8,  capAsignada: 3.2,  shpsProyectados: 312,  horaCorte: "08:00", riesgo: "ALTO"  },
  { idRuta: "142511002", nombreRuta: "ARXBA3_NOR_HSA221N", idSeller: "192050102", sellerName: "DISTRIBUCIONES XL",  volTeorico: 3.6,  capAsignada: 3.6,  shpsProyectados: 240,  horaCorte: "08:30", riesgo: "BAJO"  },
  { idRuta: "142511003", nombreRuta: "ARXBA3_CEN_HSC330C", idSeller: "192050103", sellerName: "MERCADO CENTRAL",    volTeorico: 5.1,  capAsignada: 3.8,  shpsProyectados: 408,  horaCorte: "09:00", riesgo: "ALTO"  },
  { idRuta: "142511004", nombreRuta: "ARXBA3_CEN_HSF441C", idSeller: "192050104", sellerName: "FULL SHOP ARG",      volTeorico: 2.9,  capAsignada: 3.2,  shpsProyectados: 195,  horaCorte: "09:00", riesgo: "BAJO"  },
  { idRuta: "142511005", nombreRuta: "ARXBA3_SUR_HSG552S", idSeller: "192050105", sellerName: "GLOBAL STORE BA",    volTeorico: 4.2,  capAsignada: 3.5,  shpsProyectados: 285,  horaCorte: "09:30", riesgo: "MEDIO" },
  { idRuta: "142511006", nombreRuta: "ARXBA3_OES_HSH663B", idSeller: "192050106", sellerName: "DEPOSITO OESTE",     volTeorico: 3.8,  capAsignada: 3.2,  shpsProyectados: 260,  horaCorte: "10:00", riesgo: "MEDIO" },
  { idRuta: "142511007", nombreRuta: "ARXBA3_NOR_HSJ774N", idSeller: "192050107", sellerName: "TECH MELI NORTE",    volTeorico: 6.0,  capAsignada: 3.8,  shpsProyectados: 520,  horaCorte: "07:30", riesgo: "ALTO"  },
  { idRuta: "142511008", nombreRuta: "ARXBA3_SUR_HSK885S", idSeller: "192050108", sellerName: "ECOMM SOLUTIONS",    volTeorico: 2.4,  capAsignada: 3.2,  shpsProyectados: 160,  horaCorte: "10:00", riesgo: "BAJO"  },
];

// ── CSV Parser 100% client-side ───────────────────────────────────────────────
// Columnas del CSV real de MLA:
// [0] ID de Ruta  [1] Nombre de Ruta  [10] Tipo de vehículo  [11] Tipo de parada
// [12] Parada  [13] ID de Parada  [14] Horario  [15] Paquetes estimados
// [19] Volumen colectado  [21] Top Seller

const CAP_MAP: Record<string, number> = {
  "Camioneta":      5.0,
  "Semi":          25.0,
  "Chasis":        10.0,
  "Chasis Liviano": 8.0,
  "Chasis Pesado": 15.0,
};

function parseVol(raw: string): number {
  // "61.735 m3" → 61.735
  return parseFloat(raw.replace(/[^\d.]/g, "")) || 0;
}

function parseHorario(raw: string): string {
  // "14:00 a 16:00 hs" → "14:00"
  return raw.split(" a ")[0].trim() || "09:00";
}

function parseCSV(text: string): AMRow[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV vacío o sin datos");

  // Parser simple que respeta campos entre comillas
  function splitLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { result.push(current); current = ""; }
      else { current += ch; }
    }
    result.push(current);
    return result;
  }

  const headers = splitLine(lines[0]);
  const idx = {
    idRuta:      headers.indexOf("ID de Ruta"),
    nombreRuta:  headers.indexOf("Nombre de Ruta"),
    tipoVh:      headers.indexOf("Tipo de vehículo"),
    tipoParada:  headers.indexOf("Tipo de parada"),
    parada:      headers.indexOf("Parada"),
    idParada:    headers.indexOf("ID de Parada"),
    horario:     headers.indexOf("Horario"),
    pkgsEst:     headers.indexOf("Paquetes estimados"),
    volCol:      headers.indexOf("Volumen colectado"),
    topSeller:   headers.indexOf("Top Seller"),
  };

  // Validar que las columnas clave existen
  const missing = Object.entries(idx).filter(([, v]) => v === -1).map(([k]) => k);
  if (missing.length > 0) throw new Error(`Columnas no encontradas: ${missing.join(", ")}`);

  // Agrupar por ID de Ruta
  const groups = new Map<string, string[][]>();
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (cols.length < 10) continue;
    const id = cols[idx.idRuta];
    if (!id) continue;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id)!.push(cols);
  }

  const result: AMRow[] = [];

  groups.forEach((filas, idRuta) => {
    // Solo filas de tipo Vendedor para datos del seller
    const vendedores = filas.filter(f => f[idx.tipoParada] === "Vendedor");
    if (vendedores.length === 0) return;

    // Tipo de vehículo (de cualquier fila de la ruta)
    const tipoVh = filas[0][idx.tipoVh] || "Camioneta";
    const capAsignada = CAP_MAP[tipoVh] ?? 10.0;

    // Volumen total de la ruta (todas las filas, no solo vendedores)
    const volTeorico = parseFloat(
      filas.reduce((acc, f) => acc + parseVol(f[idx.volCol]), 0).toFixed(3)
    );

    // SHPs proyectados: solo filas de Vendedor
    const shpsProyectados = vendedores.reduce(
      (acc, f) => acc + (parseInt(f[idx.pkgsEst]) || 0), 0
    );

    // Nombre de ruta
    const nombreRuta = filas[0][idx.nombreRuta] || idRuta;

    // Hora de corte: del primer vendedor
    const horaCorte = parseHorario(vendedores[0][idx.horario]);

    // Seller principal: Top Seller = "Si" primero, si no el primero
    const topSeller =
      vendedores.find(f => f[idx.topSeller] === "Si") ?? vendedores[0];
    const sellerName = topSeller[idx.parada] || "Sin nombre";
    const idSeller   = topSeller[idx.idParada] || idRuta;

    // Riesgo por saturación
    const sat = capAsignada > 0 ? (volTeorico / capAsignada) * 100 : 0;
    const riesgo: AMRow["riesgo"] =
      sat > 85 ? "ALTO" : sat > 65 ? "MEDIO" : "BAJO";

    result.push({
      idRuta,
      nombreRuta,
      idSeller: String(idSeller),
      sellerName,
      volTeorico,
      capAsignada,
      shpsProyectados,
      horaCorte,
      riesgo,
    });
  });

  // Ordenar por saturación descendente
  result.sort((a, b) =>
    (b.volTeorico / b.capAsignada) - (a.volTeorico / a.capAsignada)
  );

  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function copyText(value: string) {
  const el = document.createElement("textarea");
  el.value = value;
  el.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
  document.body.appendChild(el);
  el.focus(); el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

function CopyBtn({ text, onCopied }: { text: string; onCopied: () => void }) {
  const [done, setDone] = useState(false);
  const go = (e: React.MouseEvent) => {
    e.stopPropagation(); copyText(text); setDone(true);
    setTimeout(() => setDone(false), 1600); onCopied();
  };
  return (
    <button onClick={go} title={`Copiar ${text}`}
      className="inline-flex items-center justify-center w-6 h-6 rounded transition-all active:scale-90"
      style={{ background: done ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)", border: `1px solid ${done ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.13)"}`, color: done ? "#4ade80" : "#64748b", flexShrink: 0 }}>
      {done ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

// ── DispatchModal ─────────────────────────────────────────────────────────────

interface DispatchModalProps {
  seller: { name: string; id: string; volTeorico: number; capAsignada: number; idRuta: string } | null;
  onClose: () => void;
  onConfirm: (buRouteId: string) => void;
}

function DispatchModal({ seller, onClose, onConfirm }: DispatchModalProps) {
  const [buRouteId, setBuRouteId] = useState("");
  const [error, setError] = useState(false);
  if (!seller) return null;

  const pct = Math.min(100, Math.round((seller.volTeorico / seller.capAsignada) * 100));
  const barColor = pct >= 100 ? "#ef4444" : pct > 85 ? "#f97316" : "#3b82f6";

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); };
  const handleConfirm = () => {
    if (!buRouteId.trim()) { setError(true); return; }
    onConfirm(buRouteId.trim()); onClose(); setBuRouteId(""); setError(false);
  };
  const handleClose = () => { setBuRouteId(""); setError(false); onClose(); };

  return (
    <div onClick={handleBackdrop} className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="relative flex flex-col rounded-2xl overflow-hidden"
        style={{ background: "#0d1527", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 32px 80px rgba(0,0,0,0.8)", width: "clamp(320px, 90vw, 460px)" }}>
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa)" }} />
        <div className="px-7 py-6 flex flex-col gap-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}>
                <Truck size={18} style={{ color: "#60a5fa" }} />
              </div>
              <div>
                <div className="font-bold" style={{ color: "#f1f5f9", fontSize: "14px" }}>Asignar Unidad de Respaldo (BU)</div>
                <div className="text-xs mt-0.5" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>Turno AM · Despacho preventivo</div>
              </div>
            </div>
            <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569" }}>
              <X size={13} />
            </button>
          </div>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
          <div className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs uppercase tracking-widest" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>Seller en riesgo</span>
              <span className="font-semibold" style={{ color: "#f1f5f9", fontSize: "13px" }}>{seller.name}</span>
              <span className="text-xs tabular-nums" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>{seller.id}</span>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-xs px-2.5 py-1 rounded-lg font-bold"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontFamily: "'DM Mono', monospace" }}>
                {seller.volTeorico}m³ / {seller.capAsignada}m³
              </span>
              <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <span className="text-xs font-bold" style={{ color: barColor, fontFamily: "'DM Mono', monospace" }}>{pct}% saturación</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>
              ID de Ruta del BU asignado
            </label>
            <div className="relative">
              <input autoFocus type="text" value={buRouteId}
                onChange={e => { setBuRouteId(e.target.value); setError(false); }}
                onKeyDown={e => e.key === "Enter" && handleConfirm()}
                placeholder="Ej: 142913999..."
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: `1.5px solid ${error ? "rgba(239,68,68,0.6)" : buRouteId ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)"}`, color: "#f1f5f9", fontFamily: "'DM Mono', monospace", fontSize: "13px", letterSpacing: "0.04em" }} />
              {buRouteId && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: "#3b82f6" }} />}
            </div>
            {error && <span className="text-xs" style={{ color: "#f87171", fontFamily: "'DM Mono', monospace" }}>⚠ Campo obligatorio</span>}
          </div>
          <div className="flex items-center gap-2.5 pt-1">
            <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-95"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#64748b", fontFamily: "'DM Mono', monospace" }}>
              Cancelar
            </button>
            <button onClick={handleConfirm} className="flex-[2] py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)", border: "1px solid rgba(34,197,94,0.35)", color: "#ffffff", fontFamily: "'DM Mono', monospace", boxShadow: "0 4px 20px rgba(34,197,94,0.25)" }}>
              <CheckCircle size={14} /> Confirmar Despacho
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const { toasts, remove, show } = useToast();

  const [amRows, setAmRows]         = useState<AMRow[]>(INITIAL_AM_ROWS);
  const [isLoading, setIsLoading]   = useState(false);
  const [fileName, setFileName]     = useState<string | null>(null);
  const [sortCol, setSortCol]       = useState<"idRuta" | "shpsProyectados" | "volTeorico">("volTeorico");
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [search, setSearch]         = useState("");
  const [assignedBUs, setAssignedBUs] = useState<Record<string, string>>({});
  const [modalSeller, setModalSeller] = useState<{
    name: string; id: string; volTeorico: number; capAsignada: number; idRuta: string;
  } | null>(null);

  // ── Parser CSV 100% client-side ───────────────────────────────────────────
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          show("El CSV no contiene rutas con vendedores. Verificá el archivo.", "error");
          return;
        }
        setAmRows(parsed);
        setAssignedBUs({}); // resetear BUs asignados al cargar nuevo archivo
        show(`✓ ${parsed.length} rutas cargadas desde ${file.name}`, "success");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al parsear el archivo";
        show(`Error: ${msg}`, "error");
      } finally {
        setIsLoading(false);
        event.target.value = "";
      }
    };
    reader.onerror = () => {
      show("No se pudo leer el archivo.", "error");
      setIsLoading(false);
    };
    reader.readAsText(file, "UTF-8");
  };

  // ── Sort ──────────────────────────────────────────────────────────────────
  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };
  const SortIco = ({ col }: { col: typeof sortCol }) =>
    sortCol === col
      ? sortDir === "desc" ? <ChevronDown size={11} /> : <ChevronUp size={11} />
      : <ChevronDown size={11} style={{ opacity: 0.2 }} />;

  // ── Métricas ──────────────────────────────────────────────────────────────
  const totalShps   = amRows.reduce((s, r) => s + r.shpsProyectados, 0);
  const totalVolTeo = amRows.reduce((s, r) => s + r.volTeorico, 0);
  const totalVolCap = amRows.reduce((s, r) => s + r.capAsignada, 0);
  const altoCount   = amRows.filter(r => r.riesgo === "ALTO").length;
  const medioCount  = amRows.filter(r => r.riesgo === "MEDIO").length;
  const bajoCount   = amRows.filter(r => r.riesgo === "BAJO").length;
  const satPct      = totalVolCap > 0 ? Math.round((totalVolTeo / totalVolCap) * 100) : 0;

  // ── Tabla filtrada y ordenada ─────────────────────────────────────────────
  const filtered = amRows
    .filter(r =>
      !search ||
      r.sellerName.toLowerCase().includes(search.toLowerCase()) ||
      r.idSeller.includes(search) ||
      r.idRuta.includes(search) ||
      r.nombreRuta.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortCol === "shpsProyectados") cmp = a.shpsProyectados - b.shpsProyectados;
      else if (sortCol === "volTeorico") cmp = a.volTeorico - b.volTeorico;
      else cmp = Number(a.idRuta) - Number(b.idRuta);
      return sortDir === "desc" ? -cmp : cmp;
    });

  const riesgoStyle = (r: "ALTO" | "MEDIO" | "BAJO") => ({
    ALTO:  { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)",  color: "#f87171", label: "🔴 ALTO"  },
    MEDIO: { bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.35)", color: "#fb923c", label: "🟠 MEDIO" },
    BAJO:  { bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",   color: "#4ade80", label: "🟢 BAJO"  },
  }[r]);

  const satColor  = satPct > 100 ? "#f87171" : satPct > 85 ? "#fb923c" : "#4ade80";
  const satBg     = satPct > 100 ? "rgba(239,68,68,0.08)" : satPct > 85 ? "rgba(249,115,22,0.08)" : "rgba(34,197,94,0.07)";
  const satBorder = satPct > 100 ? "rgba(239,68,68,0.22)" : satPct > 85 ? "rgba(249,115,22,0.22)" : "rgba(34,197,94,0.2)";

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#070d1a", fontFamily: "'Inter', sans-serif" }}>

      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b flex items-center justify-between gap-4 px-5 py-3 shrink-0"
        style={{ background: "rgba(7,13,26,0.96)", borderColor: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.5)" }}>
            <Sun size={16} style={{ color: "#60a5fa" }} />
          </div>
          <div>
            <div className="font-bold tracking-tight" style={{ color: "#f1f5f9", fontSize: "15px" }}>BU &amp; UZ Control Center</div>
            <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#60a5fa" }} />
              Gestión AM Preventivo · High Volume Saturation Radar
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {[
            { label: "Rutas AM",         value: amRows.length,              color: "#94a3b8" },
            { label: "SHPs Proyectados", value: totalShps.toLocaleString(), color: "#60a5fa" },
            { label: "Riesgo Alto",      value: altoCount,                  color: "#f87171" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-right">
              <div className="text-xs" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>{label}</div>
              <div className="font-bold tabular-nums" style={{ color, fontFamily: "'DM Mono', monospace", fontSize: "15px" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Botón de carga con estado */}
        <div className="flex items-center gap-2 shrink-0">
          {fileName && !isLoading && (
            <span className="hidden lg:flex text-xs px-2 py-1 rounded-lg items-center gap-1.5"
              style={{ color: "#4ade80", fontFamily: "'DM Mono', monospace", background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle size={10} /> {fileName}
            </span>
          )}
          <label className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all select-none"
            style={{
              background: isLoading ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${isLoading ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.09)"}`,
              color: isLoading ? "#60a5fa" : "#64748b",
              fontFamily: "'DM Mono', monospace",
              cursor: isLoading ? "not-allowed" : "pointer",
              boxShadow: isLoading ? "0 0 12px rgba(59,130,246,0.15)" : "none",
            }}>
            {isLoading
              ? <><span className="w-3 h-3 rounded-full border-2 animate-spin shrink-0" style={{ borderColor: "rgba(96,165,250,0.3)", borderTopColor: "#60a5fa" }} /> Procesando...</>
              : <><Upload size={12} /> Cargar CSV de Colecta</>
            }
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={isLoading} />
          </label>
        </div>
      </header>

      {/* ── CONTROL ROOM GRID ───────────────────────────────────────────────── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden min-h-0">

        {/* ════ COLUMNA IZQUIERDA — Panel de Capacidad ════ */}
        <div className="lg:col-span-1 flex flex-col gap-3 min-h-0 overflow-hidden">

          {/* KPI cards 2×2 */}
          <div className="grid grid-cols-2 gap-2.5 shrink-0">
            {[
              { icon: <Package size={14} />,       label: "SHPs Proyectados", value: totalShps.toLocaleString(), sub: "paquetes estimados AM",                                        color: "#60a5fa", bg: "rgba(59,130,246,0.08)",    border: "rgba(59,130,246,0.22)"   },
              { icon: <BarChart2 size={14} />,     label: "Saturación Cap.",  value: `${satPct}%`,               sub: `${totalVolTeo.toFixed(1)} / ${totalVolCap.toFixed(1)} m³`,    color: satColor,  bg: satBg,                      border: satBorder                 },
              { icon: <AlertTriangle size={14} />, label: "Riesgo ALTO",      value: altoCount,                  sub: `${medioCount} MEDIO · ${bajoCount} BAJO`,                     color: "#f87171", bg: "rgba(239,68,68,0.08)",     border: "rgba(239,68,68,0.22)"    },
              { icon: <Clock size={14} />,         label: "Rutas cargadas",   value: amRows.length,              sub: "turno AM preventivo",                                         color: "#94a3b8", bg: "rgba(148,163,184,0.06)",   border: "rgba(148,163,184,0.15)"  },
            ].map(({ icon, label, value, sub, color, bg, border }) => (
              <div key={label} className="rounded-xl px-3.5 py-3 flex flex-col gap-0.5" style={{ background: bg, border: `1px solid ${border}` }}>
                <div className="flex items-center gap-1.5 text-xs mb-0.5" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
                  <span style={{ color }}>{icon}</span><span className="truncate">{label}</span>
                </div>
                <div className="text-2xl font-black tabular-nums leading-none" style={{ color, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.04em" }}>{value}</div>
                <div className="text-xs mt-0.5" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Barra global */}
          <div className="rounded-xl px-4 py-3.5 shrink-0" style={{ background: "#0c1526", border: "1px solid rgba(59,130,246,0.15)" }}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold" style={{ color: "#60a5fa", fontFamily: "'DM Mono', monospace" }}>RESUMEN GLOBAL m³</span>
              <span className="text-xs px-2 py-0.5 rounded"
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd", fontFamily: "'DM Mono', monospace" }}>
                {satPct}% saturación
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, satPct)}%`, background: satPct > 100 ? "#ef4444" : satPct > 85 ? "#f97316" : "#3b82f6", boxShadow: `0 0 8px ${satPct > 100 ? "rgba(239,68,68,0.5)" : satPct > 85 ? "rgba(249,115,22,0.5)" : "rgba(59,130,246,0.5)"}` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-xs" style={{ color: "#1e293b", fontFamily: "'DM Mono', monospace" }}>
              <span>{totalVolTeo.toFixed(1)} m³ colectado</span>
              <span>{totalVolCap.toFixed(1)} m³ capacidad</span>
            </div>
          </div>

          {/* Monitor de saturación — scroll interno */}
          <div className="flex-1 rounded-xl overflow-hidden flex flex-col min-h-0" style={{ background: "#0c1526", border: "1px solid rgba(59,130,246,0.15)" }}>
            <div className="px-4 py-2.5 flex items-center gap-2 shrink-0 border-b" style={{ borderColor: "rgba(59,130,246,0.1)", background: "rgba(59,130,246,0.04)" }}>
              <TrendingUp size={13} style={{ color: "#60a5fa" }} />
              <span className="text-xs font-semibold" style={{ color: "#f1f5f9" }}>Monitor de Saturación por Ruta</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0">
              {amRows.map(row => {
                const pct = Math.min(150, Math.round((row.volTeorico / row.capAsignada) * 100));
                const barColor = pct >= 100 ? "#ef4444" : pct > 85 ? "#f97316" : "#3b82f6";
                const valColor = pct >= 100 ? "#f87171" : pct > 85 ? "#fb923c" : "#60a5fa";
                return (
                  <div key={row.idRuta} className="flex flex-col gap-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-xs font-semibold truncate" style={{ color: "#cbd5e1", fontFamily: "'DM Mono', monospace" }}>{row.sellerName}</span>
                      <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: valColor, fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: barColor, boxShadow: `0 0 6px ${barColor}60` }} />
                    </div>
                    <div className="flex justify-between text-xs" style={{ color: "#1e293b", fontFamily: "'DM Mono', monospace" }}>
                      <span>{row.volTeorico}m³</span><span>{row.capAsignada}m³ cap.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ════ COLUMNA DERECHA — Tabla Operativa (col-span-2) ════ */}
        <div className="lg:col-span-2 flex flex-col gap-3 min-h-0 overflow-hidden">
          <div className="rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0" style={{ background: "#0c1526", border: "1px solid rgba(59,130,246,0.15)" }}>

            {/* Header de tabla */}
            <div className="px-5 py-3 flex items-center gap-3 border-b shrink-0" style={{ borderColor: "rgba(59,130,246,0.1)", background: "rgba(59,130,246,0.04)" }}>
              <BarChart2 size={15} style={{ color: "#60a5fa" }} />
              <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Tabla de Pronóstico AM — Volumen de Colecta</span>
              <span className="ml-auto text-xs px-2 py-1 rounded-lg shrink-0"
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd", fontFamily: "'DM Mono', monospace" }}>
                {amRows.length} rutas
              </span>
              <div className="relative shrink-0">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#334155" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1", fontFamily: "'DM Mono', monospace", width: "160px" }} />
              </div>
            </div>

            {/* Tabla con scroll interno */}
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: "820px" }}>
                <thead className="sticky top-0 z-10" style={{ background: "#0a1120" }}>
                  <tr>
                    {([
                      { label: "ID Ruta",        col: "idRuta"          as typeof sortCol | null, w: "100px" },
                      { label: "Nombre Ruta",    col: null,                                        w: "160px" },
                      { label: "ID Seller",      col: null,                                        w: "130px" },
                      { label: "Seller / Place", col: null,                                        w: "160px" },
                      { label: "Vol. Colectado", col: "volTeorico"      as typeof sortCol | null, w: "120px" },
                      { label: "Cap. Asignada",  col: null,                                        w: "110px" },
                      { label: "SHPs",           col: "shpsProyectados" as typeof sortCol | null, w: "90px"  },
                      { label: "Hora Corte",     col: null,                                        w: "90px"  },
                      { label: "Riesgo",         col: null,                                        w: "100px" },
                      { label: "Estatus Alivio", col: null,                                        w: "150px" },
                    ] as { label: string; col: typeof sortCol | null; w: string }[]).map(({ label, col, w }) => (
                      <th key={label} className={`px-4 py-3 text-left ${col ? "cursor-pointer" : ""}`}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", minWidth: w }}
                        onClick={col ? () => toggleSort(col!) : undefined}>
                        <span className="flex items-center gap-1 text-xs uppercase tracking-widest" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
                          {label} {col && <SortIco col={col} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} className="py-16 text-center text-sm" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>Sin resultados</td></tr>
                  )}
                  {filtered.map((row, idx) => {
                    const rs       = riesgoStyle(row.riesgo);
                    const pct      = Math.min(150, Math.round((row.volTeorico / row.capAsignada) * 100));
                    const barColor = pct >= 100 ? "#ef4444" : pct > 85 ? "#f97316" : "#3b82f6";
                    const accent   = pct >= 100 ? "#ef4444" : pct > 85 ? "#f97316" : "#3b82f6";
                    const isSat    = pct > 85;
                    const buAsig   = assignedBUs[row.idRuta];
                    return (
                      <tr key={row.idRuta} className="group transition-colors"
                        style={{ borderLeft: `3px solid ${accent}`, borderBottom: "1px solid rgba(255,255,255,0.04)", background: buAsig ? "rgba(34,197,94,0.04)" : idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent", opacity: buAsig ? 0.6 : 1 }}>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-bold tabular-nums" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{row.idRuta}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-semibold" style={{ color: "#93c5fd", fontFamily: "'DM Mono', monospace" }}>{row.nombreRuta}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs tabular-nums font-semibold" style={{ color: "#e2e8f0", fontFamily: "'DM Mono', monospace" }}>{row.idSeller}</span>
                            <CopyBtn text={row.idSeller} onCopied={() => show("¡ID Seller copiado!", "success")} />
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-medium" style={{ color: "#f1f5f9", fontSize: "13px" }}>{row.sellerName}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <span className="font-black tabular-nums" style={{ color: barColor, fontFamily: "'DM Mono', monospace", fontSize: "16px", letterSpacing: "-0.04em" }}>{row.volTeorico}m³</span>
                            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: barColor }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm tabular-nums font-semibold" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{row.capAsignada}m³</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span className="font-black tabular-nums leading-none" style={{ color: "#60a5fa", fontFamily: "'DM Mono', monospace", fontSize: "18px", letterSpacing: "-0.04em" }}>{row.shpsProyectados}</span>
                            <span className="rounded-md px-1.5 py-0.5" style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", fontFamily: "'DM Mono', monospace", fontSize: "9px" }}>SHPs</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-bold tabular-nums" style={{ color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>{row.horaCorte}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                            style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color, fontFamily: "'DM Mono', monospace" }}>
                            {rs.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {buAsig ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
                              <CheckCircle size={13} style={{ color: "#4ade80" }} />
                              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>BU {buAsig}</span>
                            </div>
                          ) : isSat ? (
                            <button
                              onClick={() => setModalSeller({ name: row.sellerName, id: row.idSeller, volTeorico: row.volTeorico, capAsignada: row.capAsignada, idRuta: row.idRuta })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-90 active:scale-95"
                              style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.12))", border: "1.5px solid rgba(239,68,68,0.6)", color: "#f87171", fontFamily: "'DM Mono', monospace", fontSize: "11px", boxShadow: "0 0 8px rgba(239,68,68,0.2)", whiteSpace: "nowrap" }}>
                              <Truck size={12} /> Asignar BU
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                              style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>
                              ✓ OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t flex items-center justify-between flex-wrap gap-2 shrink-0"
              style={{ borderColor: "rgba(255,255,255,0.06)", background: "#080f1d" }}>
              <div className="flex items-center gap-4 text-xs" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>
                <span>{filtered.length} filas</span>
                <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
                <span>{filtered.reduce((s, r) => s + r.shpsProyectados, 0).toLocaleString()} SHPs</span>
                <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
                <span style={{ color: "#f87171" }}>{altoCount} rutas críticas</span>
              </div>
              <div className="flex items-center gap-3">
                {[{ color: "#ef4444", label: "≥ 100% cap." }, { color: "#f97316", label: "85–99%" }, { color: "#3b82f6", label: "< 85%" }].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} /><span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs shrink-0" style={{ color: "#1e293b", fontFamily: "'DM Mono', monospace" }}>
            <span>LogiPredict · BU &amp; UZ Control Center · v4.0.0 — Parser Client-Side</span>
            <span>Turno AM · {amRows.length} rutas procesadas</span>
          </div>
        </div>
      </main>

      {/* ── MODAL ─────────────────────────────────────────────────────────── */}
      <DispatchModal
        seller={modalSeller}
        onClose={() => setModalSeller(null)}
        onConfirm={(buRouteId) => {
          if (modalSeller) {
            setAssignedBUs(prev => ({ ...prev, [modalSeller.idRuta]: buRouteId }));
            show(`¡BU ${buRouteId} registrado! Ruta ${modalSeller.idRuta} vinculada.`, "success");
          }
        }}
      />
    </div>
  );
}
