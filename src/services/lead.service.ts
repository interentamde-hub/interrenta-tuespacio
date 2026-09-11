// Fail at load rather than at submit: a lead page that cannot store leads should
// break loudly on deploy, not discard them one by one in silence.
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Falta ${name}. Copia .env.example a .env (sin BOM) y rellénala.`);
  }
  return value;
}

const SUPABASE_URL = requireEnv("VITE_SUPABASE_URL", import.meta.env.VITE_SUPABASE_URL);
const SUPABASE_ANON_KEY = requireEnv(
  "VITE_SUPABASE_ANON_KEY",
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export const WHATSAPP_NUMBER = "573195227378";

export type Lead = {
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  destinacion: string;
  detalle: string;
};

export async function saveLead(lead: Lead) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/leads_espacios`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify([{ ...lead, source: "tuespacio" }]),
  });

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  }
}

export function whatsappLink(lead: Lead) {
  const lines = [
    "Hola InterRenta, acabo de dejar mis datos en tuespacio.interrenta.com",
    "",
    `Nombre: ${lead.nombre}`,
    `Empresa: ${lead.empresa}`,
    `Correo: ${lead.email}`,
    `Celular: ${lead.telefono}`,
    `Destinación: ${lead.destinacion}`,
  ];

  if (lead.detalle.trim()) lines.push(`Detalle: ${lead.detalle.trim()}`);

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
