import { useState } from 'react'
import { DIAS_SPRINT } from '../data/content.js'

const PASOS = [
  ['Daily Standup', 'Cada día empieza con una reunión de pie. Si respondes bien, el equipo gana un movimiento extra.'],
  ['Mueve las notas', 'Toca una nota del Scrumboard para avanzarla: Por hacer, En progreso, En prueba, Terminado.'],
  ['Algo pasa', 'Al final del día aparece un impedimento o un cambio. Decide como lo haría un equipo Scrum.'],
  ['Revisión', 'Cierra el sprint con unas preguntas sobre los procesos 10.1, 10.2 y 10.3.'],
]

export default function Inicio({ onEmpezar, modoLocal }) {
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const valido = nombre.trim().length >= 3

  const enviar = async (e) => {
    e.preventDefault()
    if (!valido || enviando) return
    setEnviando(true)
    await onEmpezar({ nombre: nombre.trim().replace(/\s+/g, ' '), codigo: codigo.trim() })
  }

  return (
    <div className="min-h-svh">
      <div className="h-2 bg-rojo" />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-16">
        <section>
          <p className="font-display text-sm font-semibold text-gris">Implementación en Scrum, Guía SBOK</p>
          <h1 className="titulo mt-3 text-6xl sm:text-7xl lg:text-8xl">
            Sprint
            <br />
            <span className="text-rojo">Exprés</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed">
            Tu equipo tiene {DIAS_SPRINT} días para sacar adelante el sprint. Toma las decisiones de la fase de
            implementación de Scrum y termina la mayor cantidad de tareas.
          </p>

          <form onSubmit={enviar} className="mt-8 grid max-w-md gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-bold">Nombre y apellido</span>
              <input
                required
                minLength={3}
                maxLength={80}
                autoComplete="name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="rounded-md border-2 border-linea px-3 py-2.5 text-base outline-none focus:border-tinta"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-bold">
                Código estudiantil <span className="font-normal text-gris">(opcional)</span>
              </span>
              <input
                inputMode="numeric"
                maxLength={20}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/[^\d]/g, ''))}
                className="rounded-md border-2 border-linea px-3 py-2.5 text-base outline-none focus:border-tinta"
              />
            </label>
            <button
              type="submit"
              disabled={!valido || enviando}
              className="mt-2 rounded-md bg-rojo px-6 py-3.5 font-display text-lg font-semibold text-white hover:bg-vino disabled:cursor-not-allowed disabled:bg-linea disabled:text-gris"
            >
              {enviando ? 'Preparando el tablero…' : 'Empezar el sprint'}
            </button>
            <p className="text-sm text-gris">Dura unos 7 minutos.</p>
            {modoLocal && (
              <p className="rounded-md bg-tablero px-3 py-2 text-xs text-gris">
                Modo local: los resultados se guardan solo en este navegador porque falta configurar Supabase.
              </p>
            )}
          </form>
        </section>

        <section aria-labelledby="como-se-juega" className="lg:pt-6">
          <h2 id="como-se-juega" className="font-display text-xl font-semibold">
            Cómo se juega
          </h2>
          <ol className="mt-5 grid gap-5">
            {PASOS.map(([titulo, texto], i) => (
              <li key={titulo} className="grid grid-cols-[2.5rem_1fr] gap-3">
                <span className="titulo text-3xl text-rojo">{i + 1}</span>
                <div>
                  <p className="font-display font-semibold">{titulo}</p>
                  <p className="mt-0.5 leading-relaxed text-tinta/80">{texto}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex gap-3" aria-hidden="true">
            <div className="nota nota-amarillo h-16 w-24 rounded-[3px]" />
            <div className="nota nota-rosa h-16 w-24 rounded-[3px]" />
            <div className="nota nota-azul h-16 w-24 rounded-[3px]" />
          </div>
        </section>
      </main>
    </div>
  )
}
