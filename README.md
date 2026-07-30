# SDI Systems — Sitio web corporativo

Landing de una sola página para **SDI Systems** (automatización e intralogística para centros de distribución en LATAM/Chile). Construido con **Astro** (estático) + CSS con variables de marca. Cliente: Ariel · Agencia: InEvolution.

## Stack

- **Astro 6** (estático; la única ruta que corre en servidor es `/api/contacto`).
- **CSS** con custom properties (`src/styles/global.css`) — sin frameworks pesados.
- **Inter** vía `@fontsource/inter`.
- Formulario de contacto vía **endpoint propio + Resend** (ya no Formspree) + WhatsApp + email.

## Requisitos

- Node.js 18+ (probado con Node 25).

## Correr en local

```bash
npm install      # instalar dependencias (solo la primera vez)
npm run dev      # servidor local → http://localhost:4321
npm run build    # build de producción → carpeta dist/
npm run preview  # previsualizar el build de producción
```

## Estructura

```
src/
├── components/      # Navbar, Hero, SobreEmpresa, Soluciones, Servicios,
│                    # Industrias, Casos, PorQue, Contacto, Footer
├── layouts/
│   └── Layout.astro # <head>, SEO/Open Graph, fuentes, observer de animaciones
├── pages/
│   └── index.astro  # ensambla todas las secciones
└── styles/
    └── global.css   # paleta de marca + estilos base

public/assets/
├── logos/           # Iso.png, Logo1.png, Logo2.png
├── clientes/        # logos de clientes (muro "Empresas que confían")
├── img/casos/       # fotos reales de proyectos (Dimerc, Soprole, PF Alimentos)
└── video/           # hero-broll.mp4, globo-latam.mp4
```

## Identidad de marca

Paleta extraída de los logos de SDI (definida en `src/styles/global.css`):

| Variable | HEX | Uso |
|---|---|---|
| `--brand-blue` | `#426E9A` | Primario: links, íconos, acentos |
| `--brand-gold` | `#DC9A16` | CTA, subrayados, highlights |
| `--brand-gray` | `#848484` | Texto secundario, líneas |
| `--brand-navy` | `#2C2C42` | Títulos, navbar, footer |
| `--bg-light` | `#F4F6F8` | Fondo de secciones |

> El texto del sitio es el copy real entregado por Ariel (se puede pulir redacción, no cambiar el contenido).

## Pendientes / por definir con Ariel

Buscar los marcadores en el código:

- **Datos de contacto** (`src/components/Contacto.astro` y `Footer.astro`): WhatsApp, email y endpoint de Formspree son **placeholders**.
  - Formspree: reemplazar `https://formspree.io/f/TU_FORM_ID` por el ID real (crear formulario en [formspree.io](https://formspree.io)).
  - WhatsApp: reemplazar `56900000000` por el número real.
  - Email: reemplazar `contacto@sdisystems.cl`.
- **Video del hero** (`src/components/Hero.astro`): montado como fondo (`hero-loop.mp4` + poster `hero-poster.jpg`). En la carpeta también está `hero-full.mp4` por si se prefiere esa versión.
- **Dominio** definitivo (.cl o .com) → actualizar `site` en `astro.config.mjs`.
- **i18n** (inglés): la estructura está preparada, v1 es solo español.

## Formulario de contacto — configuración pendiente

El formulario (`src/components/Contacto.astro`) envía a `src/pages/api/contacto.ts`,
que despacha el correo con **Resend**. El código está listo y probado; **falta la
cuenta y los registros DNS**. Hasta entonces el formulario valida todo bien pero
muestra "No pudimos enviar el mensaje, escríbenos por WhatsApp".

### Estado del dominio (verificado 30-jul-2026 vía NIC Chile y consultas DNS)

| Pieza | Dónde está |
|---|---|
| Dominio `sdisystems.cl` | Registrado, a nombre de SDI |
| DNS | **Cloudflare** (`ezra.ns.cloudflare.com`, `phoenix.ns.cloudflare.com`) |
| Correo corporativo | **Microsoft 365** (MX → `sdisystems-cl.mail.protection.outlook.com`) |
| Web | **Sin apuntar**: el dominio no resuelve ningún sitio todavía |
| `soporte.sdisystems.cl` | CNAME → `elementone.jitbit.com` (helpdesk Jitbit) |

### Pasos para dejarlo andando

1. **Resend** (crear en la cuenta de in-evogit): verificar el dominio. Conviene
   usar un **subdominio de envío** para no tocar la configuración de Microsoft 365.
   Entrega 3 valores DNS.
2. **Vercel**: agregar `sdisystems.cl` al proyecto. Entrega 2 valores DNS.
3. **Cloudflare (panel de SDI)**: pegar ahí los 5 valores. Es el único lugar donde
   se escriben registros DNS — Vercel y Resend solo los emiten.
4. **Vercel → Environment Variables**: `RESEND_API_KEY`, `CONTACTO_TO`,
   `CONTACTO_FROM` (ver `.env.example`).

**NO tocar** estos registros ya existentes, o se cae el correo de la empresa:
`MX → sdisystems-cl.mail.protection.outlook.com`, `TXT v=spf1 include:spf.protection.outlook.com ~all`
y `TXT MS=ms65915511`. Agregar registros no rompe los que ya están.

En Cloudflare, los 2 registros de la web van con el **proxy desactivado (gris,
"DNS only")**. Con la nubecita naranja, Cloudflare se pone delante de Vercel y
se pelean por el certificado TLS.

Para probar sin depender del DNS de SDI: Resend permite el remitente de prueba
`onboarding@resend.dev`, que solo envía al correo dueño de la cuenta.

## Seguridad

- Cabeceras en `vercel.json`: HSTS, CSP, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`.
- Endpoint de contacto: rate limit 5/min por IP (best-effort, la memoria no se
  comparte entre instancias serverless), honeypot, descarte de envíos en menos de
  3 s, límites de largo, escape del contenido antes de armar el HTML del correo,
  y protección CSRF de Astro para POST form-urlencoded.
- La **IP del visitante NO se incluye en el correo**, a propósito: la sección 2 de
  `/politicas-de-datos` declara que se recopilan únicamente nombre, empresa, correo
  y mensaje. Mantener esa coherencia si se agregan campos.
- Las claves viven en variables de entorno de Vercel. `.env` está en `.gitignore`.
- **NO reactivar `security.csp` en `astro.config.mjs`**: rompe el sitio. Ver el
  comentario en ese archivo — la CSP con hashes bloquea los 28 atributos `style=`
  del markup, y `'unsafe-inline'` queda anulado cuando hay hashes presentes.
- `npm audit`: quedan 6 vulnerabilidades de `sharp`, todas de build (no corren en
  producción). Se resuelven al subir a Astro 7, que es cambio mayor.
- Si se agrega analítica o algún widget externo, la CSP lo va a bloquear hasta que
  su dominio se agregue a `vercel.json`.

## Despliegue

**En producción:** 🌐 https://sdi-systems-web.vercel.app

Desplegado en **Vercel** (proyecto `sdi-systems-web`). `referencias/` se excluye vía `.vercelignore`.

El auto-deploy desde `Gscky/sdi-systems-web` **ya no funciona**: la credencial git
local es de in-evogit y no tiene escritura en ese repo (403). Desde julio 2026 se
despliega directo por CLI:

```bash
vercel --prod --yes    # proyecto ya linkeado en .vercel/
```

Con el adaptador de Vercel, el build ya no deja todo en `dist/`: la salida va a
`.vercel/output/` (`static/` con las páginas prerenderizadas y una función para
`/api/contacto`).

> **Pendiente:** el plan Hobby de Vercel prohíbe uso comercial. Hay que pasar a
> **Pro** (US$20/mes, incluye 1 TB de transferencia) antes de publicar. El sitio
> pesa ~219 MB y 211 MB son video, así que el costo real del hosting es el ancho
> de banda, no el HTML.

## Git

Este proyecto vive en **dos repos** (mismo código):

- **`origin`** → `https://github.com/in-evogit/iso` — repo del equipo (org `in-evogit`, identidad git local `in-evogit`).
- **`gscky`** → `https://github.com/Gscky/sdi-systems-web` — copia personal que alimenta el deploy en Vercel.

```bash
# Actualizar el deploy (repo personal Gscky → Vercel auto-deploya):
gh auth switch --user Gscky          # cuenta activa = Gscky
git push gscky main

# Actualizar el repo del equipo (in-evogit):
gh auth switch --user in-evogit      # cuenta activa = in-evogit
git push origin main
```

> Hay varias cuentas de GitHub en `gh`. La **cuenta activa** debe coincidir con el repo al que empujas (Gscky tiene acceso a su repo; in-evogit al suyo).
> `referencias/` (material fuente pesado: PPT, extracciones) está en `.gitignore` y no se versiona.
