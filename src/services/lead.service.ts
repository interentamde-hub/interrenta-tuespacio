import { supabase } from "@/lib/supabase";

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
  if (!supabase) return;

  const { error } = await supabase.from("leads_espacios").insert([
    { ...lead, source: "tuespacio" },
  ]);

  if (error) throw error;
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
