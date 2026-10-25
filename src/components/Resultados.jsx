import { useEffect, useState } from 'react'
import { DIAS_SPRINT, PUNTOS } from '../data/content.js'
import { PREGUNTAS_REVISION } from '../game/engine.js'
import { obtenerRanking } from '../lib/storage.js'
import { Burndown } from './Artefactos.jsx'

export function formatoDuracion(seg) {
  const m = Math.floor(seg / 60)
  const s = seg % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function Resultados({ r, jugador, estadoGuardado, onReintentar, onJugarDeNuevo }) {
  const [ranking, setRanking] = useState(null)

  useEffect(() => {
    if (estadoGuardado !== 'ok') return
    let vivo = true
    const cargar = () =>
      obtenerRanking(10)
        .then((filas) => vivo && setRanking(filas))
        .catch(() => vivo && setRanking((prev) => prev ?? []))
    cargar()
    const t = setInterval(cargar, 20000) // el ranking se mueve mientras los demás terminan
    return () => {
      vivo = false
      clearInterval(t)
    }
  }, [estadoGuardado])

  const filas = [
    ['Tareas terminadas', `${r.terminadas} de ${r.totalTareas}`, r.terminadas * PUNTOS.tareaTerminada],
    ['Daily Standup', `${r.standup} de ${DIAS_SPRINT}`, r.standup * PUNTOS.standupCorrecto],
    ['Decisiones del día', `${r.eventos} de ${DIAS_SPRINT}`, r.eventos * PUNTOS.eventoCorrecto],
    ['Revisión del sprint', `${r.revision} de ${PREGUNTAS_REVISION}`, r.revision * PUNTOS.revisionCorrecta],
  ]
  const soyYo = (f) => f.nombre.toLowerCase() === jugador.nombre.toLowerCase()

  return (
    <div className="min-h-svh">
      <div className="h-2 bg-rojo" />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <section>
          <p className="font-display text-sm font-semibold text-gris">Sprint terminado, {jugador.nombre.split(' ')[0]}</p>
          <p className="titulo mt-2 text-7xl text-rojo sm:text-8xl">{r.puntaje}</p>
          <p className="mt-1 text-gris">
            puntos de {r.maximo} posibles, en {formatoDuracion(r.duracionSeg)} min
          </p>

          <table className="mt-8 w-full max-w-md text-left">
            <tbody>
              {filas.map(([nombre, detalle, pts]) => (
                <tr key={nombre} className="border-b border-linea">
                  <th scope="row" className="py-2.5 font-semibold">{nombre}</th>
                  <td className="py-2.5 text-gris">{detalle}</td>
                  <td className="py-2.5 text-right font-display font-semibold">{pts}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 max-w-md">
            <h2 className="font-display font-semibold">Tu Sprint Burndown Chart</h2>
            <Burndown burndown={r.burndown} />
            {r.pendientes.length > 0 ? (
              <p className="mt-2 text-[15px] leading-relaxed">
                Quedaron pendientes: {r.pendientes.map((t) => t.titulo).join(', ')}. Vuelven al Backlog Priorizado del
                Producto y se priorizan para el siguiente sprint.
              </p>
            ) : (
              <p className="mt-2 text-[15px]">Terminaste todas las tareas del sprint.</p>
            )}
          </div>

          <div className="mt-6 text-sm" aria-live="polite">
            {estadoGuardado === 'guardando' && <p className="text-gris">Guardando tu resultado…</p>}
            {estadoGuardado === 'ok' && <p className="font-semibold text-acierto">Resultado guardado.</p>}
            {estadoGuardado === 'error' && (
              <div className="rounded-md bg-[#fbe9e9] p-3 text-vino">
                <p className="font-semibold">No se pudo guardar el resultado. Revisa la conexión a internet.</p>
                <button type="button" onClick={onReintentar} className="mt-2 font-bold underline">
                  Intentar de nuevo
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onJugarDeNuevo}
            className="mt-6 rounded-md border-2 border-tinta px-5 py-2.5 font-display font-semibold hover:bg-tinta hover:text-white"
          >
            Jugar de nuevo
          </button>
        </section>

        <div className="grid content-start gap-10">
          <section aria-labelledby="ranking">
            <h2 id="ranking" className="font-display text-xl font-semibold">Mejores puntajes del curso</h2>
            {estadoGuardado !== 'ok' && !ranking && <p className="mt-4 text-gris">Aparece cuando se guarde tu resultado.</p>}
            {estadoGuardado === 'ok' && !ranking && <p className="mt-4 text-gris">Cargando…</p>}
            {ranking && ranking.length === 0 && <p className="mt-4 text-gris">No se pudo cargar el ranking.</p>}
            {ranking && ranking.length > 0 && (
              <ol className="mt-4 grid gap-1">
                {ranking.map((f, i) => {
                  const yo = soyYo(f)
                  return (
                    <li
                      key={f.partida_id ?? i}
                      className={`grid grid-cols-[2rem_1fr_auto] items-baseline gap-2 rounded-md px-3 py-2 ${yo ? 'bg-nota-amarillo' : i % 2 ? '' : 'bg-tablero'}`}
                    >
                      <span className="font-display font-semibold text-gris">{i + 1}</span>
                      <span className="truncate font-semibold">
                        {f.nombre}
                        {yo && <span className="font-normal text-tinta/70"> (tú)</span>}
                      </span>
                      <span className="font-display font-semibold">{f.puntaje}</span>
                    </li>
                  )
                })}
              </ol>
            )}
            <p className="mt-2 text-xs text-gris">Cuenta la mejor partida de cada persona. En empate gana quien terminó más rápido.</p>
          </section>

          {r.repaso.length > 0 && (
            <section aria-labelledby="repaso">
              <h2 id="repaso" className="font-display text-xl font-semibold">Para repasar</h2>
              <ul className="mt-4 grid gap-4">
                {r.repaso.map((f) => (
                  <li key={f.id} className="border-l-4 border-rojo pl-3">
                    <p className="text-xs font-bold text-gris">{f.tema}</p>
                    <p className="mt-0.5 text-[15px] leading-snug">{f.pregunta}</p>
                    <p className="mt-1 text-[15px] font-semibold text-acierto">{f.correcta}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
