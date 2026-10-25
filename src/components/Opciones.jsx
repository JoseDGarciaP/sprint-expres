import { useState } from 'react'

// Lista de opciones de respuesta. Al responder, marca la elegida y la correcta.
export default function Opciones({ opciones, correcta, bloqueado, onResponder }) {
  const [elegida, setElegida] = useState(null)

  return (
    <ul className="grid gap-2">
      {opciones.map(({ texto, original }) => {
        const esCorrecta = original === correcta
        const esElegida = original === elegida
        let estilo = 'border-linea bg-white hover:border-tinta'
        if (bloqueado) {
          if (esCorrecta) estilo = 'border-acierto bg-[#e7f4ec]'
          else if (esElegida) estilo = 'border-rojo bg-[#fbe9e9]'
          else estilo = 'border-linea bg-white opacity-60'
        }
        return (
          <li key={original}>
            <button
              type="button"
              disabled={bloqueado}
              onClick={() => {
                setElegida(original)
                onResponder(original)
              }}
              className={`w-full rounded-md border-2 px-4 py-3 text-left text-[15px] leading-snug font-semibold transition-colors disabled:cursor-default ${estilo}`}
            >
              <span className="flex items-start justify-between gap-3">
                <span>{texto}</span>
                {bloqueado && esCorrecta && <span className="shrink-0 text-acierto">✓</span>}
                {bloqueado && esElegida && !esCorrecta && <span className="shrink-0 text-rojo">✕</span>}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function Retro({ feedback, onContinuar, textoBoton }) {
  if (!feedback) return null
  return (
    <div className="panel-entrada mt-4 border-t border-linea pt-4">
      <p className={`font-display text-lg font-semibold ${feedback.ok ? 'text-acierto' : 'text-rojo'}`}>
        {feedback.ok ? '¡Correcto!' : 'No era esa'}
      </p>
      {feedback.explicacion && <p className="mt-1 text-[15px] text-tinta">{feedback.explicacion}</p>}
      {feedback.efectoTexto && <p className="mt-2 text-[15px] font-bold">{feedback.efectoTexto}</p>}
      <button
        type="button"
        autoFocus
        onClick={onContinuar}
        className="mt-4 w-full rounded-md bg-rojo px-5 py-3 font-display font-semibold text-white hover:bg-vino sm:w-auto"
      >
        {textoBoton}
      </button>
    </div>
  )
}

// Panel flotante sobre el tablero (hoja inferior en celular, centrado en escritorio).
export function Panel({ etiqueta, titulo, children }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-tinta/45 sm:items-center sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="panel-entrada max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-xl bg-white p-5 shadow-2xl sm:rounded-xl sm:p-7"
      >
        <p className="text-sm font-bold text-rojo">{etiqueta}</p>
        <h2 className="titulo mt-1 text-2xl sm:text-3xl">{titulo}</h2>
        <div className="mt-4">{children}</div>
      </section>
    </div>
  )
}
