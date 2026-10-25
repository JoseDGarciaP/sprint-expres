// Guardado de datos.
// - Si existen VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY, todo se guarda en Supabase.
// - Si no, se usa el almacenamiento del navegador (modo local, útil para probar).
//
// La página solo INSERTA datos. Para leer usa dos funciones de la base de datos:
//   ranking()          → nombre y puntaje (público)
//   panel_datos(pin)   → todos los datos, solo con el PIN (definido en supabase/schema.sql)
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null
export const modoLocal = !supabase

const PIN_LOCAL = 'scrum2026'
const LS_INGRESOS = 'sprint-expres:ingresos'
const LS_RESULTADOS = 'sprint-expres:resultados'

function leerLocal(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave) ?? '[]')
  } catch {
    return []
  }
}
function escribirLocal(clave, fila) {
  try {
    localStorage.setItem(clave, JSON.stringify([...leerLocal(clave), fila]))
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
}

export function nuevoId() {
  if (crypto?.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// Registra que un estudiante ingresó al juego.
export async function registrarIngreso({ id, nombre, codigo }) {
  const fila = { id, nombre, codigo: codigo || null, iniciado_en: new Date().toISOString(), navegador: navigator.userAgent.slice(0, 200) }
  if (modoLocal) {
    if (!leerLocal(LS_INGRESOS).some((f) => f.id === id)) escribirLocal(LS_INGRESOS, fila)
    return
  }
  const { error } = await supabase.from('ingresos').insert(fila)
  // 23505 = ya existía (un reintento después de que el primer intento sí llegó): no es error.
  if (error && error.code !== '23505') throw error
}

// Guarda el resultado al terminar la partida.
export async function guardarResultado(fila) {
  const completa = { ...fila, codigo: fila.codigo || null, finalizado_en: new Date().toISOString() }
  if (modoLocal) return escribirLocal(LS_RESULTADOS, completa)
  const { error } = await supabase.from('resultados').insert(completa)
  if (error) throw error
}

// Mejor partida de cada estudiante (por código), ordenada por puntaje y luego por menor tiempo.
function rankingDe(filas, limite) {
  const mejores = new Map()
  for (const f of filas) {
    const k = f.codigo || f.nombre.toLowerCase()
    const p = mejores.get(k)
    if (!p || f.puntaje > p.puntaje || (f.puntaje === p.puntaje && f.duracion_seg < p.duracion_seg)) mejores.set(k, f)
  }
  return [...mejores.values()]
    .sort((a, b) => b.puntaje - a.puntaje || a.duracion_seg - b.duracion_seg)
    .slice(0, limite)
    .map(({ partida_id, nombre, puntaje, duracion_seg }) => ({ partida_id, nombre, puntaje, duracion_seg }))
}

export async function obtenerRanking(limite = 10) {
  if (modoLocal) return rankingDe(leerLocal(LS_RESULTADOS), limite)
  const { data, error } = await supabase.rpc('ranking', { limite })
  if (error) throw error
  return data
}

export class PinIncorrecto extends Error {
  constructor(restantes) {
    super('PIN incorrecto')
    this.restantes = restantes // intentos que quedan antes del bloqueo (null si no se sabe)
  }
}
export class PanelBloqueado extends Error {
  constructor(minutos) {
    super('Demasiados intentos')
    this.minutos = minutos
  }
}

// El PIN viaja por HTTPS y se verifica en la base de datos contra un hash bcrypt.
// La base de datos bloquea 15 minutos tras 5 intentos fallidos desde la misma conexión.
export async function obtenerPanel(pin) {
  if (modoLocal) {
    if (pin !== PIN_LOCAL) throw new PinIncorrecto(null)
    return { ingresos: leerLocal(LS_INGRESOS).reverse(), resultados: leerLocal(LS_RESULTADOS) }
  }
  const { data, error } = await supabase.rpc('panel_datos', { pin })
  if (error) throw error
  if (data?.error === 'bloqueado') throw new PanelBloqueado(data.minutos)
  if (data?.error === 'pin') throw new PinIncorrecto(data.restantes)
  return data
}

// Reintenta varias veces (la red del salón puede fallar).
export async function conReintentos(fn, intentos = 3) {
  let ultimo
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn()
    } catch (e) {
      ultimo = e
      await new Promise((r) => setTimeout(r, 800 * (i + 1)))
    }
  }
  throw ultimo
}
