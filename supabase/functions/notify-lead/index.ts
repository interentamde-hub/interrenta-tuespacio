// Avisa por correo cada vez que entra un lead en `leads_espacios`.
// Lo dispara un Database Webhook de Supabase sobre INSERT.
type Lead = {
  id: string;
  created_at: string;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  empresa: string | null;
  destinacion: string | null;
  detalle: string | null;
  source: string | null;
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Lead | null;
};

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Falta el secreto ${name}`);
  return value;
}

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

const show = (value: string | null) => (value?.trim() ? escape(value.trim()) : "—");

/** Número colombiano listo para wa.me: sin espacios y con indicativo. */
function whatsappNumber(telefono: string | null) {
  const digits = (telefono ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.startsWith("57") ? digits : `57${digits}`;
}

function buildEmail(lead: Lead) {
  const wa = whatsappNumber(lead.telefono);
  const fecha = new Date(lead.created_at).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "long",
    timeStyle: "short",
  });

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#9aa0ad;font-size:13px;width:130px;vertical-align:top">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #2a2a2a;color:#e2e2e2;font-size:15px">${value}</td>
    </tr>`;

  const html = `<!doctype html>
<html lang="es"><body style="margin:0;background:#161616;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#161616;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1f1f1f;border:1px solid #333;border-radius:16px;padding:32px">
        <tr><td>
          <p style="margin:0 0 4px;color:#ecb337;font-size:11px;letter-spacing:2px;text-transform:uppercase">Tu espacio · InterRenta</p>
          <h1 style="margin:0 0 24px;color:#e2e2e2;font-size:22px;font-weight:normal">Nuevo interesado en un espacio</h1>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${row("Nombre", show(lead.nombre))}
            ${row("Empresa", show(lead.empresa))}
            ${row("Destinación", show(lead.destinacion))}
            ${row("Correo", show(lead.email))}
            ${row("Celular", show(lead.telefono))}
            ${row("Detalle", show(lead.detalle))}
            ${row("Recibido", escape(fecha))}
          </table>
          ${
            wa
              ? `<a href="https://wa.me/${wa}" style="display:inline-block;margin-top:28px;padding:13px 26px;background:#ecb337;color:#161616;font-size:14px;font-weight:bold;text-decoration:none;border-radius:999px">Escribirle por WhatsApp</a>`
              : ""
          }
          <p style="margin:24px 0 0;color:#6b7280;font-size:12px">Enviado automáticamente desde tuespacio.interrenta.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    "Nuevo interesado en un espacio",
    "",
    `Nombre: ${lead.nombre ?? "—"}`,
    `Empresa: ${lead.empresa ?? "—"}`,
    `Destinación: ${lead.destinacion ?? "—"}`,
    `Correo: ${lead.email ?? "—"}`,
    `Celular: ${lead.telefono ?? "—"}`,
    `Detalle: ${lead.detalle ?? "—"}`,
    `Recibido: ${fecha}`,
    wa ? `\nWhatsApp: https://wa.me/${wa}` : "",
  ].join("\n");

  return { html, text };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Body inválido", { status: 400 });
  }

  const lead = payload.record;
  if (payload.type !== "INSERT" || !lead) {
    // Nada que avisar: responde 200 para que el webhook no reintente.
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { html, text } = buildEmail(lead);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env("MAIL_FROM"),
      to: env("NOTIFY_TO").split(",").map((address) => address.trim()),
      // Responder al correo escribe directamente al interesado.
      reply_to: lead.email?.trim() || undefined,
      subject: `Nuevo lead: ${lead.empresa?.trim() || lead.nombre?.trim() || "sin empresa"} · ${lead.destinacion ?? "sin destinación"}`,
      html,
      text,
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    console.error("Resend rechazó el envío", response.status, body);
    // 500 hace que Supabase registre el fallo en net._http_response.
    return new Response(JSON.stringify({ error: body }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("Aviso enviado", body);
  return new Response(JSON.stringify({ sent: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
