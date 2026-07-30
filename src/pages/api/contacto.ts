import type { APIRoute } from "astro";
import { Resend } from "resend";

// Endpoint del formulario de contacto.
//
// Reemplaza a Formspree: el correo lo envia Resend desde el dominio de SDI, asi
// que a la bandeja de ventas llega como correo de la empresa (no como aviso de
// un servicio externo) y el "Responder" va directo al visitante.
//
// Esta es la UNICA ruta del sitio que corre en servidor; el resto sigue estatico.
export const prerender = false;

// Variables de entorno (se configuran en Vercel, nunca en el repo):
//   RESEND_API_KEY  clave de la cuenta de Resend
//   CONTACTO_TO     destinatarios de los leads, separados por coma
//   CONTACTO_FROM   remitente verificado en Resend
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
const TO = (import.meta.env.CONTACTO_TO ?? process.env.CONTACTO_TO ?? "contacto@sdisystems.cl")
  .split(",")
  .map((d: string) => d.trim())
  .filter(Boolean);
const FROM =
  import.meta.env.CONTACTO_FROM ??
  process.env.CONTACTO_FROM ??
  "Web SDI Systems <web@sdisystems.cl>";

const LIMITES = {
  nombre: 120,
  empresa: 160,
  email: 200,
  mensaje: 4000,
};

// Rate limit best-effort: en serverless la memoria no se comparte entre
// instancias, asi que esto no es una defensa fuerte — corta el flood obvio
// desde una misma IP y se complementa con el honeypot y el control de tiempo.
// 5 por minuto y por IP: corta el flood sin molestar a un visitante real ni a
// varias personas que compartan la IP de salida de una misma empresa.
const VENTANA_MS = 60_000;
const MAX_POR_VENTANA = 5;
const golpes = new Map<string, number[]>();

function pasaRateLimit(ip: string): boolean {
  const ahora = Date.now();
  const previos = (golpes.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  if (previos.length >= MAX_POR_VENTANA) return false;
  previos.push(ahora);
  golpes.set(ip, previos);
  // Poda para que el Map no crezca sin techo mientras vive la instancia.
  if (golpes.size > 500) {
    for (const [k, v] of golpes) {
      if (v.every((t) => ahora - t >= VENTANA_MS)) golpes.delete(k);
    }
  }
  return true;
}

function esEmailValido(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

// Todo lo que escribe el visitante se escapa antes de entrar al HTML del correo:
// sin esto, un mensaje con etiquetas podria inyectar markup en la bandeja de SDI.
function escapar(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function json(estado: number, cuerpo: Record<string, unknown>): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json" },
  });
}

// El POST clasico (sin JS) espera navegacion, no JSON: se le responde con una
// pagina simple. El fetch del sitio recibe JSON.
function responder(
  esFormPlano: boolean,
  estado: number,
  cuerpo: { ok: boolean; error?: string }
): Response {
  if (!esFormPlano) return json(estado, cuerpo);

  const titulo = cuerpo.ok ? "Mensaje enviado" : "No pudimos enviar tu mensaje";
  const detalle = cuerpo.ok
    ? "Gracias por escribirnos. Te contactaremos a la brevedad."
    : escapar(cuerpo.error ?? "Intenta de nuevo o escribenos por WhatsApp.");

  return new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${titulo} | SDI Systems</title></head>
      <body style="font-family:Arial,Helvetica,sans-serif;max-width:36rem;margin:15vh auto;padding:0 1.5rem;color:#0b1020">
      <h1 style="font-size:1.4rem">${titulo}</h1><p>${detalle}</p>
      <p><a href="/#contacto" style="color:#437fac">Volver al sitio</a></p>
      </body></html>`,
    { status: estado, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Dos formatos de entrada: JSON desde el fetch del sitio, y form-urlencoded
  // para el POST clasico que ocurre si el JS del navegador no corre.
  const tipo = request.headers.get("content-type") ?? "";
  const esFormPlano = !tipo.includes("application/json");
  const respuesta = (estado: number, cuerpo: { ok: boolean; error?: string }) =>
    responder(esFormPlano, estado, cuerpo);

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || clientAddress || "sin-ip";

  if (!pasaRateLimit(ip)) {
    return respuesta(429, {
      ok: false,
      error: "Demasiados envios. Espera un minuto e intenta de nuevo.",
    });
  }

  let datos: Record<string, unknown>;
  try {
    if (esFormPlano) {
      datos = Object.fromEntries(await request.formData());
      // En form-urlencoded el checkbox llega como "on" (o ausente).
      datos.consentimiento = datos.consentimiento === "on" || datos.consentimiento === "true";
    } else {
      datos = await request.json();
    }
  } catch {
    return respuesta(400, { ok: false, error: "Solicitud invalida." });
  }

  const texto = (clave: string): string =>
    typeof datos[clave] === "string" ? (datos[clave] as string).trim() : "";

  // Honeypot: campo invisible para personas. Si viene lleno es un bot, y le
  // respondemos ok para que no reintente con otra tactica.
  if (texto("website")) return respuesta(200, { ok: true });

  // Un humano tarda en llenar el formulario; menos de 3 segundos es automatizado.
  const abierto = Number(datos.ts);
  if (Number.isFinite(abierto) && Date.now() - abierto < 3000) {
    return respuesta(200, { ok: true });
  }

  const nombre = texto("nombre");
  const empresa = texto("empresa");
  const email = texto("email");
  const mensaje = texto("mensaje");
  const consentimiento = datos.consentimiento === true;

  if (!nombre || !email || !mensaje) {
    return respuesta(400, { ok: false, error: "Faltan datos obligatorios." });
  }
  if (!consentimiento) {
    return respuesta(400, { ok: false, error: "Debes autorizar el tratamiento de tus datos." });
  }
  if (!esEmailValido(email)) {
    return respuesta(400, { ok: false, error: "Revisa el correo ingresado." });
  }
  if (
    nombre.length > LIMITES.nombre ||
    empresa.length > LIMITES.empresa ||
    email.length > LIMITES.email ||
    mensaje.length > LIMITES.mensaje
  ) {
    return respuesta(400, { ok: false, error: "Alguno de los campos excede el largo permitido." });
  }

  if (!RESEND_API_KEY) {
    console.error("[contacto] RESEND_API_KEY no esta configurada");
    return respuesta(500, { ok: false, error: "No pudimos enviar el mensaje. Escribenos por WhatsApp." });
  }

  const filas: Array<[string, string]> = [
    ["Nombre", nombre],
    ["Empresa", empresa || "—"],
    ["Email", email],
  ];

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#111">
      <h2 style="margin:0 0 16px;font-size:18px">Nuevo contacto desde el sitio web</h2>
      <table cellpadding="6" style="border-collapse:collapse;margin-bottom:16px">
        ${filas
          .map(
            ([k, v]) =>
              `<tr><td style="color:#666">${k}</td><td><strong>${escapar(v)}</strong></td></tr>`
          )
          .join("")}
      </table>
      <p style="color:#666;margin:0 0 6px">Mensaje</p>
      <p style="white-space:pre-wrap;margin:0">${escapar(mensaje)}</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:20px 0" />
      <p style="color:#888;font-size:12px;margin:0">
        El visitante autorizo el tratamiento de sus datos al enviar el formulario.
      </p>
      <!-- La IP NO se incluye a proposito: la seccion 2 de /politicas-de-datos
           declara que se recopilan unicamente nombre, empresa, correo y mensaje.
           La IP solo vive en memoria para el rate limit y en los logs de Vercel. -->
    </div>
  `;

  const plano = [
    "Nuevo contacto desde el sitio web",
    "",
    ...filas.map(([k, v]) => `${k}: ${v}`),
    "",
    "Mensaje:",
    mensaje,
  ].join("\n");

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `Contacto web — ${nombre}${empresa ? ` (${empresa})` : ""}`,
      html,
      text: plano,
    });

    if (error) {
      console.error("[contacto] Resend rechazo el envio:", error);
      return respuesta(502, { ok: false, error: "No pudimos enviar el mensaje. Escribenos por WhatsApp." });
    }

    return respuesta(200, { ok: true });
  } catch (e) {
    // El detalle queda en los logs de Vercel; al visitante no le exponemos nada.
    console.error("[contacto] Error inesperado:", e);
    return respuesta(500, { ok: false, error: "No pudimos enviar el mensaje. Escribenos por WhatsApp." });
  }
};

// Cualquier otro metodo sobre la ruta se rechaza explicitamente.
export const ALL: APIRoute = () =>
  json(405, { ok: false, error: "Metodo no permitido." });
