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
- **Video del hero** (`src/components/Hero.astro`): `hero-broll.mp4` está versionado pero **no montado** — pendiente re-edición con Higgsfield (tiene branding viejo de Element Logic). Cuando esté listo, descomentar el `<video>` del Hero. Conviene comprimirlo a < 3–4 MB.
- **Dominio** definitivo (.cl o .com) → actualizar `site` en `astro.config.mjs`.
- **i18n** (inglés): la estructura está preparada, v1 es solo español.

## Despliegue

Sitio estático: compatible con **Vercel**, **Netlify** o **Cloudflare Pages** (deploy automático desde el repo). Build command: `npm run build` · Output: `dist/`.

## Git

Repo: `https://github.com/in-evogit/iso` (org `in-evogit`). Este repo usa una identidad git **local** propia de InEvolution (no afecta la configuración global de tu máquina).

```bash
git pull            # traer cambios del equipo
git add . && git commit -m "..."   # commitear
git push            # subir
```

> `referencias/` (material fuente pesado: PPT, extracciones) está en `.gitignore` y no se versiona.
