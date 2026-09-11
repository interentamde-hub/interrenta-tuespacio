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

supabase/functions/
└── notify-lead/index.ts     Aviso por correo (SMTP Titan), lo dispara un webhook
```

### Sobre los logos

La página tiene dos mitades de distinto color, y el logo no sirve igual para
ambas: su "INTER" es dorado, pero "Renta" y el tagline son **blancos**.

- `logo-interrenta.png` — el archivo original de interrenta.com, **sin
  modificar**. Va en la portada oscura, que es el fondo para el que fue
  diseñado. Se renderiza con `object-contain` porque el PNG trae márgenes
  transparentes generosos.
- `logo-interrenta-light.png` — el mismo lockup con el blanco recoloreado a
  `#161616`. Solo para la pantalla de éxito, que es blanca; sin recolorear, la
  mitad inferior del logo sería invisible.

No uses una versión recortada en la portada: deja fuera "Renta" y el logo se ve
partido.

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

## Aviso por correo

Cada INSERT en `leads_espacios` dispara un **Database Webhook** que llama a la
Edge Function `notify-lead`, y esta envía el aviso con la **API de Resend**.

```
INSERT en leads_espacios
  └─> Database Webhook (trigger pg_net)
        └─> Edge Function notify-lead  (supabase/functions/notify-lead/)
              └─> api.resend.com/emails
                    └─> correo a NOTIFY_TO
```

> Se intentó primero con SMTP de Titan. Titan bloquea la contraseña normal en
> SMTP cuando la cuenta tiene verificación en dos pasos y exige una contraseña
> de aplicación, así que el envío fallaba con `535 5.7.8`. Resend evita esa
> dependencia: autentica con una clave de API, no con credenciales de buzón.

El correo lleva `Reply-To` con la dirección del interesado, así que responder
desde tu bandeja le escribe directamente a él, y un botón que abre WhatsApp con
su número ya formateado.

### 1. Desplegar la función

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase functions deploy notify-lead
```

El `PROJECT_REF` es el subdominio de tu `VITE_SUPABASE_URL`
(`https://<PROJECT_REF>.supabase.co`).

> **En PowerShell usa `npx.cmd`, no `npx`.** El segundo resuelve a `npx.ps1`, que
> pasa por la directiva de ejecución; si está en `Restricted` falla con
> `UnauthorizedAccess`. El `.cmd` la evita sin tener que cambiar ajustes de
> seguridad del sistema.

### 2. Cargar los secretos

**Nunca los pongas en el repositorio.** Van como secretos del proyecto, en
Supabase → **Edge Functions** → **Secrets**, o por CLI:

| Secreto | Valor |
|---|---|
| `RESEND_API_KEY` | Clave de API de Resend (`re_...`) |
| `MAIL_FROM` | Remitente, ej. `InterRenta <avisos@interrenta.com>` |
| `NOTIFY_TO` | Destinatario. Acepta varios separados por coma |

La función falla con `Falta el secreto X` si alguno no está, en vez de enviar a
medias.

**Sobre `MAIL_FROM`:** el dominio tiene que estar verificado en Resend (añade
unos registros DNS en interrenta.com, que se administran desde Vercel). Mientras
no lo esté, usa `onboarding@resend.dev`, que funciona sin verificar pero **solo
entrega al correo dueño de la cuenta de Resend** — sirve para probar la cadena
completa antes de tocar el DNS.

### 3. Crear el webhook

En Supabase → **Integrations** → **Webhooks** → **Create a new hook**
(`/dashboard/project/<PROJECT_REF>/integrations/webhooks/overview`; en paneles
antiguos estaban bajo *Database*, ya no):

- **Table:** `public.leads_espacios`
- **Events:** solo `Insert`
- **Type:** `Supabase Edge Functions`
- **Edge Function:** `notify-lead`
- **Method:** `POST`

Hazlo desde esta interfaz y no por SQL: así Supabase añade sola la cabecera
`Authorization`, y la llave de servicio no queda escrita en la definición del
trigger.

### 4. Verificar

Llena el formulario y revisa:

- **Edge Functions → notify-lead → Logs** — la invocación y cualquier error SMTP.
- **Database → Webhooks → el hook → Logs** — si el disparo salió.

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

La página va de oscuro a claro: la portada es negra, el formulario blanco.

| Uso | Hex |
|---|---|
| Portada — fondo | `#161616` |
| Portada — títulos / cuerpo | `#e2e2e2` · `#b8bcc8` · apagado `#9aa0ad` |
| Formulario — fondo / campos | `#ffffff` · `#faf9f7` |
| Formulario — texto | `#161616` · `#3d3d3d` · apagado `#6b7280` |
| Bordes claros | `#e6e4df` |
| Dorado | `#ecb337` · `#f5d170` · `#d7af4d` |

La palabra del portal no tiene color propio: las letras son una ventana al campo
que hay detrás, un degradado con núcleo blanco y dorado en los bordes. El núcleo
está donde entra la cámara, así que el zoom desemboca en blanco — y sobre eso se
funde el panel del formulario, que lleva fondo blanco sólido. Por eso el
degradado nunca se ve detrás del formulario.

**Tipografías:** Cormorant Garamond (títulos) · Inter (cuerpo y la palabra del
portal, en peso 900 — el recorte necesita trazo grueso).
