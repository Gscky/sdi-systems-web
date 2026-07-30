// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Dominio definitivo pendiente de Ariel (.cl o .com). Se usa para SEO/canonical y sitemap.
  site: 'https://sdisystems.cl',
  // v1 solo espanol. Estructura preparada para agregar i18n (ingles) mas adelante.

  // El sitio sigue siendo ESTATICO: todas las paginas se prerenderizan igual que
  // antes (index y politicas-de-datos salen como HTML). El adaptador existe solo
  // para /api/contacto, la unica ruta que corre en servidor (prerender = false).
  adapter: vercel(),

  // NOTA sobre CSP: se probo `security.csp` de Astro (genera un <meta> con el
  // hash de cada script y estilo) y NO sirve para este sitio. El sitio usa
  // atributos style= inline para los delays de las animaciones, y la CSP no
  // cubre atributos con hashes: en cuanto hay un hash en style-src el navegador
  // ignora 'unsafe-inline' y bloquea los 25 atributos style= de la portada
  // (verificado en Chrome: "Applying inline style violates... has been blocked").
  // La CSP del sitio vive en las cabeceras de vercel.json. NO reactivar aqui
  // sin sacar antes todos los atributos style= del markup.
});
