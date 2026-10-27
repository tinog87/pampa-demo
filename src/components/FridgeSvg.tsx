import type { EstadoHeladera } from "@/lib/types";

type Slot = "pampa" | "otra" | "empty";

const LAYOUT: Record<EstadoHeladera, Slot[][]> = {
  llena_pampa: [
    ["pampa", "pampa", "pampa", "pampa", "pampa", "pampa"],
    ["pampa", "pampa", "pampa", "pampa", "pampa", "pampa"],
    ["pampa", "pampa", "pampa", "pampa", "pampa", "pampa"],
    ["pampa", "pampa", "pampa", "pampa", "pampa", "pampa"],
  ],
  otra_marca: [
    ["pampa", "pampa", "otra", "otra", "otra", "otra"],
    ["pampa", "pampa", "pampa", "otra", "otra", "otra"],
    ["pampa", "pampa", "pampa", "pampa", "otra", "otra"],
    ["pampa", "pampa", "pampa", "pampa", "pampa", "otra"],
  ],
  vacia: [
    ["pampa", "empty", "pampa", "empty", "empty", "empty"],
    ["empty", "pampa", "empty", "empty", "pampa", "empty"],
    ["pampa", "empty", "empty", "empty", "empty", "empty"],
    ["empty", "empty", "pampa", "empty", "empty", "empty"],
  ],
  rota: [
    ["empty", "empty", "empty", "empty", "empty", "empty"],
    ["empty", "empty", "empty", "empty", "empty", "empty"],
    ["empty", "empty", "empty", "empty", "empty", "empty"],
    ["empty", "empty", "empty", "empty", "empty", "empty"],
  ],
  sin_heladera: [],
};

const FILL: Record<Slot, string> = {
  pampa: "#0a0a0a",
  otra: "none",
  empty: "#e4e4e7",
};

export function FridgeSvg({ estado }: { estado: EstadoHeladera }) {
  if (estado === "sin_heladera") {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg border border-dashed border-line-strong bg-card text-center">
        <span className="px-6 text-sm text-muted">
          Sin heladera.
          <br />
          Candidato a recibir una liberada.
        </span>
      </div>
    );
  }

  const rows = LAYOUT[estado];
  const W = 240;
  const H = 320;
  const padX = 24;
  const padTop = 20;
  const padBottom = 24;
  const gridW = W - padX * 2;
  const gridH = H - padTop - padBottom;
  const rowH = gridH / rows.length;
  const cols = rows[0].length;
  const colW = gridW / cols;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="aspect-[3/4] w-full rounded-lg border border-line bg-paper"
      role="img"
      aria-label={`Heladera: ${estado}`}
    >
      {/* Marco */}
      <rect x={6} y={6} width={W - 12} height={H - 12} rx={10} fill="#fafafa" stroke="#d4d4d8" />
      {/* Estantes + botellas */}
      {rows.map((row, r) => {
        const y = padTop + r * rowH;
        return (
          <g key={r}>
            <line x1={padX} y1={y + rowH - 3} x2={W - padX} y2={y + rowH - 3} stroke="#e4e4e7" strokeWidth={1} />
            {row.map((slot, c) => {
              const bx = padX + c * colW + colW * 0.2;
              const bw = colW * 0.6;
              const bh = rowH * 0.62;
              const by = y + rowH - 3 - bh;
              if (slot === "otra") {
                return (
                  <rect
                    key={c}
                    x={bx}
                    y={by}
                    width={bw}
                    height={bh}
                    rx={2}
                    fill="#fffbeb"
                    stroke="#d97706"
                    strokeWidth={1.2}
                    strokeDasharray="3 2"
                  />
                );
              }
              return (
                <rect key={c} x={bx} y={by} width={bw} height={bh} rx={2} fill={FILL[slot]} />
              );
            })}
          </g>
        );
      })}
      {/* Estado apagado */}
      {estado === "rota" ? (
        <g>
          <rect x={6} y={6} width={W - 12} height={H - 12} rx={10} fill="#0a0a0a" opacity={0.04} />
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={13} fill="#b91c1c" fontWeight={600}>
            No enfría / apagada
          </text>
        </g>
      ) : null}
    </svg>
  );
}
