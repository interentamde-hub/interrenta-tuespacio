import { useEffect, useState } from "react";

import logoMark from "@/assets/logo-interrenta-mark.png";
import GlyphPortal from "@/components/ui/glyph-portal";
import LeadForm from "@/components/ui/lead-form";

const PORTAL_FONT = '"Inter", "Arial Black", Arial, sans-serif';

const FIELD_BACKGROUND =
  "radial-gradient(circle at 20% 10%, rgba(236,179,55,.34), transparent 40%)," +
  "radial-gradient(circle at 80% 22%, rgba(255,255,255,.10), transparent 30%)," +
  "radial-gradient(circle at 50% 82%, rgba(7,43,45,.62), transparent 46%)," +
  "linear-gradient(135deg,#0d4447 0%,#135b5f 48%,#072b2d 100%)";

/** The portal freezes its typeface at mount, so hold the render until Inter 900 lands. */
function useFontReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        setReady(true);
      }
    };
    const timeout = window.setTimeout(finish, 1800);
    document.fonts.load('900 100px "Inter"').then(finish, finish);
    return () => {
      settled = true;
      clearTimeout(timeout);
    };
  }, []);

  return ready;
}

export default function App() {
  const fontReady = useFontReady();

  if (!fontReady) {
    return (
      <div className="grid min-h-svh place-items-center bg-paper">
        <img src={logoMark} alt="InterRenta" className="h-12 w-auto opacity-70" />
      </div>
    );
  }

  return (
    <GlyphPortal
      word="ESPACIO"
      fontFamily={PORTAL_FONT}
      fontWeight={900}
      scrollLength={1.8}
      enterLabel="Ir al formulario"
      style={{
        "--gp-paper": "#ffffff",
        "--gp-ink": "#161616",
        "--gp-field": "#0d4447",
        "--gp-foreground": "#ffffff",
        fontFamily: "var(--font-sans)",
      }}
      background={
        <div
          className="absolute inset-0"
          style={{
            transform: "scale(var(--gp-field-scale,1))",
            background: FIELD_BACKGROUND,
          }}
        />
      }
      front={
        <>
          <header className="absolute inset-x-[clamp(24px,5vw,64px)] top-[clamp(24px,4.5vw,48px)] flex items-center justify-between gap-5">
            <img src={logoMark} alt="InterRenta" className="h-9 w-auto" />
            <span className="max-w-[14ch] text-right text-[11px] leading-snug text-muted sm:max-w-none">
              Oriente Antioqueño
            </span>
          </header>

          <p
            className="absolute inset-x-6 m-0 text-center text-[13px] tracking-[0.18em] text-muted uppercase"
            style={{ bottom: "calc(100% - var(--gp-word-top, 35%) + 28px)" }}
          >
            Locales y oficinas
          </p>

          <p
            className="absolute inset-x-6 m-0 text-center text-base leading-relaxed text-ink-soft sm:text-lg"
            style={{ top: "calc(var(--gp-word-bottom, 50%) + 28px)" }}
          >
            Encontremos el lugar para tu empresa.
          </p>

          <span className="absolute inset-x-6 bottom-[3%] text-center text-[11px] tracking-[0.14em] text-muted uppercase">
            Desliza para entrar
          </span>
        </>
      }
    >
      <LeadForm />
    </GlyphPortal>
  );
}
