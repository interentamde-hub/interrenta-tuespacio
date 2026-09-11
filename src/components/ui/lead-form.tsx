import { useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  User,
} from "lucide-react";

import logoLight from "@/assets/logo-interrenta-light.png";
import { cn } from "@/lib/utils";
import { saveLead, whatsappLink, type Lead } from "@/services/lead.service";

const DESTINACIONES = [
  "Oficina",
  "Consultorio",
  "Local comercial",
  "Bodega",
  "Restaurante",
  "Otro",
];

const EMPTY: Lead = {
  nombre: "",
  email: "",
  telefono: "",
  empresa: "",
  destinacion: "",
  detalle: "",
};

const cardClass =
  "mx-auto w-full rounded-3xl border border-hairline bg-paper shadow-[0_24px_60px_-28px_rgba(22,22,22,0.30)]";

const inputClass =
  "h-full w-full bg-transparent px-3 text-[15px] text-ink outline-none placeholder:text-ink-muted/60";

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      <div className="mt-2 flex h-12 items-center overflow-hidden rounded-full border border-hairline bg-tint pl-4 transition-all focus-within:border-gold focus-within:ring-4 focus-within:ring-gold/15">
        <span className="shrink-0 text-ink-muted">{icon}</span>
        {children}
      </div>
    </div>
  );
}

export default function LeadForm() {
  const [values, setValues] = useState<Lead>(EMPTY);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const set = (key: keyof Lead) => (value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.destinacion) {
      setError("Elige una destinación para continuar.");
      return;
    }

    setStatus("sending");
    setError("");

    try {
      await saveLead(values);
      setStatus("done");
    } catch (submitError) {
      console.error("No se pudo guardar el lead", submitError);
      setStatus("idle");
      setError("No pudimos guardar tus datos. Escríbenos por WhatsApp y lo resolvemos.");
    }
  }

  if (status === "done") {
    return (
      <div className={cn(cardClass, "max-w-md p-10 text-center")}>
        <img
          src={logoLight}
          alt="InterRenta — Conectamos confianza, gestionamos tranquilidad"
          className="mx-auto mb-8 w-[168px]"
        />
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
          <Check size={26} strokeWidth={2.5} />
        </span>
        <h2 className="mt-6 font-serif text-4xl leading-tight text-ink">
          Listo, {values.nombre.split(" ")[0]}.
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          Recibimos tus datos. Un asesor de InterRenta se pondrá en contacto contigo
          muy pronto con opciones para {values.empresa}.
        </p>
        <a
          href={whatsappLink(values)}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold text-[15px] font-semibold text-ink transition hover:bg-gold-deep"
        >
          <MessageCircle size={18} />
          Continuar por WhatsApp
        </a>
        <p className="mt-4 text-xs text-ink-muted">
          ¿Prefieres adelantar la conversación? Te abrimos el chat con tus datos listos.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(cardClass, "max-w-2xl p-8 sm:p-10")}>
      <div className="text-center">
        <p className="inline-block rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-gold-deep uppercase">
          Oriente Antioqueño
        </p>
        <h1 className="mt-4 font-serif text-[2.6rem] leading-[1.05] text-ink">
          Encontremos tu espacio.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
          Déjanos tus datos y te mostramos locales y oficinas que encajan con lo que
          tu empresa necesita.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
        <Field id="nombre" label="Nombre completo" icon={<User size={18} />}>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            autoComplete="name"
            placeholder="Tu nombre"
            className={inputClass}
            value={values.nombre}
            onChange={(e) => set("nombre")(e.target.value)}
          />
        </Field>

        <Field id="empresa" label="Nombre de la empresa" icon={<Building2 size={18} />}>
          <input
            id="empresa"
            name="empresa"
            type="text"
            required
            autoComplete="organization"
            placeholder="¿Cómo se llama?"
            className={inputClass}
            value={values.empresa}
            onChange={(e) => set("empresa")(e.target.value)}
          />
        </Field>

        <Field id="email" label="Correo electrónico" icon={<Mail size={18} />}>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nombre@empresa.com"
            className={inputClass}
            value={values.email}
            onChange={(e) => set("email")(e.target.value)}
          />
        </Field>

        <Field id="telefono" label="Número celular" icon={<Phone size={18} />}>
          <span className="shrink-0 pl-3 text-[15px] whitespace-nowrap text-ink-muted">
            +57
          </span>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            required
            inputMode="numeric"
            autoComplete="tel"
            placeholder="300 000 0000"
            className={cn(inputClass, "pl-2")}
            value={values.telefono}
            onChange={(e) => set("telefono")(e.target.value.replace(/[^\d\s]/g, ""))}
          />
        </Field>

        <fieldset className="sm:col-span-2">
          <legend className="text-[13px] font-medium text-ink-soft">Destinación</legend>
          <p className="mt-1 text-xs text-ink-muted">¿Para qué vas a usar el espacio?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DESTINACIONES.map((option) => {
              const selected = values.destinacion === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    set("destinacion")(option);
                    setError("");
                  }}
                  className={cn(
                    "rounded-full border px-4 py-2 text-[13px] transition",
                    selected
                      ? "border-gold bg-gold/15 font-medium text-ink"
                      : "border-hairline text-ink-muted hover:border-gold/50 hover:text-ink",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <textarea
            id="detalle"
            name="detalle"
            rows={3}
            maxLength={300}
            placeholder="Cuéntanos más..."
            className="mt-3 w-full resize-none rounded-2xl border border-hairline bg-tint p-4 text-[15px] text-ink outline-none transition-all placeholder:text-ink-muted/60 focus:border-gold focus:ring-4 focus:ring-gold/15"
            value={values.detalle}
            onChange={(e) => set("detalle")(e.target.value)}
          />
        </fieldset>

        {error && (
          <p role="alert" className="text-[13px] text-red-600 sm:col-span-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gold text-[15px] font-semibold text-ink transition hover:bg-gold-deep disabled:opacity-60 sm:col-span-2"
        >
          {status === "sending" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              Enviar mis datos
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <p className="text-center text-xs leading-relaxed text-ink-muted sm:col-span-2">
          Usamos tus datos solo para contactarte con opciones de espacios.
        </p>
      </form>
    </div>
  );
}
