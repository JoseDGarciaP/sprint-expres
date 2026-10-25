import { COLUMNAS, HISTORIAS, LIMITE_EN_PROGRESO } from '../data/content.js'

const historia = (id) => HISTORIAS.find((h) => h.id === id)
const siguiente = (col) => COLUMNAS[COLUMNAS.findIndex((c) => c.id === col) + 1]

export default function Tablero({ tareas, dia, puedeMover, onMover, recien }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-linea bg-linea lg:grid-cols-4">
      {COLUMNAS.map((col) => {
        const enCol = tareas.filter((t) => t.col === col.id)
        const lleno = col.id === 'doing' && enCol.length >= LIMITE_EN_PROGRESO
        return (
          <section key={col.id} className="flex min-h-40 flex-col bg-tablero p-2.5 sm:min-h-72 sm:p-3">
            <header className="mb-3 flex items-baseline justify-between gap-2 border-b-2 border-tinta pb-1.5">
              <div>
                <h3 className="font-display text-[15px] font-semibold sm:text-base">{col.nombre}</h3>
                <p className="text-xs text-gris">{col.ayuda}</p>
              </div>
              <span className={`font-display text-sm font-semibold ${lleno ? 'text-rojo' : 'text-gris'}`}>
                {col.id === 'doing' ? `${enCol.length}/${LIMITE_EN_PROGRESO}` : enCol.length}
              </span>
            </header>

            <div className="grid gap-3">
              {enCol.map((t) => {
                const h = historia(t.historia)
                const bloqueada = t.bloqueadaDia === dia
                const sig = siguiente(t.col)
                const movible = puedeMover && sig && !bloqueada
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!puedeMover || !sig}
                    onClick={() => onMover(t.id)}
                    aria-label={`${t.titulo}. ${sig ? `Mover a ${sig.nombre}` : 'Terminada'}${bloqueada ? '. Bloqueada hoy' : ''}`}
                    className={`nota nota-${h.color} relative min-h-16 rounded-[3px] p-2.5 sm:min-h-24 text-left disabled:cursor-default ${movible ? 'movible cursor-pointer' : ''} ${bloqueada ? 'bloqueada' : ''} ${recien === t.id ? 'recien' : ''}`}
                  >
                    <span className="block text-[11px] font-bold text-tinta/70">
                      {h.id}
                      <span className="hidden sm:inline"> · {h.titulo}</span>
                    </span>
                    <span className="mt-1 block font-display text-sm leading-tight font-semibold sm:text-[15px]">
                      {t.titulo}
                    </span>
                    {movible && (
                      <span className="mt-2 hidden text-[11px] font-bold text-tinta/60 sm:block">Mover a {sig.nombre} ›</span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
