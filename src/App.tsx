import { useEffect, useState } from "react";

import logo from "@/assets/logo-interrenta.png";
import GlyphPortal from "@/components/ui/glyph-portal";
import LeadForm from "@/components/ui/lead-form";

// Only fonts that are certain to resolve. The portal disables motion if ANY family
// in this stack fails document.fonts.check, and "Arial Black" is absent on Android,
// which left phones static. The component appends its own fallbacks after this.
const PORTAL_FONT = '"Inter"';

/** What the letters are a window onto: white through the middle, gold at the edges.
 *  The white core sits where the camera enters, so the zoom resolves into white. */
const FIELD_BACKGROUND =
  "radial-gradient(circle at 50% 46%, rgba(255,255,255,.97), rgba(255,255,255,.55) 34%, rgba(255,255,255,0) 64%)," +
  "radial-gradient(circle at 20% 12%, rgba(255,255,255,.90), transparent 46%)," +
  "radial-gradient(circle at 78% 30%, rgba(245,209,112,.70), transparent 44%)," +
  "linear-gradient(130deg,#fffdf8 0%,#f5d170 52%,#d7af4d 100%)";

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
    // Generous: if we give up before Inter lands, the portal mounts with a
    // substituted face, fails its own font check and renders static.
    const timeout = window.setTimeout(finish, 3000);
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
      <div className="grid min-h-svh place-items-center bg-bg">
        <img src={logo} alt="InterRenta" className="h-24 w-auto object-contain" />
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
        "--gp-paper": "#161616",
        "--gp-ink": "#e2e2e2",
        "--gp-field": "#f5d170",
        "--gp-foreground": "#161616",
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
            <img src={logo} alt="InterRenta" className="h-16 w-auto object-contain" />
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
            className="absolute inset-x-6 m-0 text-center text-base leading-relaxed text-body sm:text-lg"
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
