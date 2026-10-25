// Contenido del juego basado en la Guía SBOK™, Capítulo 10: Implementación.
// Puedes editar libremente las preguntas, opciones y tareas de este archivo.

export const DIAS_SPRINT = 5
export const CAPACIDAD_BASE = 3 // movimientos por día
export const LIMITE_EN_PROGRESO = 3 // límite WIP para la columna "En progreso"

export const PUNTOS = {
  tareaTerminada: 100,
  standupCorrecto: 50,
  eventoCorrecto: 75,
  revisionCorrecta: 50,
}

export const COLUMNAS = [
  { id: 'todo', nombre: 'Por hacer', ayuda: 'Aún no se inician' },
  { id: 'doing', nombre: 'En progreso', ayuda: 'Iniciadas, sin concluir' },
  { id: 'test', nombre: 'En prueba', ayuda: 'Concluidas, en evaluación' },
  { id: 'done', nombre: 'Terminado', ayuda: 'Evaluadas satisfactoriamente' },
]

export const PROYECTO = 'App de préstamos de la biblioteca'

export const HISTORIAS = [
  { id: 'H1', titulo: 'Iniciar sesión con el código estudiantil', color: 'amarillo' },
  { id: 'H2', titulo: 'Buscar libros del catálogo', color: 'rosa' },
  { id: 'H3', titulo: 'Reservar un libro', color: 'azul' },
]

export const TAREAS = [
  { id: 'T1', historia: 'H1', titulo: 'Formulario de inicio de sesión' },
  { id: 'T2', historia: 'H1', titulo: 'Validar código y contraseña' },
  { id: 'T3', historia: 'H2', titulo: 'Barra de búsqueda' },
  { id: 'T4', historia: 'H2', titulo: 'Filtro por autor' },
  { id: 'T5', historia: 'H3', titulo: 'Botón "Reservar"' },
  { id: 'T6', historia: 'H3', titulo: 'Correo de confirmación' },
]

// ───────── Daily Standup (se eligen 5 al azar, una por día) ─────────
// tipo "pregunta": ¿a cuál de las tres preguntas diarias responde lo que dice el compañero?
export const STANDUP = [
  {
    id: 's1',
    ordenFijo: true, // las tres preguntas siempre en su orden
    persona: 'Laura',
    dice: 'Desde la reunión de ayer terminé el formulario y lo pasé a prueba.',
    pregunta: '¿A cuál de las tres preguntas diarias está respondiendo Laura?',
    opciones: ['¿Qué he hecho desde la última reunión?', '¿Qué tengo planeado hacer antes de la siguiente reunión?', '¿Qué impedimentos estoy enfrentando?'],
    correcta: 0,
    explicacion: 'Habla de lo que ya hizo desde la última reunión.',
  },
  {
    id: 's2',
    ordenFijo: true, // las tres preguntas siempre en su orden
    persona: 'Andrés',
    dice: 'No puedo avanzar con el correo porque el servidor de pruebas está caído.',
    pregunta: '¿A cuál de las tres preguntas diarias está respondiendo Andrés?',
    opciones: ['¿Qué he hecho desde la última reunión?', '¿Qué tengo planeado hacer antes de la siguiente reunión?', '¿Qué impedimentos estoy enfrentando?'],
    correcta: 2,
    explicacion: 'Es un obstáculo. El Scrum Master debe registrarlo en el Impediment Log.',
  },
  {
    id: 's3',
    ordenFijo: true, // las tres preguntas siempre en su orden
    persona: 'Camila',
    dice: 'Hoy voy a empezar el filtro por autor y espero tenerlo para mañana.',
    pregunta: '¿A cuál de las tres preguntas diarias está respondiendo Camila?',
    opciones: ['¿Qué he hecho desde la última reunión?', '¿Qué tengo planeado hacer antes de la siguiente reunión?', '¿Qué impedimentos estoy enfrentando?'],
    correcta: 1,
    explicacion: 'Describe lo que planea hacer antes de la siguiente reunión.',
  },
  {
    id: 's4',
    persona: 'El Scrum Master',
    dice: 'Llevamos 40 minutos en el Daily Standup discutiendo la base de datos.',
    pregunta: '¿Qué debería pasar?',
    opciones: ['Seguir hasta resolverlo; es importante', 'Cerrar el Standup (dura 15 min) y tratar el tema aparte con los interesados', 'Cancelar los Standups del resto del sprint'],
    correcta: 1,
    explicacion: 'El Daily Standup está limitado a 15 minutos; las discusiones técnicas van después.',
  },
  {
    id: 's5',
    persona: 'Mateo',
    dice: 'Este semestre trabajo desde Cúcuta y no puedo ir al salón.',
    pregunta: '¿Cómo participa Mateo en el Daily Standup?',
    opciones: ['Envía un correo con su avance una vez por semana', 'Por videoconferencia, para comunicarse cara a cara', 'No participa; solo asisten los que están en el war room'],
    correcta: 1,
    explicacion: 'Si el equipo no está co-ubicado, se usa videoconferencia para mantener la comunicación cara a cara.',
  },
  {
    id: 's6',
    persona: 'Valentina',
    dice: '¿Qué se actualiza al terminar el Daily Standup?',
    pregunta: 'Elige las salidas del proceso 10.2 Realizar Daily Standup.',
    opciones: ['Sprint Burndown Chart e Impediment Log', 'Backlog Priorizado del Producto', 'Historias de usuario y criterios de aceptación'],
    correcta: 0,
    explicacion: 'Las salidas de 10.2 son el Sprint Burndown Chart y el Impediment Log actualizados.',
  },
  {
    id: 's7',
    persona: 'Sebastián',
    dice: 'Mi licencia del editor de diseño se venció y no puedo exportar las pantallas.',
    pregunta: '¿Qué tipo de impedimento es?',
    opciones: ['Interno: es un problema de comunicación del equipo', 'Externo: depende de algo fuera del equipo (licencias de software)', 'No es un impedimento, es una tarea más'],
    correcta: 1,
    explicacion: 'Las licencias de software son un ejemplo típico de impedimento externo.',
  },
  {
    id: 's8',
    persona: 'Daniela',
    dice: '¿Quién anota los impedimentos que salen en la reunión?',
    pregunta: '¿Quién registra los impedimentos en el Impediment Log?',
    opciones: ['El Product Owner', 'El Scrum Master', 'El stakeholder principal'],
    correcta: 1,
    explicacion: 'El Scrum Master registra los impedimentos en el Impediment Log y ayuda a eliminarlos.',
  },
  {
    id: 's9',
    persona: 'Julián',
    dice: 'Todos estamos en la universidad esta semana. ¿Dónde hacemos el Standup?',
    pregunta: '¿Cuál es la mejor opción?',
    opciones: ['En un war room: el equipo co-ubicado, sin cubículos, con notas adhesivas y cara a cara', 'Por el chat del grupo, cada uno desde su casa', 'Cada uno en su puesto, enviando un correo al Scrum Master'],
    correcta: 0,
    explicacion: 'Lo ideal es un equipo co-ubicado en un war room, comunicándose cara a cara.',
  },
]

// ───────── Eventos del día (uno al final de cada día) ─────────
// efecto ante respuesta incorrecta:
//  "capacidad": el equipo pierde 1 movimiento mañana
//  "bloqueo":   una tarea en progreso queda bloqueada mañana
//  "rechazo":   el entregable en prueba es rechazado y vuelve a Por hacer
export const EVENTOS = [
  {
    id: 'e1',
    titulo: 'Licencia vencida',
    texto: 'La licencia del entorno de desarrollo expiró en dos equipos.',
    opciones: ['Seguir sin decir nada y usar una versión pirata', 'Plantearlo en el Standup; el Scrum Master lo registra en el Impediment Log y lo gestiona', 'Esperar a la retrospectiva para comentarlo'],
    correcta: 1,
    efecto: 'capacidad',
    explicacion: 'Un impedimento externo se hace visible y el Scrum Master lo registra y gestiona.',
  },
  {
    id: 'e2',
    titulo: 'Trabajo duplicado',
    texto: 'Dos integrantes programaron la misma validación sin saberlo.',
    opciones: ['Es un impedimento interno (falta de comunicación): se visibiliza en el Scrumboard y en el Standup', 'Que cada uno conserve su versión', 'Asignar todas las tareas por correo para evitarlo'],
    correcta: 0,
    efecto: 'bloqueo',
    explicacion: 'La falta de comunicación es un impedimento interno; el Scrumboard da transparencia sobre quién hace qué.',
  },
  {
    id: 'e3',
    titulo: 'Código enredado',
    texto: 'La búsqueda funciona, pero tiene código repetido y nombres confusos.',
    opciones: ['Reescribirla cambiando lo que hace', 'Refactorizar: mejorar el diseño sin cambiar el comportamiento', 'Dejarla así; si funciona no se toca'],
    correcta: 1,
    efecto: 'capacidad',
    explicacion: 'Refactorizar elimina código repetido, simplifica nombres y divide rutinas sin cambiar el comportamiento.',
  },
  {
    id: 'e4',
    titulo: 'Falla en prueba',
    texto: 'Una tarea que estaba en prueba no cumple los criterios de aceptación.',
    opciones: ['Moverla a Terminado igual para no atrasarse', 'Corregirla antes de darla por terminada: solo pasa a Terminado lo evaluado satisfactoriamente', 'Borrarla del Scrumboard'],
    correcta: 1,
    efecto: 'rechazo',
    requiere: 'test',
    explicacion: 'Terminado significa evaluado satisfactoriamente. Un entregable rechazado vuelve al Backlog.',
  },
  {
    id: 'e5',
    titulo: 'Nueva idea del Product Owner',
    texto: 'A mitad del sprint, el Product Owner quiere agregar "recomendaciones de libros".',
    opciones: ['Meterla ya en el sprint actual', 'Agregarla al Backlog Priorizado del Producto para refinarla y priorizarla', 'Rechazarla para siempre'],
    correcta: 1,
    efecto: 'capacidad',
    explicacion: 'Los cambios aprobados se incorporan al Backlog en el refinamiento (10.3), no al sprint en curso.',
  },
  {
    id: 'e6',
    titulo: 'Historia ambigua',
    texto: 'Nadie tiene claro cuándo se considera "reservado" un libro.',
    opciones: ['Que cada uno lo interprete a su manera', 'Revisar la historia y sus criterios de aceptación con el Product Owner', 'Saltarse esa historia sin avisar'],
    correcta: 1,
    efecto: 'bloqueo',
    explicacion: 'En el refinamiento se entienden las historias de usuario y sus criterios de aceptación.',
  },
  {
    id: 'e7',
    titulo: 'Problema conocido',
    texto: 'El equipo vuelve a necesitar validar formularios, igual que en otro proyecto.',
    opciones: ['Reinventar la solución desde cero', 'Aplicar un patrón de diseño que registre esa solución reutilizable', 'Copiar y pegar el código en cada formulario'],
    correcta: 1,
    efecto: 'capacidad',
    explicacion: 'Los patrones de diseño registran soluciones reutilizables a problemas recurrentes.',
  },
  {
    id: 'e8',
    titulo: '¿Cómo vamos?',
    texto: 'Un stakeholder pregunta cuánto trabajo le queda al sprint.',
    opciones: ['Mostrarle el Sprint Burndown Chart y el Scrumboard', 'Decirle que espere al final del proyecto', 'Enviarle el código fuente'],
    correcta: 0,
    efecto: 'capacidad',
    explicacion: 'El Burndown Chart y el Scrumboard hacen visible el avance del sprint.',
  },
  {
    id: 'e9',
    titulo: 'Historia que sobra',
    texto: 'En la revisión del Backlog descubren que "Imprimir el catálogo en PDF" ya no le interesa a nadie.',
    opciones: ['Mantenerla por si acaso', 'Depurarla: eliminarla del Backlog Priorizado del Producto', 'Ponerla como la de mayor prioridad'],
    correcta: 1,
    efecto: 'capacidad',
    explicacion: 'En el refinamiento se depuran (eliminan) las historias de usuario irrelevantes.',
  },
]

// ───────── Revisión final (se eligen 4 al azar) ─────────
export const REVISION = [
  {
    id: 'r1',
    pregunta: 'Una tarea no se terminó o su entregable fue rechazado. ¿Qué pasa con ella?',
    opciones: ['Se elimina del proyecto', 'Vuelve al Backlog y se prioriza para el siguiente sprint', 'Se entrega igual'],
    correcta: 1,
  },
  {
    id: 'r2',
    pregunta: '¿Cuáles son las salidas de 10.1 Crear entregables?',
    opciones: ['Entregables del sprint, Scrumboard e Impediment Log actualizados', 'Backlog Priorizado del Producto actualizado', 'La visión del proyecto'],
    correcta: 0,
  },
  {
    id: 'r3',
    pregunta: '¿Cuáles son las entradas de 10.2 Realizar Daily Standup?',
    opciones: ['Product Owner y stakeholders', 'Equipo Scrum, Scrum Master, Sprint Burndown Chart e Impediment Log', 'Entregables rechazados'],
    correcta: 1,
  },
  {
    id: 'r4',
    pregunta: '¿Qué se obtiene de 10.3 Refinar el Backlog Priorizado del Producto?',
    opciones: ['Sprint Burndown Chart actualizado', 'Entregables del sprint', 'Backlog Priorizado del Producto actualizado'],
    correcta: 2,
  },
  {
    id: 'r5',
    pregunta: '¿Qué pasa con el Scrumboard al terminar el sprint?',
    opciones: ['Se reinicia y se crea uno nuevo', 'Se archiva y no se vuelve a usar Scrum', 'Se entrega al cliente'],
    correcta: 0,
  },
  {
    id: 'r6',
    pregunta: '¿Cuál es la herramienta de 10.3 Refinar el Backlog?',
    opciones: ['El Daily Standup', 'La reunión de revisión del Backlog Priorizado del Producto', 'La refactorización'],
    correcta: 1,
  },
  {
    id: 'r7',
    pregunta: 'En 10.1 Crear entregables, ¿quién decide cómo convertir el backlog en producto?',
    opciones: ['El stakeholder', 'El equipo, con su experiencia', 'El Scrum Master por su cuenta'],
    correcta: 1,
  },
  {
    id: 'r8',
    pregunta: 'En la reunión de revisión del Backlog, ¿qué se hace con las historias de usuario irrelevantes?',
    opciones: ['Se pasan al siguiente sprint', 'Se depuran: se eliminan', 'Se convierten en impedimentos'],
    correcta: 1,
  },
  {
    id: 'r9',
    pregunta: '¿Cuáles son las entradas de 10.3 Refinar el Backlog Priorizado del Producto?',
    opciones: ['Equipo principal de Scrum y Backlog Priorizado del Producto', 'Sprint Burndown Chart e Impediment Log', 'Scrumboard y entregables del sprint'],
    correcta: 0,
  },
]
