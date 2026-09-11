# Tu espacio — InterRenta

Landing de captación para **locales y oficinas** en el Oriente Antioqueño. Una
pantalla: un portal tipográfico que se atraviesa con scroll y, al otro lado, un
formulario corto.

- **Producción:** https://tuespacio.interrenta.com
- **Stack:** Vite + React 19 + TypeScript · Tailwind CSS v4 · Supabase
- **Despliegue:** Vercel (auto-deploy desde `main`)

---

## Cómo funciona

La página es un solo componente compuesto:

1. **`GlyphPortal`** dibuja la palabra `ESPACIO` sobre papel blanco y la usa como
   máscara. Al hacer scroll, la cámara entra por una letra hasta que el campo
   teal llena la pantalla.
2. Al otro lado aparece **`LeadForm`**, una tarjeta blanca sobre ese campo.
3. Al enviar, los datos van a Supabase y se ofrece continuar por WhatsApp con el
   mensaje ya armado.

Quien no quiera hacer scroll tiene el botón **"Ir al formulario"** siempre visible.

### Sobre `GlyphPortal`

Es un componente de terceros (MIT, © Christian Katzmann). Lleva **un cambio
local**: su guard anti-bloqueo medía el tiempo hasta el primer frame desde el
montaje, y una pestaña en segundo plano no recibe frames — así que la animación
quedaba desactivada toda la visita. Ahora el cronómetro arranca cuando la pestaña
se vuelve visible. Ver `wake` en `src/components/ui/glyph-portal.tsx`.

---

## Estructura

```
src/
├── assets/
│   ├── logo-interrenta.png       Lockup completo, variante fondo claro
│   └── logo-interrenta-mark.png  Marca compacta (solo "INTER" dorado)
├── components/ui/
│   ├── glyph-portal.tsx     Portal tipográfico (vendored, MIT)
│   └── lead-form.tsx        Formulario + estado de éxito
├── services/lead.service.ts Insert en Supabase + link de WhatsApp
├── lib/utils.ts             Helper cn()
├── App.tsx                  Composición y carga de tipografías
└── index.css                Tokens de marca + overrides del portal
```

### Sobre los logos

Ambos archivos son **recortes del logo original** (`LogointerrentaTransparente.png`
del sitio principal), sin recolorear: la página es oscura, que es justo el fondo
para el que ese logo fue diseñado.

- `logo-interrenta-mark.png` — solo la parte dorada. Se usa en el encabezado y en
  el formulario, donde el lockup completo quedaría ilegible por tamaño.
- `logo-interrenta.png` — lockup completo con "Renta" y el tagline. Solo en la
  pantalla de éxito, que es donde hay espacio para que se lea.

Los favicons (`public/favicon.ico` y `public/favicon.png`) son copia de los de
interrenta.com, para que ambos dominios se vean igual en la pestaña.

### Sobre Supabase

No se usa `@supabase/supabase-js`. La página hace **un solo INSERT**, y el SDK
pesaba ~215 kB por auth, realtime y storage que aquí no se tocan. `lead.service.ts`
va directo a la REST API con `fetch`.

---

## Variables de entorno

Copia `.env.example` a `.env`:

| Variable | Uso |
|---|---|
| `VITE_SUPABASE_URL` | Cliente Supabase |
| `VITE_SUPABASE_ANON_KEY` | Cliente Supabase (protegida por RLS) |

Sin credenciales el formulario sigue funcionando: omite el guardado y pasa
directo a WhatsApp.

---

## Base de datos

```sql
create table if not exists public.leads_espacios (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  nombre      text,
  email       text,
  telefono    text,
  empresa     text,
  destinacion text,
  detalle     text,
  source      text default 'tuespacio'
);

alter table public.leads_espacios enable row level security;

-- El sitio (anon) puede insertar, pero no leer
create policy "leads_espacios_insert_anon"
  on public.leads_espacios for insert to anon
  with check (true);
```

---

## Ejecutar en local

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción → dist/
npm run preview  # sirve el build localmente
```

Requiere **Node 20.19+ o 22+**.

---

## Diseño

| Uso | Hex |
|---|---|
| Fondo | `#161616` |
| Tarjeta | `#1f1f1f` · campos `#262525` |
| Bordes | `#333333` |
| Títulos | `#e2e2e2` |
| Cuerpo | `#b8bcc8` · apagado `#9aa0ad` |
| Dorado | `#ecb337` · `#f5d170` · `#d7af4d` |

La palabra del portal no es de un color plano: las letras son una ventana al
campo que hay detrás, un degradado que va de blanco arriba-izquierda a dorado
abajo-derecha. Al atravesar la letra, ese mismo campo llena la pantalla y la
tarjeta oscura del formulario queda flotando encima.

**Tipografías:** Cormorant Garamond (títulos) · Inter (cuerpo y la palabra del
portal, en peso 900 — el recorte necesita trazo grueso).
