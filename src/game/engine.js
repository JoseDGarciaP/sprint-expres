import {
  DIAS_SPRINT, CAPACIDAD_BASE, LIMITE_EN_PROGRESO, PUNTOS, COLUMNAS,
  TAREAS, STANDUP, EVENTOS, REVISION,
} from '../data/content.js'

const ORDEN_COLS = COLUMNAS.map((c) => c.id)
export const PREGUNTAS_REVISION = 4

// Trabajo restante = pasos que le faltan a cada tarea para llegar a Terminado (base del Burndown).
export const trabajoRestante = (tareas) =>
  tareas.reduce((s, t) => s + (ORDEN_COLS.length - 1 - ORDEN_COLS.indexOf(t.col)), 0)

function mezclar(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Mezcla las opciones pero recuerda el índice original para calificar.
function conOpcionesMezcladas(item) {
  return { ...item, opcionesMezcladas: mezclar(item.opciones.map((texto, original) => ({ texto, original }))) }
}

export function crearPartida(jugador, partidaId) {
  return {
    jugador,
    partidaId,
    inicio: Date.now(),
    fase: 'standup', // standup | trabajo | evento | revision | fin
    dia: 1,
    tareas: TAREAS.map((t) => ({ ...t, col: 'todo', bloqueadaDia: null })),
    capacidad: 0,
    penalizacionManana: 0,
    standups: mezclar(STANDUP)
      .slice(0, DIAS_SPRINT)
      .map((q) => (q.ordenFijo ? { ...q, opcionesMezcladas: q.opciones.map((texto, original) => ({ texto, original })) } : conOpcionesMezcladas(q))),
    poolEventos: mezclar(EVENTOS).map(conOpcionesMezcladas),
    eventoActual: null,
    revision: mezclar(REVISION).slice(0, PREGUNTAS_REVISION).map(conOpcionesMezcladas),
    indiceRevision: 0,
    feedback: null, // { ok, explicacion, efectoTexto }
    inicioTrabajo: null,
    aviso: null,
    respuestas: { standup: [], eventos: [], revision: [] },
    movimientos: 0,
    burndown: [trabajoRestante(TAREAS.map((t) => ({ ...t, col: 'todo' })))], // restante al final de cada día
    impedimentos: [], // Impediment Log: { dia, titulo, ok, efectoTexto }
  }
}

export const tareasEn = (state, col) => state.tareas.filter((t) => t.col === col)

export function standupDelDia(state) {
  return state.standups[state.dia - 1]
}

function siguienteCol(col) {
  return ORDEN_COLS[ORDEN_COLS.indexOf(col) + 1]
}

function elegirEvento(state) {
  const usados = new Set(state.respuestas.eventos.map((r) => r.id))
  const hayEnPrueba = tareasEn(state, 'test').length > 0
  const elegibles = state.poolEventos.filter((e) => !usados.has(e.id) && (!e.requiere || hayEnPrueba))
  // Si hay una tarea en prueba, damos prioridad a la "falla en prueba" una vez.
  const falla = elegibles.find((e) => e.requiere === 'test')
  if (falla && Math.random() < 0.5) return falla
  return elegibles[0] ?? state.poolEventos[0]
}

function aplicarEfecto(state, efecto) {
  if (efecto === 'rechazo') {
    const t = tareasEn(state, 'test')[0]
    if (t) {
      return {
        state: { ...state, tareas: state.tareas.map((x) => (x.id === t.id ? { ...x, col: 'todo' } : x)) },
        texto: `"${t.titulo}" no cumplió los criterios de aceptación: fue rechazada y vuelve a Por hacer.`,
      }
    }
  }
  if (efecto === 'bloqueo') {
    const candidata = tareasEn(state, 'doing')[0] ?? tareasEn(state, 'todo')[0]
    if (candidata && state.dia < DIAS_SPRINT) {
      return {
        state: {
          ...state,
          tareas: state.tareas.map((x) => (x.id === candidata.id ? { ...x, bloqueadaDia: state.dia + 1 } : x)),
        },
        texto: `"${candidata.titulo}" queda bloqueada durante el día ${state.dia + 1}.`,
      }
    }
  }
  if (state.dia >= DIAS_SPRINT) return { state, texto: 'En un sprint real, esto le costaría tiempo al equipo.' }
  return {
    state: { ...state, penalizacionManana: state.penalizacionManana + 1 },
    texto: 'Mañana el equipo tendrá 1 movimiento menos.',
  }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'INICIAR':
      return crearPartida(action.jugador, action.partidaId)

    case 'RESPONDER_STANDUP': {
      if (state.feedback) return state
      const q = standupDelDia(state)
      const ok = action.indice === q.correcta
      return {
        ...state,
        feedback: {
          ok,
          explicacion: q.explicacion,
          efectoTexto: ok ? 'Equipo sincronizado: +1 movimiento hoy.' : null,
        },
        respuestas: {
          ...state.respuestas,
          standup: [...state.respuestas.standup, { id: q.id, dia: state.dia, ok }],
        },
      }
    }

    case 'CONTINUAR': {
      if (state.fase === 'standup') {
        const ok = state.respuestas.standup.at(-1)?.ok
        const capacidad = Math.max(1, CAPACIDAD_BASE - state.penalizacionManana + (ok ? 1 : 0))
        return {
          ...state,
          fase: 'trabajo',
          feedback: null,
          capacidad,
          penalizacionManana: 0,
          inicioTrabajo: { tareas: state.tareas, capacidad, movimientos: state.movimientos },
          aviso: null,
        }
      }
      if (state.fase === 'evento') {
        if (state.dia >= DIAS_SPRINT) {
          return { ...state, fase: 'revision', feedback: null, eventoActual: null }
        }
        return { ...state, fase: 'standup', dia: state.dia + 1, feedback: null, eventoActual: null }
      }
      if (state.fase === 'revision') {
        const siguiente = state.indiceRevision + 1
        if (siguiente >= state.revision.length) {
          return { ...state, fase: 'fin', feedback: null, fin: Date.now() }
        }
        return { ...state, indiceRevision: siguiente, feedback: null }
      }
      return state
    }

    case 'MOVER': {
      if (state.fase !== 'trabajo') return state
      const t = state.tareas.find((x) => x.id === action.id)
      if (!t || t.col === 'done') return state
      if (t.bloqueadaDia === state.dia) {
        return { ...state, aviso: `"${t.titulo}" está bloqueada hoy por un impedimento.` }
      }
      if (state.capacidad <= 0) {
        return { ...state, aviso: 'No quedan movimientos hoy. Termina el día.' }
      }
      const destino = siguienteCol(t.col)
      if (destino === 'doing' && tareasEn(state, 'doing').length >= LIMITE_EN_PROGRESO) {
        return {
          ...state,
          aviso: `Ya hay ${LIMITE_EN_PROGRESO} tareas en progreso. Termina alguna antes de empezar otra.`,
        }
      }
      return {
        ...state,
        tareas: state.tareas.map((x) => (x.id === t.id ? { ...x, col: destino } : x)),
        capacidad: state.capacidad - 1,
        movimientos: state.movimientos + 1,
        aviso: null,
      }
    }

    case 'LIMPIAR_AVISO':
      return state.aviso ? { ...state, aviso: null } : state

    case 'DESHACER_DIA': {
      if (state.fase !== 'trabajo' || !state.inicioTrabajo) return state
      return { ...state, ...state.inicioTrabajo, aviso: null }
    }

    case 'TERMINAR_DIA': {
      if (state.fase !== 'trabajo') return state
      return {
        ...state,
        fase: 'evento',
        eventoActual: elegirEvento(state),
        feedback: null,
        aviso: null,
        burndown: [...state.burndown, trabajoRestante(state.tareas)],
      }
    }

    case 'RESPONDER_EVENTO': {
      if (state.feedback || !state.eventoActual) return state
      const e = state.eventoActual
      const ok = action.indice === e.correcta
      let nuevo = {
        ...state,
        respuestas: {
          ...state.respuestas,
          eventos: [...state.respuestas.eventos, { id: e.id, dia: state.dia, ok }],
        },
      }
      let efectoTexto = 'Buena decisión: el sprint sigue sin contratiempos.'
      if (!ok) {
        const r = aplicarEfecto(nuevo, e.efecto)
        nuevo = r.state
        efectoTexto = r.texto
      }
      return {
        ...nuevo,
        feedback: { ok, explicacion: e.explicacion, efectoTexto },
        impedimentos: [...state.impedimentos, { dia: state.dia, titulo: e.titulo, ok }],
      }
    }

    case 'RESPONDER_REVISION': {
      if (state.feedback) return state
      const q = state.revision[state.indiceRevision]
      const ok = action.indice === q.correcta
      return {
        ...state,
        feedback: { ok, explicacion: ok ? null : `Respuesta correcta: ${q.opciones[q.correcta]}` },
        respuestas: {
          ...state.respuestas,
          revision: [...state.respuestas.revision, { id: q.id, ok }],
        },
      }
    }

    default:
      return state
  }
}

export function resumen(state) {
  const terminadas = tareasEn(state, 'done').length
  const aciertos = (arr) => arr.filter((r) => r.ok).length
  const standup = aciertos(state.respuestas.standup)
  const eventos = aciertos(state.respuestas.eventos)
  const revision = aciertos(state.respuestas.revision)
  const puntaje =
    terminadas * PUNTOS.tareaTerminada +
    standup * PUNTOS.standupCorrecto +
    eventos * PUNTOS.eventoCorrecto +
    revision * PUNTOS.revisionCorrecta
  const maximo =
    TAREAS.length * PUNTOS.tareaTerminada +
    DIAS_SPRINT * PUNTOS.standupCorrecto +
    DIAS_SPRINT * PUNTOS.eventoCorrecto +
    PREGUNTAS_REVISION * PUNTOS.revisionCorrecta
  return {
    puntaje,
    maximo,
    terminadas,
    totalTareas: TAREAS.length,
    standup,
    eventos,
    revision,
    duracionSeg: Math.round(((state.fin ?? Date.now()) - state.inicio) / 1000),
    pendientes: state.tareas.filter((t) => t.col !== 'done'),
    repaso: repaso(state),
    burndown: state.burndown,
    impedimentos: state.impedimentos,
  }
}

// Lista de lo que el jugador respondió mal, con la respuesta correcta, para repasar al final.
function repaso(state) {
  const fallos = []
  const porId = (lista, id) => lista.find((x) => x.id === id)
  for (const r of state.respuestas.standup) {
    const q = porId(STANDUP, r.id)
    if (!r.ok && q) fallos.push({ id: q.id, tema: 'Daily Standup', pregunta: `${q.persona}: “${q.dice}” ${q.pregunta}`, correcta: q.opciones[q.correcta] })
  }
  for (const r of state.respuestas.eventos) {
    const q = porId(EVENTOS, r.id)
    if (!r.ok && q) fallos.push({ id: q.id, tema: q.titulo, pregunta: q.texto, correcta: q.opciones[q.correcta] })
  }
  for (const r of state.respuestas.revision) {
    const q = porId(REVISION, r.id)
    if (!r.ok && q) fallos.push({ id: q.id, tema: 'Revisión', pregunta: q.pregunta, correcta: q.opciones[q.correcta] })
  }
  return fallos
}
