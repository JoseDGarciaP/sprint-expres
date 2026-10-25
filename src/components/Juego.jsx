import { useEffect, useState } from 'react'
import Tablero from './Tablero.jsx'
import Opciones, { Panel, Retro } from './Opciones.jsx'
import { DIAS_SPRINT, PROYECTO } from '../data/content.js'
import { standupDelDia, tareasEn, trabajoRestante } from '../game/engine.js'
import Artefactos from './Artefactos.jsx'

export default function Juego({ state, dispatch }) {
  const [recien, setRecien] = useState(null)
  const { fase, dia } = state

  useEffect(() => {
    if (!state.aviso) return
    const t = setTimeout(() => dispatch({ type: 'LIMPIAR_AVISO' }), 3500)
    return () => clearTimeout(t)
  }, [state.aviso, dispatch])

  const mover = (id) => {
    setRecien(id)
    dispatch({ type: 'MOVER', id })
  }

  return (
    <div className="mx-auto min-h-svh max-w-6xl px-4 pb-36 sm:px-6">
      <Encabezado state={state} />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-sm text-gris">Sprint del proyecto</p>
          <h1 className="font-display text-xl font-semibold sm:text-2xl">{PROYECTO}</h1>
        </div>
        <p className="text-sm text-gris">
          Terminadas: <strong className="text-tinta">{tareasEn(state, 'done').length} de {state.tareas.length}</strong>
        </p>
      </div>

      {fase === 'trabajo' && <p className="mb-2 text-sm text-gris sm:hidden">Toca una nota para avanzarla una columna.</p>}
      <Tablero
        tareas={state.tareas}
        dia={dia}
        puedeMover={fase === 'trabajo'}
        onMover={mover}
        recien={recien}
      />

      <Artefactos state={state} actual={fase === 'trabajo' ? trabajoRestante(state.tareas) : null} />

      {fase === 'trabajo' && <BarraTrabajo state={state} dispatch={dispatch} />}
      {fase === 'standup' && <PanelStandup state={state} dispatch={dispatch} />}
      {fase === 'evento' && <PanelEvento state={state} dispatch={dispatch} />}
      {fase === 'revision' && <PanelRevision state={state} dispatch={dispatch} />}
    </div>
  )
}

function Encabezado({ state }) {
  const fin = state.fase === 'revision'
  return (
    <header className="flex items-center justify-between gap-4 py-4">
      <p className="titulo text-xl text-rojo sm:text-2xl">Sprint Exprés</p>
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold">{fin ? 'Revisión' : `Día ${state.dia} de ${DIAS_SPRINT}`}</span>
        <ol className="flex gap-1" aria-hidden="true">
          {Array.from({ length: DIAS_SPRINT }, (_, i) => (
            <li
              key={i}
              className={`h-2 w-5 rounded-full sm:w-7 ${
                fin || i < state.dia - 1 ? 'bg-vino' : i === state.dia - 1 ? 'bg-rojo' : 'bg-linea'
              }`}
            />
          ))}
        </ol>
      </div>
      <p className="hidden max-w-48 truncate text-sm text-gris md:block">{state.jugador.nombre}</p>
    </header>
  )
}

function BarraTrabajo({ state, dispatch }) {
  const total = state.inicioTrabajo?.capacidad ?? state.capacidad
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-linea bg-white/95 backdrop-blur">
      {state.aviso && (
        <p role="status" className="bg-tinta px-4 py-2 text-center text-sm font-semibold text-white">
          {state.aviso}
        </p>
      )}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold">
            Movimientos<span className="hidden sm:inline"> hoy</span>
          </span>
          <span className="flex gap-1.5" aria-label={`${state.capacidad} de ${total} movimientos disponibles`}>
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`h-4 w-4 rounded-[3px] border-2 ${i < state.capacidad ? 'border-rojo bg-rojo' : 'border-linea bg-white'}`}
              />
            ))}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: 'DESHACER_DIA' })}
            className="rounded-md border-2 border-linea px-3 py-2 text-sm font-bold hover:border-tinta"
          >
            Deshacer el día
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'TERMINAR_DIA' })}
            className={`rounded-md px-4 py-2 font-display text-sm font-semibold text-white ${
              state.capacidad === 0 ? 'bg-rojo hover:bg-vino' : 'bg-tinta hover:bg-black'
            }`}
          >
            Terminar el día
          </button>
        </div>
      </div>
      <p className="mx-auto hidden max-w-6xl px-4 pb-3 text-xs text-gris sm:block sm:px-6">
        Toca una nota para avanzarla una columna. Cada avance gasta un movimiento.
      </p>
    </div>
  )
}

function PanelStandup({ state, dispatch }) {
  const q = standupDelDia(state)
  return (
    <Panel etiqueta={`Día ${state.dia}: Daily Standup (15 min)`} titulo="Reunión de pie">
      {state.penalizacionManana > 0 && (
        <p className="mb-3 rounded-md bg-[#fbe9e9] px-3 py-2 text-sm font-semibold text-vino">
          Por lo que pasó ayer, hoy el equipo arranca con {state.penalizacionManana} movimiento menos.
        </p>
      )}
      <blockquote className="nota nota-amarillo mb-4 rounded-[3px] p-4">
        <p className="text-xs font-bold text-tinta/70">{q.persona} dice:</p>
        <p className="mt-1 font-display text-[17px] leading-snug font-semibold">“{q.dice}”</p>
      </blockquote>
      <p className="mb-3 font-bold">{q.pregunta}</p>
      <Opciones
        key={q.id}
        opciones={q.opcionesMezcladas}
        correcta={q.correcta}
        bloqueado={!!state.feedback}
        onResponder={(i) => dispatch({ type: 'RESPONDER_STANDUP', indice: i })}
      />
      <Retro feedback={state.feedback} onContinuar={() => dispatch({ type: 'CONTINUAR' })} textoBoton="Ir al Scrumboard" />
    </Panel>
  )
}

function PanelEvento({ state, dispatch }) {
  const e = state.eventoActual
  const ultimo = state.dia >= DIAS_SPRINT
  return (
    <Panel etiqueta={`Durante el día ${state.dia}`} titulo={e.titulo}>
      <p className="mb-4 text-[17px] leading-snug">{e.texto}</p>
      <p className="mb-3 font-bold">¿Qué hace el equipo?</p>
      <Opciones
        key={e.id}
        opciones={e.opcionesMezcladas}
        correcta={e.correcta}
        bloqueado={!!state.feedback}
        onResponder={(i) => dispatch({ type: 'RESPONDER_EVENTO', indice: i })}
      />
      <Retro
        feedback={state.feedback}
        onContinuar={() => dispatch({ type: 'CONTINUAR' })}
        textoBoton={ultimo ? 'Ir a la revisión del sprint' : `Empezar el día ${state.dia + 1}`}
      />
    </Panel>
  )
}

function PanelRevision({ state, dispatch }) {
  const q = state.revision[state.indiceRevision]
  const terminadas = tareasEn(state, 'done').length
  const pendientes = state.tareas.filter((t) => t.col !== 'done')
  const ultima = state.indiceRevision === state.revision.length - 1
  return (
    <Panel
      etiqueta={`Revisión del sprint: pregunta ${state.indiceRevision + 1} de ${state.revision.length}`}
      titulo="Cierre del sprint"
    >
      {state.indiceRevision === 0 && (
        <div className="mb-4 rounded-md bg-tablero p-3 text-sm">
          <p>
            <strong>{terminadas} de {state.tareas.length}</strong> tareas terminadas.
            {pendientes.length > 0
              ? ` Las ${pendientes.length} pendientes vuelven al Backlog Priorizado del Producto para el siguiente sprint.`
              : ' ¡Sprint completo!'}
          </p>
        </div>
      )}
      <p className="mb-3 font-bold">{q.pregunta}</p>
      <Opciones
        key={q.id}
        opciones={q.opcionesMezcladas}
        correcta={q.correcta}
        bloqueado={!!state.feedback}
        onResponder={(i) => dispatch({ type: 'RESPONDER_REVISION', indice: i })}
      />
      <Retro
        feedback={state.feedback}
        onContinuar={() => dispatch({ type: 'CONTINUAR' })}
        textoBoton={ultima ? 'Ver mi resultado' : 'Siguiente pregunta'}
      />
    </Panel>
  )
}
