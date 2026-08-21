import Image from "next/image";
import BlueprintBackground from "@/components/landing-page/blueprint-background";
import Navbar from "@/components/landing-page/navbar";

export default function Home() {
  return (
    <>
      <BlueprintBackground />
      <Navbar />

      <main className="relative flex min-h-screen items-center justify-center px-6">
        {/* Drafting-frame corner marks */}
        <CornerMark position="top-left" label="X:0 Y:0" />
        <CornerMark position="top-right" label="SCALE 1:1" />
        <CornerMark position="bottom-left" label="SHEET 01" />
        <CornerMark position="bottom-right" label="REV 0.1" />

        <div className="relative flex max-w-3xl flex-col items-center text-center">
          {/* Eyebrow */}
          <div className="mb-8 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-blueprint-400">
            <span className="h-px w-6 bg-blueprint-500" />
            Infrastructure Portfolio Platform
            <span className="h-px w-6 bg-blueprint-500" />
          </div>

          {/* Title + verified stamp */}
          <div className="relative">
            <h1 className=" font-display text-6xl font-semibold tracking-tight text-blueprint-100 sm:text-7xl md:text-8xl">
              StateFile
            </h1>

            <div
              className="absolute animate-stamp -right-16 -top-8 hidden -rotate-[10deg] select-none items-center justify-center rounded-sm border-2 border-stamp/70 px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-widest text-stamp/80 sm:flex"
              aria-hidden="true"
            >
              Verified
            </div>
          </div>

          {/* Dimension-line annotation under the title */}
          <div className="mt-3 flex items-center gap-2 text-blueprint-400">
            <DimensionCap />
            <span className="h-px flex-1 max-w-[220px] bg-blueprint-500" />
            <span className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em]">
              proof of run, not proof of code
            </span>
            <span className="h-px flex-1 max-w-[220px] bg-blueprint-500" />
            <DimensionCap />
          </div>

          {/* Subhead */}
          <p className="mt-8 max-w-xl text-balance font-sans text-base leading-relaxed text-blueprint-200 sm:text-lg">
            A portfolio built for DevOps, SRE, and platform engineers; one that
            shows verifiable infrastructure evidence instead of self-reported
            resume claims.
          </p>
        </div>

        {/* Title-block spec plate, bottom-right, like a drawing's info box */}
        <div className="absolute bottom-8 right-8 hidden w-56 border border-blueprint-700/60 bg-blueprint-900/60 font-mono text-[10px] uppercase tracking-widest text-blueprint-400 backdrop-blur-sm sm:block">
          <div className="border-b border-blueprint-700/60 px-3 py-2 text-blueprint-200">
            StateFile
          </div>
          <div className="grid grid-cols-2 gap-y-1 px-3 py-2">
            <span>Project</span>
            <span className="text-right text-blueprint-200">.tfstate</span>
            <span>Stack</span>
            <span className="text-right text-blueprint-200">Next.js / Go</span>
            <span>Status</span>
            <span className="text-right text-blueprint-200">Draft</span>
          </div>
        </div>
      </main>
    </>
  );
}


function DimensionCap() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
      <line x1="4" y1="0" x2="4" y2="14" stroke="#6f97c9" strokeWidth="1.5" />
    </svg>
  );
}

function CornerMark({
  position,
  label,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  label: string;
}) {
  const posClasses: Record<typeof position, string> = {
    "top-left": "top-24 left-6 items-start",
    "top-right": "top-24 right-6 items-end",
    "bottom-left": "bottom-6 left-6 items-start",
    "bottom-right": "bottom-6 right-6 items-end",
  };

  const bracket: Record<typeof position, string> = {
    "top-left": "M0 12 V0 H12",
    "top-right": "M0 0 H12 V12",
    "bottom-left": "M0 0 V12 H12",
    "bottom-right": "M0 12 H12 V0",
  };

  return (
    <div className={`pointer-events-none absolute hidden flex-col gap-1 sm:flex ${posClasses[position]}`}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <path d={bracket[position]} fill="none" stroke="#3d6fa8" strokeWidth="1.5" />
      </svg>
      <span className="font-mono text-[10px] uppercase tracking-widest text-blueprint-400/70">
        {label}
      </span>
    </div>
  );
}
