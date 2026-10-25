import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import Inicio from './components/Inicio.jsx'
import Juego from './components/Juego.jsx'
import Resultados from './components/Resultados.jsx'
import Admin from './components/Admin.jsx'
import { reducer, resumen } from './game/engine.js'
import { conReintentos, guardarResultado, modoLocal, nuevoId, registrarIngreso } from './lib/storage.js'

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const f = () => setHash(window.location.hash)
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return hash
}

const reducerSeguro = (state, action) => {
  if (action.type === 'SALIR') return null
  return state || action.type === 'INICIAR' ? reducer(state, action) : state
}

// La partida en curso se guarda en la pestaña: si el estudiante recarga o el celular
// cierra la página, continúa donde iba.
const CLAVE_PARTIDA = 'sprint-expres:partida'
function partidaGuardada() {
  try {
    const s = JSON.parse(sessionStorage.getItem(CLAVE_PARTIDA))
    return s && s.fase && s.fase !== 'fin' && s.jugador ? s : null
  } catch {
    return null
  }
}

export default function App() {
  const hash = useHash()
  const [state, dispatch] = useReducer(reducerSeguro, null, partidaGuardada)
  const [estadoGuardado, setEstadoGuardado] = useState(null)
  const ingreso = useRef(null) // promesa del registro de ingreso
  const guardado = useRef(false)

  useEffect(() => {
    try {
      if (state && state.fase !== 'fin') sessionStorage.setItem(CLAVE_PARTIDA, JSON.stringify(state))
      else sessionStorage.removeItem(CLAVE_PARTIDA)
    } catch {
      /* sin almacenamiento: la partida simplemente no se recupera */
    }
  }, [state])

  const empezar = async (jugador) => {
    const partidaId = nuevoId()
    // El registro de ingreso no detiene el juego si la red falla; se reintenta al final.
    ingreso.current = conReintentos(() => registrarIngreso({ id: partidaId, ...jugador }))
      .then(() => true)
      .catch(() => null)
    guardado.current = false
    setEstadoGuardado(null)
    dispatch({ type: 'INICIAR', jugador, partidaId })
  }

  const guardar = useCallback(async () => {
    if (!state) return
    setEstadoGuardado('guardando')
    const r = resumen(state)
    try {
      const okIngreso = ingreso.current ? await ingreso.current : null
      if (okIngreso === null) {
        await conReintentos(() => registrarIngreso({ id: state.partidaId, ...state.jugador }))
        ingreso.current = Promise.resolve(true)
      }
      await conReintentos(() =>
        guardarResultado({
          partida_id: state.partidaId,
          nombre: state.jugador.nombre,
          codigo: state.jugador.codigo,
          puntaje: r.puntaje,
          tareas_terminadas: r.terminadas,
          standup_aciertos: r.standup,
          eventos_aciertos: r.eventos,
          revision_aciertos: r.revision,
          duracion_seg: r.duracionSeg,
          detalle: { respuestas: state.respuestas, movimientos: state.movimientos },
        }),
      )
      setEstadoGuardado('ok')
    } catch {
      setEstadoGuardado('error')
    }
  }, [state])

  useEffect(() => {
    if (state?.fase === 'fin' && !guardado.current) {
      guardado.current = true
      guardar()
    }
  }, [state?.fase, guardar])

  // Evita perder la partida por cerrar la pestaña sin querer.
  useEffect(() => {
    if (!state || state.fase === 'fin') return
    const f = (e) => e.preventDefault()
    window.addEventListener('beforeunload', f)
    return () => window.removeEventListener('beforeunload', f)
  }, [state])

  if (hash === '#admin') return <Admin />
  if (!state) return <Inicio onEmpezar={empezar} modoLocal={modoLocal} />
  if (state.fase === 'fin') {
    return (
      <Resultados
        r={resumen(state)}
        jugador={state.jugador}
        estadoGuardado={estadoGuardado}
        onReintentar={guardar}
        onJugarDeNuevo={() => empezar(state.jugador)}
      />
    )
  }
  return <Juego state={state} dispatch={dispatch} />
}
