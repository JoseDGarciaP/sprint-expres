import { useCallback, useEffect, useMemo, useState } from 'react'
import { obtenerPanel, modoLocal, PinIncorrecto, PanelBloqueado } from '../lib/storage.js'
import { formatoDuracion } from './Resultados.jsx'
import { DIAS_SPRINT, EVENTOS, REVISION, STANDUP, TAREAS } from '../data/content.js'
import { PREGUNTAS_REVISION } from '../game/engine.js'

const hora = (iso) =>
  iso ? new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

const TEXTOS = new Map([
  ...STANDUP.map((q) => [q.id, { tema: 'Daily Standup', texto: `${q.persona}: “${q.dice}”` }]),
  ...EVENTOS.map((q) => [q.id, { tema: 'Evento del día', texto: q.titulo }]),
  ...REVISION.map((q) => [q.id, { tema: 'Revisión', texto: q.pregunta }]),
])

export default function Admin() {
  // El PIN vive solo en la memoria de esta página: no se guarda en el navegador.
  // Al recargar o cerrar la pestaña hay que escribirlo de nuevo.
  const [pin, setPin] = useState('')
  const [verPin, setVerPin] = useState(false)
  const [entro, setEntro] = useState(false)
  const [datos, setDatos] = useState({ ingresos: [], resultados: [] })
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [actualizado, setActualizado] = useState(null)

  const cargar = useCallback(async (p) => {
    setCargando(true)
    try {
      const d = await obtenerPanel(p)
      setDatos({ ingresos: d.ingresos ?? [], resultados: d.resultados ?? [] })
      setEntro(true)
      setError(null)
      setActualizado(new Date())
      setVerPin(false)
    } catch (e) {
      if (e instanceof PinIncorrecto) {
        setEntro(false)
        setPin('')
        setError(
          e.restantes == null
            ? 'PIN incorrecto.'
            : e.restantes > 0
              ? `PIN incorrecto. Te ${e.restantes === 1 ? 'queda 1 intento' : `quedan ${e.restantes} intentos`} antes de un bloqueo de 15 minutos.`
              : 'PIN incorrecto. El panel quedó bloqueado 15 minutos desde esta conexión.',
        )
      } else if (e instanceof PanelBloqueado) {
        setEntro(false)
        setPin('')
        setError(`Demasiados intentos fallidos. Espera ${e.minutos} minuto${e.minutos === 1 ? '' : 's'} y vuelve a intentarlo.`)
      } else {
        setError(`No se pudieron consultar los datos: ${e.message ?? 'error de red'}`)
      }
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (!entro) return
    const t = setInterval(() => cargar(pin), 15000)
    return () => clearInterval(t)
  }, [entro, pin, cargar])

  // Una fila por ingreso, con su resultado (si terminó).
  const filas = useMemo(() => {
    const porPartida = new Map()
    for (const r of datos.resultados) {
      const previo = porPartida.get(r.partida_id)
      if (!previo || r.puntaje > previo.puntaje) porPartida.set(r.partida_id, r)
    }
    return datos.ingresos.map((i) => ({ ...i, resultado: porPartida.get(i.id) ?? null }))
  }, [datos])

  // Porcentaje de acierto por pregunta, con las respuestas guardadas en "detalle".
  const preguntas = useMemo(() => {
    const cuenta = new Map()
    for (const r of datos.resultados) {
      const resp = r.detalle?.respuestas
      if (!resp) continue
      for (const x of [...(resp.standup ?? []), ...(resp.eventos ?? []), ...(resp.revision ?? [])]) {
        const c = cuenta.get(x.id) ?? { bien: 0, total: 0 }
        c.total++
        if (x.ok) c.bien++
        cuenta.set(x.id, c)
      }
    }
    return [...cuenta.entries()]
      .filter(([id]) => TEXTOS.has(id))
      .map(([id, c]) => ({ id, ...TEXTOS.get(id), ...c, pct: Math.round((100 * c.bien) / c.total) }))
      .sort((a, b) => a.pct - b.pct || b.total - a.total)
  }, [datos])

  const terminaron = filas.filter((f) => f.resultado)
  const promedio = terminaron.length
    ? Math.round(terminaron.reduce((s, f) => s + f.resultado.puntaje, 0) / terminaron.length)
    : 0

  const descargarCSV = () => {
    const cab = ['nombre', 'codigo', 'iniciado', 'estado', 'puntaje', 'tareas_terminadas', 'standup', 'eventos', 'revision', 'duracion_seg', 'finalizado']
    const lineas = filas.map((f) => {
      const r = f.resultado
      return [
        f.nombre, f.codigo ?? '', f.iniciado_en, r ? 'Terminó' : 'No terminó',
        r?.puntaje ?? '', r?.tareas_terminadas ?? '', r?.standup_aciertos ?? '', r?.eventos_aciertos ?? '',
        r?.revision_aciertos ?? '', r?.duracion_seg ?? '', r?.finalizado_en ?? '',
      ].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(';')
    })
    // Separador ";" y BOM para que Excel en español lo abra en columnas con tildes correctas.
    const blob = new Blob(['﻿' + [cab.join(';'), ...lineas].join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `sprint-expres-resultados-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!entro) {
    return (
      <main className="mx-auto grid min-h-svh max-w-sm content-center px-4">
        <p className="titulo text-3xl text-rojo">Sprint Exprés</p>
        <h1 className="mt-2 font-display text-xl font-semibold">Panel de resultados</h1>
        <form
          className="mt-6 grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (pin) cargar(pin)
          }}
        >
          <div className="grid gap-1.5">
            <label htmlFor="pin" className="text-sm font-bold">PIN</label>
            <div className="flex items-stretch overflow-hidden rounded-md border-2 border-linea focus-within:border-tinta">
              <input
                id="pin"
                type={verPin ? 'text' : 'password'}
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                aria-describedby={error ? 'error-pin' : undefined}
                className="w-full min-w-0 px-3 py-2.5 outline-none focus-visible:outline-none"
              />
              <button
                type="button"
                onClick={() => setVerPin((v) => !v)}
                aria-pressed={verPin}
                aria-controls="pin"
                aria-label={verPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                title={verPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                className="grid w-12 shrink-0 place-items-center border-l-2 border-linea text-gris hover:bg-tablero hover:text-tinta"
              >
                <IconoOjo tachado={verPin} />
              </button>
            </div>
          </div>
          {error && <p id="error-pin" role="alert" className="text-sm font-semibold text-rojo">{error}</p>}
          <button disabled={cargando || !pin} className="rounded-md bg-rojo px-5 py-3 font-display font-semibold text-white hover:bg-vino disabled:opacity-60">
            {cargando ? 'Verificando…' : 'Entrar'}
          </button>
          <a href="#" className="text-sm text-gris underline">Volver al juego</a>
        </form>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="titulo text-2xl text-rojo">Sprint Exprés</p>
          <h1 className="font-display text-2xl font-semibold">Panel de resultados</h1>
          {modoLocal && <p className="mt-1 text-sm text-gris">Modo local: solo ves las partidas jugadas en este navegador.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setEntro(false)
              setPin('')
              setError(null)
              setDatos({ ingresos: [], resultados: [] })
            }}
            className="rounded-md border-2 border-linea px-4 py-2 text-sm font-bold hover:border-tinta"
          >
            Salir
          </button>
          <button onClick={() => cargar(pin)} className="rounded-md border-2 border-linea px-4 py-2 text-sm font-bold hover:border-tinta">
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
          <button onClick={descargarCSV} disabled={!filas.length} className="rounded-md bg-tinta px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
            Descargar CSV
          </button>
        </div>
      </header>

      {error && <p className="mt-4 rounded-md bg-[#fbe9e9] p-3 text-sm font-semibold text-vino">{error}</p>}

      <dl className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-linea bg-linea">
        {[
          ['Ingresaron', filas.length],
          ['Terminaron', terminaron.length],
          ['Puntaje promedio', promedio],
        ].map(([k, v]) => (
          <div key={k} className="bg-white p-3 sm:p-4">
            <dt className="text-xs text-gris sm:text-sm">{k}</dt>
            <dd className="font-display text-2xl font-semibold sm:text-3xl">{v}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 font-display text-xl font-semibold">Participantes</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-tinta">
              {['Nombre', 'Código', 'Ingresó', 'Estado', 'Puntaje', 'Tareas', 'Standup', 'Decisiones', 'Revisión', 'Duración'].map((h) => (
                <th key={h} className="py-2 pr-3 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr><td colSpan={10} className="py-6 text-gris">Todavía nadie ha ingresado. Comparte el enlace del juego con el curso.</td></tr>
            )}
            {filas.map((f) => {
              const r = f.resultado
              return (
                <tr key={f.id} className="border-b border-linea">
                  <td className="py-2 pr-3 font-semibold">{f.nombre}</td>
                  <td className="py-2 pr-3">{f.codigo}</td>
                  <td className="py-2 pr-3 text-gris">{hora(f.iniciado_en)}</td>
                  <td className="py-2 pr-3">
                    {r ? <span className="font-semibold text-acierto">Terminó</span> : <span className="text-gris">En juego o abandonó</span>}
                  </td>
                  <td className="py-2 pr-3 font-display font-semibold">{r?.puntaje ?? ''}</td>
                  <td className="py-2 pr-3">{r ? `${r.tareas_terminadas}/${TAREAS.length}` : ''}</td>
                  <td className="py-2 pr-3">{r ? `${r.standup_aciertos}/${DIAS_SPRINT}` : ''}</td>
                  <td className="py-2 pr-3">{r ? `${r.eventos_aciertos}/${DIAS_SPRINT}` : ''}</td>
                  <td className="py-2 pr-3">{r ? `${r.revision_aciertos}/${PREGUNTAS_REVISION}` : ''}</td>
                  <td className="py-2 pr-3">{r ? formatoDuracion(r.duracion_seg) : ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold">Preguntas más difíciles para el curso</h2>
      <p className="mt-1 text-sm text-gris">Ordenadas de menor a mayor porcentaje de acierto. Sirven para el cierre de la exposición.</p>
      {preguntas.length === 0 ? (
        <p className="mt-4 text-sm text-gris">Aparecen cuando alguien termine una partida.</p>
      ) : (
        <ol className="mt-4 grid gap-2">
          {preguntas.map((p) => (
            <li key={p.id} className="grid grid-cols-[3.5rem_1fr] items-center gap-3 sm:grid-cols-[3.5rem_1fr_9rem]">
              <span className={`font-display text-lg font-semibold ${p.pct < 50 ? 'text-rojo' : p.pct < 75 ? 'text-tinta' : 'text-acierto'}`}>
                {p.pct}%
              </span>
              <span className="text-sm">
                <span className="font-bold text-gris">{p.tema}. </span>
                {p.texto}
              </span>
              <span className="col-span-2 flex items-center gap-2 sm:col-span-1">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-tablero">
                  <span className="block h-full bg-tinta" style={{ width: `${p.pct}%` }} />
                </span>
                <span className="w-12 text-right text-xs text-gris">{p.bien}/{p.total}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-8 text-xs text-gris">
        Se actualiza solo cada 15 segundos{actualizado ? `. Última actualización: ${actualizado.toLocaleTimeString('es-CO')}` : '.'}
      </p>
    </main>
  )
}

// Ojo abierto = el PIN está oculto (al pulsarlo se muestra); ojo tachado = el PIN está visible.
function IconoOjo({ tachado }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {tachado && <path d="M3 3l18 18" />}
    </svg>
  )
}
