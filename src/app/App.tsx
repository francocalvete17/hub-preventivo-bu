import { useState } from "react";
import { toast, Toaster } from "sonner";
import {
  Copy, Check, Truck, Bell, RefreshCw, Search,
  ChevronUp, ChevronDown, Moon, Sun, Layers, AlertTriangle,
  CheckCircle, Users, BarChart2, Package, Clock, TrendingUp,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type FilterTab = "BU" | "UZ" | "ABSORBER";
type ShiftView = "AM" | "PM";

// ── PM Data ───────────────────────────────────────────────────────────────────

interface PMRow {
  idRuta: string;
  nombreRuta: string;
  idSeller: string;
  sellerName: string;
  shpsCaidos: number;
  isMulticuenta: boolean;
  accountCount?: number;
  extraIds?: string[];
  extraRoutes?: string[];
}

const PM_ROWS: PMRow[] = [
  { idRuta: "142513444", nombreRuta: "ARXBA3_SUR_HSB555S", idSeller: "192051314", sellerName: "BGHSTORE",                  shpsCaidos: 878, isMulticuenta: false },
  { idRuta: "142513555", nombreRuta: "ARXBA3_SUR_HSE189S", idSeller: "192051777", sellerName: "SALES COM",                 shpsCaidos: 720, isMulticuenta: false },
  { idRuta: "142513666", nombreRuta: "ARXBA3_SUR_HSI981S", idSeller: "192051314", sellerName: "BGHSTORE",                  shpsCaidos: 720, isMulticuenta: false },
  { idRuta: "142513777", nombreRuta: "ARXBA3_SUR_HSE189S", idSeller: "192051888", sellerName: "BIDCOM",                    shpsCaidos: 570, isMulticuenta: false },
  { idRuta: "142513888", nombreRuta: "ARXBA3_OES_HSV186B", idSeller: "192051999", sellerName: "Centro de envío - Fidelia", shpsCaidos: 483, isMulticuenta: false },
];

// ── AM Data ───────────────────────────────────────────────────────────────────

interface AMRow {
  idRuta: string;
  nombreRuta: string;
  idSeller: string;
  sellerName: string;
  volTeorico: number;    // theoretical m³
  capAsignada: number;   // assigned capacity m³
  shpsProyectados: number;
  horaCorte: string;
  riesgo: "ALTO" | "MEDIO" | "BAJO";
}

const AM_ROWS: AMRow[] = [
  { idRuta: "142511001", nombreRuta: "ARXBA3_NOR_HSD110N", idSeller: "192050101", sellerName: "LOGIPRO NORTE",      volTeorico: 4.8,  capAsignada: 3.2,  shpsProyectados: 312, horaCorte: "08:00", riesgo: "ALTO"  },
  { idRuta: "142511002", nombreRuta: "ARXBA3_NOR_HSA221N", idSeller: "192050102", sellerName: "DISTRIBUCIONES XL",  volTeorico: 3.6,  capAsignada: 3.6,  shpsProyectados: 240, horaCorte: "08:30", riesgo: "BAJO"  },
  { idRuta: "142511003", nombreRuta: "ARXBA3_CEN_HSC330C", idSeller: "192050103", sellerName: "MERCADO CENTRAL",    volTeorico: 5.1,  capAsignada: 3.8,  shpsProyectados: 408, horaCorte: "09:00", riesgo: "ALTO"  },
  { idRuta: "142511004", nombreRuta: "ARXBA3_CEN_HSF441C", idSeller: "192050104", sellerName: "FULL SHOP ARG",      volTeorico: 2.9,  capAsignada: 3.2,  shpsProyectados: 195, horaCorte: "09:00", riesgo: "BAJO"  },
  { idRuta: "142511005", nombreRuta: "ARXBA3_SUR_HSG552S", idSeller: "192050105", sellerName: "GLOBAL STORE BA",    volTeorico: 4.2,  capAsignada: 3.5,  shpsProyectados: 285, horaCorte: "09:30", riesgo: "MEDIO" },
  { idRuta: "142511006", nombreRuta: "ARXBA3_OES_HSH663B", idSeller: "192050106", sellerName: "DEPOSITO OESTE",     volTeorico: 3.8,  capAsignada: 3.2,  shpsProyectados: 260, horaCorte: "10:00", riesgo: "MEDIO" },
  { idRuta: "142511007", nombreRuta: "ARXBA3_NOR_HSJ774N", idSeller: "192050107", sellerName: "TECH MELI NORTE",    volTeorico: 6.0,  capAsignada: 3.8,  shpsProyectados: 520, horaCorte: "07:30", riesgo: "ALTO"  },
  { idRuta: "142511008", nombreRuta: "ARXBA3_SUR_HSK885S", idSeller: "192050108", sellerName: "ECOMM SOLUTIONS",    volTeorico: 2.4,  capAsignada: 3.2,  shpsProyectados: 160, horaCorte: "10:00", riesgo: "BAJO"  },
];

// ── Classify helpers ───────────────────────────────────────────────────────────

function classify(shps: number): FilterTab {
  if (shps >= 30) return "BU";
  if (shps >= 15) return "UZ";
  return "ABSORBER";
}

// ── Shared small components ────────────────────────────────────────────────────

function copyText(value: string) {
  const el = document.createElement("textarea");
  el.value = value;
  el.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
  document.body.appendChild(el);
  el.focus();
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const go = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyText(text);
    setDone(true);
    setTimeout(() => setDone(false), 1600);
    toast("¡ID Seller copiado al portapapeles!", {
      duration: 2000,
      position: "bottom-center",
    });
  };
  return (
    <button
      onClick={go}
      title={`Copiar ${text}`}
      className="inline-flex items-center justify-center w-6 h-6 rounded transition-all active:scale-90"
      style={{
        background: done ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)",
        border: `1px solid ${done ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.13)"}`,
        color: done ? "#4ade80" : "#64748b",
        flexShrink: 0,
      }}
    >
      {done ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

function ActionBadge({ shps }: { shps: number }) {
  if (shps >= 30)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold whitespace-nowrap text-xs" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171", fontFamily: "'DM Mono', monospace", letterSpacing: "0.03em" }}>
        🚨 SOLICITAR BU
      </span>
    );
  if (shps >= 15)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold whitespace-nowrap text-xs" style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.35)", color: "#fb923c", fontFamily: "'DM Mono', monospace", letterSpacing: "0.03em" }}>
        🚐 ENVIAR UZ
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold whitespace-nowrap text-xs" style={{ background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.3)", color: "#9ca3af", fontFamily: "'DM Mono', monospace", letterSpacing: "0.03em" }}>
      ℹ️ ABSORBER
    </span>
  );
}

// ── Shared header ─────────────────────────────────────────────────────────────

function AppHeader({ shiftView, setShiftView, rightSlot }: {
  shiftView: ShiftView;
  setShiftView: (v: ShiftView) => void;
  rightSlot: React.ReactNode;
}) {
  const TABS = [
    { id: "AM" as ShiftView, label: "Gestión AM Preventivo", color: "#60a5fa", colorDim: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.5)" },
    { id: "PM" as ShiftView, label: "Gestión PM Reactivo",   color: "#f87171", colorDim: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.5)"  },
  ] as const;

  const activeCfg = TABS.find(t => t.id === shiftView)!;

  return (
    <header className="sticky top-0 z-50 border-b flex flex-col"
      style={{ background: "rgba(7,13,26,0.96)", borderColor: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>

      {/* Row 1 */}
      <div className="flex items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: activeCfg.colorDim, border: `1px solid ${activeCfg.border}` }}>
            {shiftView === "AM"
              ? <Sun size={16} style={{ color: activeCfg.color }} />
              : <Moon size={16} style={{ color: activeCfg.color }} />
            }
          </div>
          <div>
            <div className="font-bold tracking-tight" style={{ color: "#f1f5f9", fontSize: "15px" }}>BU &amp; UZ Control Center</div>
            <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: activeCfg.color }} />
              {shiftView === "AM" ? "Gestión AM Preventivo" : "Gestión PM Reactivo"} · High Volume Saturation Radar · 14:33
            </div>
          </div>
        </div>

        {rightSlot}

        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-lg transition-colors" style={{ color: "#475569" }}>
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: activeCfg.color }} />
          </button>
          <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#64748b", fontFamily: "'DM Mono', monospace" }}>
            <RefreshCw size={12} /> Recargar
          </button>
        </div>
      </div>

      {/* Row 2: shift nav tabs */}
      <div className="flex items-end border-t" style={{ borderColor: "rgba(255,255,255,0.05)", paddingLeft: "1.25rem" }}>
        {TABS.map(tab => {
          const isActive = shiftView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setShiftView(tab.id)}
              className="relative flex items-center gap-2 px-5 py-2.5 transition-all duration-150 select-none"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.02em",
                color: isActive ? tab.color : "#334155",
                background: isActive ? tab.colorDim : "transparent",
                borderBottom: isActive ? `2px solid ${tab.border}` : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: isActive ? tab.color : "#1e293b" }} />
              {`[ ${tab.label} ]`}
              {isActive && (
                <span className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(255,255,255,0.08)", color: tab.color, fontSize: "9px" }}>
                  ACTIVO
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}

// ── AM Screen Modificada ───────────────────────────────────────────────────────

interface AMScreenProps {
  amRows: AMRow[];
}

function AMScreen({ amRows }: AMScreenProps) {
  const [sortCol, setSortCol] = useState<"idRuta" | "shpsProyectados" | "volTeorico">("shpsProyectados");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const totalShps   = amRows.reduce((s, r) => s + r.shpsProyectados, 0);
  const totalVolTeo = amRows.reduce((s, r) => s + r.volTeorico, 0);
  const totalVolCap = amRows.reduce((s, r) => s + r.capAsignada, 0);
  const altoCount   = amRows.filter(r => r.riesgo === "ALTO").length;
  const medioCount  = amRows.filter(r => r.riesgo === "MEDIO").length;
  const bajoCount   = amRows.filter(r => r.riesgo === "BAJO").length;
  const satPct      = totalVolCap > 0 ? Math.round((totalVolTeo / totalVolCap) * 100) : 0;

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const SortIco = ({ col }: { col: typeof sortCol }) =>
    sortCol === col
      ? sortDir === "desc" ? <ChevronDown size={11} /> : <ChevronUp size={11} />
      : <ChevronDown size={11} style={{ opacity: 0.2 }} />;

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
    ALTO:  { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.35)",   color: "#f87171",  label: "🔴 ALTO"  },
    MEDIO: { bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.35)",  color: "#fb923c",  label: "🟠 MEDIO" },
    BAJO:  { bg: "rgba(34,197,94,0.1)",    border: "rgba(34,197,94,0.3)",    color: "#4ade80",  label: "🟢 BAJO"  },
  }[r]);

  const AM_COLS: { label: string; col: "idRuta" | "volTeorico" | "shpsProyectados" | null; w: string }[] = [
    { label: "ID Ruta",           col: "idRuta",          w: "68px"  },
    { label: "Nombre Ruta",       col: null,              w: "180px" },
    { label: "ID Seller",         col: null,              w: "140px" },
    { label: "Seller / Place",    col: null,              w: "180px" },
    { label: "Vol. Teórico (m³)", col: "volTeorico",      w: "130px" },
    { label: "Cap. Asignada (m³)",col: null,              w: "130px" },
    { label: "SHPs Proyectados",  col: "shpsProyectados", w: "130px" },
    { label: "Hora Corte",        col: null,              w: "100px" },
    { label: "Riesgo",            col: null,              w: "110px" },
  ];

  return (
    <div className="flex-1 px-5 py-5 flex flex-col gap-5 max-w-screen-2xl mx-auto w-full">

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Package size={16} />, label: "SHPs Proyectados",  value: totalShps.toLocaleString(), sub: "volumen teórico AM", color: "#60a5fa", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.22)" },
          { icon: <BarChart2 size={16} />, label: "Saturación de Cap.", value: `${satPct}%`, sub: `${totalVolTeo.toFixed(1)} / ${totalVolCap.toFixed(1)} m³`, color: satPct > 100 ? "#f87171" : satPct > 85 ? "#fb923c" : "#4ade80", bg: satPct > 100 ? "rgba(239,68,68,0.08)" : satPct > 85 ? "rgba(249,115,22,0.08)" : "rgba(34,197,94,0.07)", border: satPct > 100 ? "rgba(239,68,68,0.22)" : satPct > 85 ? "rgba(249,115,22,0.22)" : "rgba(34,197,94,0.2)" },
          { icon: <TrendingUp size={16} />, label: "Rutas en Riesgo ALTO", value: altoCount, sub: `${medioCount} MEDIO · ${bajoCount} BAJO`, color: "#f87171", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.22)" },
          { icon: <Clock size={16} />, label: "Sellers procesados", value: amRows.length, sub: "turno AM preventivo", color: "#94a3b8", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.15)" },
        ].map(({ icon, label, value, sub, color, bg, border }) => (
          <div key={label} className="rounded-xl px-4 py-3 flex flex-col gap-1" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-1.5 text-xs mb-0.5" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
              <span style={{ color }}>{icon}</span>
              {label}
            </div>
            <div className="text-3xl font-black tabular-nums leading-none" style={{ color, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.04em" }}>{value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Capacity bar strip */}
      <div className="rounded-xl px-5 py-4" style={{ background: "#0c1526", border: "1px solid rgba(59,130,246,0.15)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold" style={{ color: "#60a5fa", fontFamily: "'DM Mono', monospace" }}>RESUMEN DE CAPACIDAD · m³ Teórico vs. Asignado</span>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd", fontFamily: "'DM Mono', monospace" }}>
            {satPct}% saturación global
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {amRows.map(row => {
            const pct = row.capAsignada > 0 ? Math.min(100, Math.round((row.volTeorico / row.capAsignada) * 100)) : 0;
            const barColor = pct > 100 ? "#ef4444" : pct > 85 ? "#f97316" : "#3b82f6";
            return (
              <div key={row.idRuta} className="flex items-center gap-3">
                <span className="text-xs tabular-nums shrink-0 w-32 truncate" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>{row.sellerName}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 6px ${barColor}60` }} />
                </div>
                <span className="text-xs tabular-nums shrink-0 w-20 text-right" style={{ color: barColor, fontFamily: "'DM Mono', monospace" }}>
                  {row.volTeorico}m³ / {row.capAsignada}m³
                </span>
                <span className="text-xs tabular-nums shrink-0 w-10 text-right font-bold" style={{ color: barColor, fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forecasting table */}
      <div className="rounded-2xl overflow-hidden flex-1 min-h-0" style={{ background: "#0c1526", border: "1px solid rgba(59,130,246,0.15)" }}>
        <div className="px-5 py-3 flex items-center gap-3 border-b" style={{ borderColor: "rgba(59,130,246,0.1)", background: "rgba(59,130,246,0.04)" }}>
          <BarChart2 size={15} style={{ color: "#60a5fa" }} />
          <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Tabla de Pronóstico AM — Volumen Teórico</span>
          <span className="ml-auto text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd", fontFamily: "'DM Mono', monospace" }}>
            {amRows.length} rutas procesadas
          </span>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#334155" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-7 pr-3 py-1.5 rounded-lg text-xs outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1", fontFamily: "'DM Mono', monospace", width: "160px" }}
            />
          </div>
        </div>

        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 440px)" }}>
          <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: "900px" }}>
            <thead className="sticky top-0 z-10" style={{ background: "#0a1120" }}>
              <tr>
                {AM_COLS.map(({ label, col, w }) => (
                  <th key={label}
                    className={`px-4 py-3 text-left ${col ? "cursor-pointer" : ""}`}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", minWidth: w }}
                    onClick={col ? () => toggleSort(col as typeof sortCol) : undefined}
                  >
                    <span className="flex items-center gap-1 text-xs uppercase tracking-widest" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
                      {label} {col && <SortIco col={col as typeof sortCol} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-sm" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>
                    Sin resultados para esta búsqueda
                  </td>
                </tr>
              )}
              {filtered.map((row, idx) => {
                const rs = riesgoStyle(row.riesgo);
                const pct = row.capAsignada > 0 ? Math.min(100, Math.round((row.volTeorico / row.capAsignada) * 100)) : 0;
                const barColor = pct > 100 ? "#ef4444" : pct > 85 ? "#f97316" : "#3b82f6";
                const accent = pct > 100 ? "#ef4444" : pct > 85 ? "#f97316" : "#3b82f6";
                return (
                  <tr key={row.idRuta} className="group transition-colors"
                    style={{
                      borderLeft: `3px solid ${accent}`,
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                    }}
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold tabular-nums" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{row.idRuta}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold" style={{ color: "#93c5fd", fontFamily: "'DM Mono', monospace" }}>{row.nombreRuta}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs tabular-nums font-semibold" style={{ color: "#e2e8f0", fontFamily: "'DM Mono', monospace" }}>{row.idSeller}</span>
                        <CopyBtn text={row.idSeller} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium" style={{ color: "#f1f5f9", fontSize: "13px" }}>{row.sellerName}</span>
                    </td>
                    {/* Vol. Teórico with bar */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="font-black tabular-nums" style={{ color: barColor, fontFamily: "'DM Mono', monospace", fontSize: "16px", letterSpacing: "-0.04em" }}>{row.volTeorico}m³</span>
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                      </div>
                    </td>
                    {/* Cap. Asignada */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm tabular-nums font-semibold" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{row.capAsignada}m³</span>
                    </td>
                    {/* SHPs Proyectados */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span className="font-black tabular-nums leading-none" style={{ color: "#60a5fa", fontFamily: "'DM Mono', monospace", fontSize: "20px", letterSpacing: "-0.04em" }}>{row.shpsProyectados}</span>
                        <span className="text-xs rounded-md px-2 py-0.5" style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", fontFamily: "'DM Mono', monospace", fontSize: "9px" }}>SHPs</span>
                      </div>
                    </td>
                    {/* Hora Corte */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold tabular-nums" style={{ color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>{row.horaCorte}</span>
                    </td>
                    {/* Riesgo */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                        style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color, fontFamily: "'DM Mono', monospace" }}>
                        {rs.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-2.5 border-t flex items-center justify-between flex-wrap gap-2"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "#080f1d" }}>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>
            <span>{filtered.length} filas en vista</span>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
            <span>{filtered.reduce((s,r)=>s+r.shpsProyectados,0).toLocaleString()} SHPs proyectados</span>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
            <span style={{ color: "#f87171" }}>{altoCount} rutas en riesgo alto</span>
          </div>
          <div className="flex items-center gap-2">
            {[
              { color: "#ef4444", label: "> 100% cap." },
              { color: "#f97316", label: "85–100% cap." },
              { color: "#3b82f6", label: "< 85% cap." },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pb-2 flex items-center justify-between text-xs" style={{ color: "#1e293b", fontFamily: "'DM Mono', monospace" }}>
        <span>LogiPredict · BU &amp; UZ Control Center · v2.4.1</span>
        <span>Turno AM · 08:00 · {amRows.length} sellers procesados</span>
      </div>
    </div>
  );
}

// ── Assign BU input modal ──────────────────────────────────────────────────────

interface DispatchModalProps {
  seller: { name: string; id: string; shps: number } | null;
  onClose: () => void;
  onConfirm: (buRouteId: string) => void;
}

function DispatchModal({ seller, onClose, onConfirm }: DispatchModalProps) {
  const [buRouteId, setBuRouteId] = useState("");
  const [error, setError] = useState(false);

  if (!seller) return null;

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleConfirm = () => {
    if (!buRouteId.trim()) { setError(true); return; }
    onConfirm(buRouteId.trim());
    onClose();
  };

  const handleClose = () => {
    setBuRouteId("");
    setError(false);
    onClose();
  };

  return (
    <div
      onClick={handleBackdrop}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "#0d1527",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
          width: "clamp(320px, 90vw, 460px)",
        }}
      >
        {/* Red top accent bar */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #b91c1c, #ef4444, #f87171)" }} />

        <div className="px-7 py-6 flex flex-col gap-5">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <Truck size={18} style={{ color: "#f87171" }} />
              </div>
              <div>
                <div className="font-bold" style={{ color: "#f1f5f9", fontSize: "14px", letterSpacing: "-0.01em" }}>
                  Asignar Unidad de Respaldo (BU)
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>
                  Turno PM · Despacho reactivo
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569" }}
            >
              <AlertTriangle size={13} />
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

          {/* Seller context pill */}
          <div className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs uppercase tracking-widest" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>Vendedor afectado</span>
              <span className="font-semibold" style={{ color: "#f1f5f9", fontSize: "13px" }}>{seller.name}</span>
              <span className="text-xs tabular-nums" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>{seller.id}</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg font-bold"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontFamily: "'DM Mono', monospace" }}>
              🚨 {seller.shps} SHPs
            </span>
          </div>

          {/* Input field */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8", fontFamily: "'DM Mono', monospace" }}>
              Ingrese el ID de Ruta del BU asignado
            </label>
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={buRouteId}
                onChange={e => { setBuRouteId(e.target.value); setError(false); }}
                onKeyDown={e => e.key === "Enter" && handleConfirm()}
                placeholder="Ej: 142513999..."
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${error ? "rgba(239,68,68,0.6)" : buRouteId ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)"}`,
                  color: "#f1f5f9",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "13px",
                  letterSpacing: "0.04em",
                  boxShadow: error ? "0 0 0 3px rgba(239,68,68,0.08)" : buRouteId ? "0 0 0 3px rgba(59,130,246,0.08)" : "none",
                }}
              />
              {buRouteId && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ background: "#3b82f6", boxShadow: "0 0 6px rgba(59,130,246,0.6)" }} />
              )}
            </div>
            {error && (
              <span className="text-xs" style={{ color: "#f87171", fontFamily: "'DM Mono', monospace" }}>
                ⚠ Campo obligatorio — ingrese el ID de ruta del BU
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80 active:scale-95"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#64748b", fontFamily: "'DM Mono', monospace" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-[2] py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
                border: "1px solid rgba(34,197,94,0.35)",
                color: "#ffffff",
                fontFamily: "'DM Mono', monospace",
                boxShadow: "0 4px 20px rgba(34,197,94,0.25)",
              }}
            >
              <CheckCircle size={14} />
              Confirmar Despacho
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── PM Screen Modificada ───────────────────────────────────────────────────────

interface PMScreenProps {
  pmRows: PMRow[];
}

function PMScreen({ pmRows }: PMScreenProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("BU");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<"idRuta" | "shpsCaidos">("shpsCaidos");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [modalSeller, setModalSeller] = useState<{ name: string; id: string; shps: number; key: string } | null>(null);

  const buRows  = pmRows.filter(r => classify(r.shpsCaidos) === "BU");
  const uzRows  = pmRows.filter(r => classify(r.shpsCaidos) === "UZ");
  const absRows = pmRows.filter(r => classify(r.shpsCaidos) === "ABSORBER");
  const multicuenta = pmRows.filter(r => r.isMulticuenta).length;
  const totalSHPs = pmRows.reduce((s, r) => s + r.shpsCaidos, 0);

  const tabRows = activeTab === "BU" ? buRows : activeTab === "UZ" ? uzRows : absRows;

  const filtered = tabRows
    .filter(r =>
      !search ||
      r.sellerName.toLowerCase().includes(search.toLowerCase()) ||
      r.idSeller.includes(search) ||
      r.idRuta.includes(search) ||
      r.nombreRuta.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const cmp = sortCol === "shpsCaidos"
        ? a.shpsCaidos - b.shpsCaidos
        : Number(a.idRuta) - Number(b.idRuta);
      return sortDir === "desc" ? -cmp : cmp;
    });

  const handleAssign = (key: string) => {
    setLoading(prev => new Set([...prev, key]));
    setTimeout(() => {
      setLoading(prev => { const s = new Set(prev); s.delete(key); return s; });
      setAssigned(prev => new Set([...prev, key]));
    }, 1200);
  };

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const SortIco = ({ col }: { col: typeof sortCol }) =>
    sortCol === col
      ? sortDir === "desc" ? <ChevronDown size={11} /> : <ChevronUp size={11} />
      : <ChevronDown size={11} style={{ opacity: 0.2 }} />;

  const TAB_CFG = {
    BU:       { emoji: "🚨", label: "Solicitar BU",       sublabel: "≥ 30 SHPs",  count: buRows.length,  totalShps: buRows.reduce((s,r)=>s+r.shpsCaidos,0),  color: "#f87171", colorDim: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.45)", borderDim: "rgba(239,68,68,0.2)",   glow: "rgba(239,68,68,0.18)"  },
    UZ:       { emoji: "🚐", label: "Unidad en Zona/UZ", sublabel: "15–29 SHPs", count: uzRows.length,  totalShps: uzRows.reduce((s,r)=>s+r.shpsCaidos,0),  color: "#fb923c", colorDim: "rgba(249,115,22,0.15)",  border: "rgba(249,115,22,0.45)", borderDim: "rgba(249,115,22,0.2)",  glow: "rgba(249,115,22,0.18)" },
    ABSORBER: { emoji: "ℹ️", label: "Bajo Volumen",      sublabel: "< 15 SHPs",  count: absRows.length, totalShps: absRows.reduce((s,r)=>s+r.shpsCaidos,0), color: "#6b7280", colorDim: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.4)", borderDim: "rgba(107,114,128,0.15)", glow: "rgba(107,114,128,0.1)" },
  } as const;

  const cfg = TAB_CFG[activeTab];

  return (
    <>
    <DispatchModal
      seller={modalSeller}
      onClose={() => setModalSeller(null)}
      onConfirm={(_buRouteId) => {
        if (modalSeller) {
          handleAssign(modalSeller.key);
          toast("¡BU registrado con éxito! Ruta vinculada al Seller.", {
            duration: 3000,
            position: "bottom-center",
          });
        }
      }}
    />
    <div className="flex-1 px-5 py-5 flex flex-col gap-5 max-w-screen-2xl mx-auto w-full">

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "🚨 Solicitar BU",  value: buRows.length,  shps: buRows.reduce((s,r)=>s+r.shpsCaidos,0),  color: "#f87171", bg: "rgba(239,68,68,0.08)",    border: "rgba(239,68,68,0.25)"    },
          { label: "🚐 Enviar UZ",     value: uzRows.length,  shps: uzRows.reduce((s,r)=>s+r.shpsCaidos,0),  color: "#fb923c", bg: "rgba(249,115,22,0.08)",   border: "rgba(249,115,22,0.25)"   },
          { label: "ℹ️ Absorber",      value: absRows.length, shps: absRows.reduce((s,r)=>s+r.shpsCaidos,0), color: "#6b7280", bg: "rgba(107,114,128,0.07)",  border: "rgba(107,114,128,0.2)"   },
          { label: "⚠️ Multicuenta",   value: multicuenta,    shps: null,                                     color: "#fbbf24", bg: "rgba(251,191,36,0.07)",   border: "rgba(251,191,36,0.25)"   },
        ].map(({ label, value, shps, color, bg, border }) => (
          <div key={label} className="rounded-xl px-4 py-3" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="text-xs mb-1" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>{label}</div>
            <div className="text-3xl font-black tabular-nums leading-none" style={{ color, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.04em" }}>{value}</div>
            {shps !== null && <div className="text-xs mt-1" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>{shps.toLocaleString()} SHPs Pendientes</div>}
          </div>
        ))}
      </div>

      {/* Segmented filter + search */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {(["BU", "UZ", "ABSORBER"] as FilterTab[]).map(tab => {
          const t = TAB_CFG[tab];
          const active = activeTab === tab;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex items-center gap-3 px-5 py-3 rounded-xl font-semibold transition-all duration-150 select-none flex-1 sm:flex-none"
              style={{
                background: active ? t.colorDim : "rgba(255,255,255,0.03)",
                border: `1.5px solid ${active ? t.border : "rgba(255,255,255,0.08)"}`,
                color: active ? t.color : "#475569",
                boxShadow: active ? `0 0 20px ${t.glow}` : "none",
                fontSize: "13px",
              }}
            >
              <span style={{ fontSize: "16px" }}>{t.emoji}</span>
              <span>{t.label}</span>
              <span className="text-xs px-2 py-0.5 rounded-md"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", background: active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)", color: active ? t.color : "#334155" }}>
                {t.sublabel}
              </span>
              <span className="ml-auto sm:ml-2 min-w-[28px] h-6 rounded-md flex items-center justify-center text-xs font-black"
                style={{ background: active ? t.border : "rgba(255,255,255,0.07)", color: active ? t.color : "#334155", fontFamily: "'DM Mono', monospace" }}>
                {t.count}
              </span>
            </button>
          );
        })}
        <div className="flex-1 relative min-w-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#334155" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar seller, ID, ruta..."
            className="w-full h-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", color: "#cbd5e1", fontFamily: "'DM Mono', monospace", fontSize: "12px" }} />
        </div>
      </div>

      {/* Context bar */}
      <div className="flex items-center justify-between px-4 py-2 rounded-lg"
        style={{ background: `${cfg.colorDim.replace("0.15","0.07")}`, border: `1px solid ${cfg.borderDim}` }}>
        <div className="flex items-center gap-2 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>
          <span style={{ color: cfg.color }}>{cfg.emoji} {cfg.label.toUpperCase()}</span>
          <span style={{ color: "#334155" }}>·</span>
          <span style={{ color: "#475569" }}>{filtered.length} filas</span>
          <span style={{ color: "#334155" }}>·</span>
          <span style={{ color: cfg.color, fontWeight: 700 }}>{cfg.totalShps.toLocaleString()} SHPs Pendientes totales</span>
        </div>
        <div className="text-xs" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>Ordenado por SHPs ↓</div>
      </div>

      {/* Main table */}
      <div className="rounded-2xl overflow-hidden flex-1 min-h-0" style={{ background: "#0c1526", border: `1px solid ${cfg.borderDim}` }}>
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 380px)" }}>
          <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: "900px" }}>
            <thead className="sticky top-0 z-10" style={{ background: "#0a1120" }}>
              <tr>
                <th className="px-4 py-3 text-left cursor-pointer" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", width: "68px" }} onClick={() => toggleSort("idRuta")}>
                  <span className="flex items-center gap-1 text-xs uppercase tracking-widest" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>ID Ruta <SortIco col="idRuta" /></span>
                </th>
                <th className="px-4 py-3 text-left" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", minWidth: "180px" }}>
                  <span className="text-xs uppercase tracking-widest" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>Nombre Ruta</span>
                </th>
                <th className="px-4 py-3 text-left" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", minWidth: "180px" }}>
                  <span className="text-xs uppercase tracking-widest" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>ID Seller</span>
                </th>
                <th className="px-4 py-3 text-left" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", minWidth: "240px" }}>
                  <span className="text-xs uppercase tracking-widest" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>Seller / Place</span>
                </th>
                <th className="px-4 py-3 text-center cursor-pointer" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", width: "120px" }} onClick={() => toggleSort("shpsCaidos")}>
                  <span className="flex items-center justify-center gap-1 text-xs uppercase tracking-widest" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>SHPs Pendientes <SortIco col="shpsCaidos" /></span>
                </th>
                <th className="px-4 py-3 text-left" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", minWidth: "170px" }}>
                  <span className="text-xs uppercase tracking-widest" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>Acción Operativa</span>
                </th>
                <th className="px-4 py-3 text-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", width: "140px" }}>
                  <span className="text-xs uppercase tracking-widest" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>Despacho</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center text-sm" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>Sin resultados para esta búsqueda</td></tr>
              )}
              {filtered.map((row, idx) => {
                const isAssigned = assigned.has(row.idRuta + row.idSeller);
                const isLoading  = loading.has(row.idRuta + row.idSeller);
                const key = row.idRuta + row.idSeller;
                const shpColor = row.shpsCaidos >= 30 ? "#f87171" : row.shpsCaidos >= 15 ? "#fb923c" : "#6b7280";
                const shpBg    = row.shpsCaidos >= 30 ? "rgba(239,68,68,0.1)" : row.shpsCaidos >= 15 ? "rgba(249,115,22,0.1)" : "rgba(107,114,128,0.08)";
                const accent   = row.shpsCaidos >= 30 ? "#ef4444" : row.shpsCaidos >= 15 ? "#f97316" : "#4b5563";
                const allIds   = [row.idSeller, ...(row.extraIds ?? [])].join(", ");
                return (
                  <tr key={key} className="group transition-colors"
                    style={{ borderLeft: `3px solid ${accent}`, borderBottom: "1px solid rgba(255,255,255,0.04)", background: isAssigned ? "rgba(34,197,94,0.04)" : idx % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent", opacity: isAssigned ? 0.55 : 1 }}>
                    <td className="px-4 py-3.5"><span className="text-xs font-bold tabular-nums" style={{ color: "#64748b", fontFamily: "'DM Mono', monospace" }}>{row.idRuta}</span></td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold" style={{ color: "#93c5fd", fontFamily: "'DM Mono', monospace" }}>{row.nombreRuta}</span>
                        {row.extraRoutes && row.extraRoutes.map(r => <span key={r} className="text-xs" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>{r}</span>)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs tabular-nums font-semibold" style={{ color: "#e2e8f0", fontFamily: "'DM Mono', monospace", letterSpacing: "0.03em" }}>{row.idSeller}</span>
                          <CopyBtn text={allIds} />
                        </div>
                        {row.extraIds && row.extraIds.map(id => (
                          <div key={id} className="flex items-center gap-1.5">
                            <span className="text-xs tabular-nums" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>{id}</span>
                            <CopyBtn text={id} />
                          </div>
                        ))}
                        {row.isMulticuenta && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs w-fit"
                            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", fontFamily: "'DM Mono', monospace", fontSize: "10px" }}>
                            <Users size={9} /> {row.accountCount} cuentas
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium" style={{ color: "#f1f5f9", fontSize: "13px" }}>{row.sellerName}</span>
                        {row.isMulticuenta && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs shrink-0"
                            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", fontFamily: "'DM Mono', monospace", fontSize: "9px" }}>
                            ⚠ MULTI
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span className="font-black tabular-nums leading-none" style={{ color: shpColor, fontFamily: "'DM Mono', monospace", fontSize: "22px", letterSpacing: "-0.04em" }}>{row.shpsCaidos}</span>
                        <span className="text-xs rounded-md px-2 py-0.5" style={{ background: shpBg, color: shpColor, fontFamily: "'DM Mono', monospace", fontSize: "9px" }}>SHPs</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><ActionBadge shps={row.shpsCaidos} /></td>
                    <td className="px-4 py-3.5 text-center">
                      {isAssigned ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
                          <CheckCircle size={13} style={{ color: "#4ade80" }} />
                          <span className="text-xs font-semibold" style={{ color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>Asignado</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setModalSeller({ name: row.sellerName, id: row.idSeller, shps: row.shpsCaidos, key })}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                          style={{ background: `linear-gradient(135deg, ${accent}20, ${accent}12)`, border: `1.5px solid ${accent}60`, color: shpColor, fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.02em", cursor: isLoading ? "wait" : "pointer", boxShadow: `0 0 8px ${accent}20`, whiteSpace: "nowrap" }}>
                          {isLoading
                            ? <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin" style={{ borderColor: `${shpColor}30`, borderTopColor: shpColor }} />
                            : <Truck size={12} />}
                          <span>{isLoading ? "Despachando..." : "Despachar BU"}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-5 py-2.5 border-t flex items-center justify-between flex-wrap gap-2" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#080f1d" }}>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>
            <span>{filtered.length} filas en vista</span>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
            <span>{filtered.reduce((s,r)=>s+r.shpsCaidos,0).toLocaleString()} SHPs en este segmento</span>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
            <span style={{ color: "#22c55e" }}>{assigned.size} unidades asignadas</span>
          </div>
          <div className="flex items-center gap-2">
            {[{ color: "#ef4444", label: "BU ≥ 30" }, { color: "#f97316", label: "UZ 15–29" }, { color: "#6b7280", label: "Absorber < 15" }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "#334155", fontFamily: "'DM Mono', monospace" }}>
                <div className="w-2 h-2 rounded-full" style={{ background: color }} /><span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multicuenta radar */}
      {pmRows.some(r => r.isMulticuenta) && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#0c1526", border: "1px solid rgba(251,191,36,0.2)" }}>
          <div className="px-5 py-3 flex items-center gap-3 border-b" style={{ borderColor: "rgba(251,191,36,0.15)", background: "rgba(251,191,36,0.05)" }}>
            <Layers size={15} style={{ color: "#fbbf24" }} />
            <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Radar Operativo PM — Multicuenta Consolidado</span>
          </div>
        </div>
      )}

      <div className="pb-2 flex items-center justify-between text-xs" style={{ color: "#1e293b", fontFamily: "'DM Mono', monospace" }}>
        <span>LogiPredict · BU &amp; UZ Control Center · v2.4.1</span>
        <span>Turno PM · 14:33 · {pmRows.length} sellers procesados</span>
      </div>
    </div>
    </>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [shiftView, setShiftView] = useState<ShiftView>("PM");
  
  const [pmRows, setPmRows] = useState<PMRow[]>(PM_ROWS);
  const [amRows, setAmRows] = useState<AMRow[]>(AM_ROWS);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // ⚠️ Recordá cambiar esta URL por la URL pública real de tu backend en Render
      const response = await fetch('https://tu-servidor-python.render.com/analizar-pm', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!result.error) {
        const mappedRows: PMRow[] = result.map((item: any) => ({
          idRuta: item.idRuta,
          nombreRuta: item.nombreRuta,
          idSeller: item.idSeller,
          sellerName: item.vendedor,
          shpsCaidos: item.pendientes,
          isMulticuenta: false
        }));
        
        setPmRows(mappedRows);
        toast.success("¡Archivo de First Mile procesado con éxito!");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al procesar el archivo en el motor de Python.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSHPs   = pmRows.reduce((s, r) => s + r.shpsCaidos, 0);
  const multicuenta = pmRows.filter(r => r.isMulticuenta).length;

  const headerStats = shiftView === "PM"
    ? [
        { label: "Total sellers",        value: pmRows.length,               color: "#94a3b8" },
        { label: "Total SHPs Pendientes",value: totalSHPs.toLocaleString(), color: "#f87171" },
        { label: "Multicuenta",          value: multicuenta,               color: "#fbbf24" },
      ]
    : [
        { label: "Rutas AM",             value: amRows.length,                                                      color: "#94a3b8" },
        { label: "SHPs Proyectados",     value: amRows.reduce((s,r)=>s+r.shpsProyectados,0).toLocaleString(),         color: "#60a5fa" },
        { label: "Riesgo Alto",          value: amRows.filter(r=>r.riesgo==="ALTO").length,                           color: "#f87171" },
      ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#070d1a", fontFamily: "'Inter', sans-serif" }}>
      <Toaster position="bottom-center" />
      
      {isLoading && (
        <div className="w-full h-1 bg-red-600 animate-pulse sticky top-0 z-[100]" />
      )}

      <AppHeader
        shiftView={shiftView}
        setShiftView={setShiftView}
        rightSlot={
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg cursor-pointer transition-all hover:opacity-80 shrink-0"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171", fontFamily: "'DM Mono', monospace" }}>
              <Truck size={12} />
              {isLoading ? "Procesando..." : "Cargar Archivo diario"}
              <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} className="hidden" disabled={isLoading} />
            </label>

            <div className="hidden md:flex items-center gap-5">
              {headerStats.map(({ label, value, color }) => (
                <div key={label} className="text-right">
                  <div className="text-xs" style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>{label}</div>
                  <div className="font-bold tabular-nums" style={{ color, fontFamily: "'DM Mono', monospace", fontSize: "15px" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        }
      />
      {shiftView === "AM" ? <AMScreen amRows={amRows} /> : <PMScreen pmRows={pmRows} />}
    </div>
  );
}
