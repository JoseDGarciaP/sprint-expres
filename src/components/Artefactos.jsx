import { DIAS_SPRINT } from '../data/content.js'

// Sprint Burndown Chart: trabajo restante al final de cada día contra la línea ideal.
export function Burndown({ burndown, actual, compacto = false }) {
  const total = burndown[0]
  const W = 300
  const H = compacto ? 120 : 150
  const m = { l: 26, r: 10, t: 10, b: 22 }
  const x = (d) => m.l + (d / DIAS_SPRINT) * (W - m.l - m.r)
  const y = (v) => m.t + (1 - v / total) * (H - m.t - m.b)
  const puntos = burndown.map((v, d) => [x(d), y(v)])
  // Punto hueco: cómo terminaría el día de hoy con los movimientos hechos hasta ahora.
  const hoy = actual != null && burndown.length <= DIAS_SPRINT ? [x(burndown.length), y(actual)] : null

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`Burndown: quedan ${actual ?? burndown.at(-1)} de ${total} pasos de trabajo`}
    >
      {[0, total / 2, total].map((v) => (
        <g key={v}>
          <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} stroke="var(--color-linea)" />
          <text x={m.l - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="var(--color-gris)">{v}</text>
        </g>
      ))}
      {Array.from({ length: DIAS_SPRINT + 1 }, (_, d) => (
        <text key={d} x={x(d)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--color-gris)">
          {d === 0 ? 'Inicio' : `D${d}`}
        </text>
      ))}
      <line x1={x(0)} y1={y(total)} x2={x(DIAS_SPRINT)} y2={y(0)} stroke="var(--color-gris)" strokeDasharray="4 4" />
      <polyline points={puntos.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--color-rojo)" strokeWidth="2.5" />
      {hoy && (
        <line x1={puntos.at(-1)[0]} y1={puntos.at(-1)[1]} x2={hoy[0]} y2={hoy[1]} stroke="var(--color-rojo)" strokeWidth="2" strokeDasharray="3 3" />
      )}
      {puntos.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r="3.5" fill="var(--color-rojo)" />
      ))}
      {hoy && <circle cx={hoy[0]} cy={hoy[1]} r="4" fill="#fff" stroke="var(--color-rojo)" strokeWidth="2" />}
    </svg>
  )
}

export function ImpedimentLog({ impedimentos }) {
  if (!impedimentos.length) {
    return <p className="text-sm text-gris">Sin impedimentos registrados todavía.</p>
  }
  return (
    <ol className="grid gap-1.5 text-sm">
      {impedimentos.map((i) => (
        <li key={`${i.dia}-${i.titulo}`} className="grid grid-cols-[2.2rem_1fr_auto] items-baseline gap-2">
          <span className="font-bold text-gris">D{i.dia}</span>
          <span className="font-semibold">{i.titulo}</span>
          <span className={i.ok ? 'text-acierto' : 'text-rojo'}>{i.ok ? 'Bien gestionado' : 'Afectó al equipo'}</span>
        </li>
      ))}
    </ol>
  )
}

export default function Artefactos({ state, actual }) {
  return (
    <section aria-label="Artefactos del sprint" className="mt-5 grid gap-px overflow-hidden rounded-lg border border-linea bg-linea md:grid-cols-2">
      <div className="bg-white p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display font-semibold">Sprint Burndown Chart</h2>
          <p className="text-xs text-gris">
            <span className="text-rojo">━</span> real <span className="ml-2">┅</span> ideal
          </p>
        </div>
        <p className="mb-2 text-xs text-gris">Pasos de trabajo que faltan para terminar todas las tareas</p>
        <Burndown burndown={state.burndown} actual={actual} compacto />
      </div>
      <div className="bg-white p-4">
        <h2 className="font-display font-semibold">Impediment Log</h2>
        <p className="mb-3 text-xs text-gris">Lo que pasó durante el sprint y cómo lo manejó el equipo</p>
        <ImpedimentLog impedimentos={state.impedimentos} />
      </div>
    </section>
  )
}
