# SDI Systems — Sitio web corporativo

Landing de una sola página para **SDI Systems** (automatización e intralogística para centros de distribución en LATAM/Chile). Construido con **Astro** (estático) + CSS con variables de marca. Cliente: Ariel · Agencia: InEvolution.

## Stack

- **Astro 6** (sitio estático, sin backend).
- **CSS** con custom properties (`src/styles/global.css`) — sin frameworks pesados.
- **Inter** vía `@fontsource/inter`.
- Formulario de contacto vía **Formspree** (endpoint configurable) + WhatsApp + email.

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

## Despliegue

**En producción:** 🌐 https://sdi-systems-web.vercel.app

Desplegado en **Vercel** (proyecto `sdi-systems-web`), con **auto-deploy** conectado al repo `Gscky/sdi-systems-web`: cada push a `main` de ese repo genera un nuevo deploy. Build command: `npm run build` · Output: `dist/` (Vercel autodetecta Astro). `referencias/` se excluye vía `.vercelignore`.

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
