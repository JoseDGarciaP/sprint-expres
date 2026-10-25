-- Sprint Exprés · esquema de base de datos para Supabase
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- Puedes volver a ejecutarlo sin perder datos.
--
-- No escribas tu PIN real en este archivo (el repositorio es público).
-- Después de ejecutarlo, cambia el PIN en el SQL Editor de Supabase con:
--   update public.config set valor = crypt('TU_PIN', gen_salt('bf')) where clave = 'admin_pin';

create extension if not exists pgcrypto;

-- ───────── Tablas ─────────
create table if not exists public.ingresos (
  id           uuid primary key,
  nombre       text not null check (char_length(nombre) between 2 and 80),
  codigo       text check (char_length(codigo) <= 20),
  iniciado_en  timestamptz not null default now(),
  navegador    text
);

create table if not exists public.resultados (
  id                 uuid primary key default gen_random_uuid(),
  partida_id         uuid references public.ingresos(id) on delete cascade,
  nombre             text not null check (char_length(nombre) between 2 and 80),
  codigo             text check (char_length(codigo) <= 20),
  puntaje            int  not null check (puntaje between 0 and 5000),
  tareas_terminadas  int  not null check (tareas_terminadas between 0 and 50),
  standup_aciertos   int  not null check (standup_aciertos between 0 and 50),
  eventos_aciertos   int  not null check (eventos_aciertos between 0 and 50),
  revision_aciertos  int  not null check (revision_aciertos between 0 and 50),
  duracion_seg       int  not null check (duracion_seg >= 0),
  detalle            jsonb,
  finalizado_en      timestamptz not null default now()
);

-- Si ejecutaste una versión anterior de este script, ajusta el límite del puntaje.
alter table public.resultados drop constraint if exists resultados_puntaje_check;
alter table public.resultados add constraint resultados_puntaje_check check (puntaje between 0 and 5000);

-- Código estudiantil obligatorio: 7 dígitos que empiezan por 019 (por ejemplo 0192349).
-- NOT VALID: no revisa filas viejas de prueba, pero sí todas las nuevas.
alter table public.ingresos   drop constraint if exists ingresos_codigo_formato;
alter table public.ingresos   add constraint ingresos_codigo_formato
  check (codigo is not null and codigo ~ '^019[0-9]{4}$') not valid;
alter table public.resultados drop constraint if exists resultados_codigo_formato;
alter table public.resultados add constraint resultados_codigo_formato
  check (codigo is not null and codigo ~ '^019[0-9]{4}$') not valid;

create index if not exists resultados_puntaje_idx on public.resultados (puntaje desc, duracion_seg asc);

-- PIN del panel, guardado cifrado dentro de la base de datos (no en la página web).
-- 'scrum2026' es solo el PIN inicial; si la fila ya existe, NO se sobrescribe.
create table if not exists public.config (
  clave text primary key,
  valor text not null
);
insert into public.config (clave, valor)
values ('admin_pin', crypt('scrum2026', gen_salt('bf')))
on conflict (clave) do nothing;

-- ───────── Seguridad (RLS) ─────────
-- Desde la página (rol anon) solo se puede INSERTAR. Nadie puede leer, editar ni borrar las tablas
-- directamente: la lectura pasa por las funciones de abajo.
alter table public.ingresos   enable row level security;
alter table public.resultados enable row level security;
alter table public.config     enable row level security;

drop policy if exists "insertar ingresos"   on public.ingresos;
drop policy if exists "leer ingresos"       on public.ingresos;
drop policy if exists "insertar resultados" on public.resultados;
drop policy if exists "leer resultados"     on public.resultados;

create policy "insertar ingresos"   on public.ingresos   for insert to anon with check (true);
create policy "insertar resultados" on public.resultados for insert to anon with check (true);

-- Permisos explícitos (algunos proyectos nuevos de Supabase no los dan por defecto).
grant usage on schema public to anon;
grant insert on public.ingresos, public.resultados to anon;
revoke all on public.config from anon, authenticated;

-- ───────── Ranking público: solo nombre y puntaje (mejor partida de cada estudiante, por código) ─────────
create or replace function public.ranking(limite int default 10)
returns table (partida_id uuid, nombre text, puntaje int, duracion_seg int)
language sql
security definer
set search_path = public, extensions
as $$
  select partida_id, nombre, puntaje, duracion_seg
  from (
    select distinct on (coalesce(codigo, lower(nombre)))
      partida_id, nombre, puntaje, duracion_seg
    from resultados
    order by coalesce(codigo, lower(nombre)), puntaje desc, duracion_seg asc
  ) mejores
  order by puntaje desc, duracion_seg asc
  limit least(greatest(limite, 1), 50);
$$;

-- ───────── Panel: todos los datos, solo con el PIN correcto ─────────
-- Límite de intentos: tras 5 PIN incorrectos desde la misma conexión, se bloquea 15 minutos.
-- (La conexión se guarda como un hash, no como la IP real.)
create table if not exists public.intentos_panel (
  id      bigserial primary key,
  origen  text not null,
  momento timestamptz not null default now()
);
create index if not exists intentos_panel_origen_idx on public.intentos_panel (origen, momento);
alter table public.intentos_panel enable row level security;
revoke all on public.intentos_panel from anon, authenticated;

-- La función ya no lanza error con un PIN incorrecto: responde {"error": ...}
-- para que el intento fallido quede registrado (un error desharía el registro).
drop function if exists public.panel_datos(text);
create function public.panel_datos(pin text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  max_fallos constant int := 5;
  ventana    constant interval := interval '15 minutes';
  guardado text;
  quien    text;
  fallos   int;
  primero  timestamptz;
begin
  quien := md5(coalesce(
    nullif(trim(split_part(current_setting('request.headers', true)::json->>'x-forwarded-for', ',', 1)), ''),
    'sin-origen'));

  delete from intentos_panel where momento < now() - interval '1 day';

  select count(*), min(momento) into fallos, primero
  from intentos_panel
  where origen = quien and momento > now() - ventana;

  if fallos >= max_fallos then
    return json_build_object(
      'error', 'bloqueado',
      'minutos', greatest(1, ceil(extract(epoch from (primero + ventana - now())) / 60))::int);
  end if;

  select valor into guardado from config where clave = 'admin_pin';
  if guardado is null or pin is null or crypt(pin, guardado) <> guardado then
    insert into intentos_panel (origen) values (quien);
    return json_build_object('error', 'pin', 'restantes', max_fallos - fallos - 1);
  end if;

  delete from intentos_panel where origen = quien;
  return json_build_object(
    'ingresos',   coalesce((select json_agg(i order by i.iniciado_en desc) from ingresos i), '[]'::json),
    'resultados', coalesce((select json_agg(r order by r.puntaje desc) from resultados r), '[]'::json)
  );
end;
$$;

-- Si alguien te bloquea a propósito, desbloquea todo ejecutando:
--   delete from public.intentos_panel;

revoke all on function public.ranking(int)      from public;
revoke all on function public.panel_datos(text) from public;
grant execute on function public.ranking(int)      to anon;
grant execute on function public.panel_datos(text) to anon;

-- ───────── Vista para revisar desde el propio Supabase (Table Editor / SQL Editor) ─────────
drop view if exists public.resumen_partidas;
create view public.resumen_partidas with (security_invoker = on) as
select
  i.nombre,
  i.codigo,
  i.iniciado_en,
  r.finalizado_en,
  case when r.id is null then 'No terminó' else 'Terminó' end as estado,
  r.puntaje,
  r.tareas_terminadas,
  r.standup_aciertos,
  r.eventos_aciertos,
  r.revision_aciertos,
  r.duracion_seg
from public.ingresos i
left join public.resultados r on r.partida_id = i.id
order by i.iniciado_en desc;
revoke all on public.resumen_partidas from anon, authenticated;

-- Para borrar todas las partidas de prueba antes de la clase, ejecuta (con cuidado):
--   truncate public.resultados, public.ingresos;
