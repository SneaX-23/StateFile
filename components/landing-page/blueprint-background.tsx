export default function BlueprintBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-blueprint-radial">
      {/* Grid: fine 32px lines + bold 160px lines, drawn once as a repeating SVG pattern */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <pattern id="grid-fine" width="32" height="32" patternUnits="userSpaceOnUse">
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="#cfe0f5"
              strokeOpacity="0.06"
              strokeWidth="1"
            />
          </pattern>
          <pattern id="grid-bold" width="160" height="160" patternUnits="userSpaceOnUse">
            <path
              d="M 160 0 L 0 0 0 160"
              fill="none"
              stroke="#cfe0f5"
              strokeOpacity="0.12"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-fine)" />
        <rect width="100%" height="100%" fill="url(#grid-bold)" />
      </svg>

      {/* Decorative drafting marks — a compass circle top-left, a dimensioned node bottom-right,
          a long dashed leader connecting them. Pure vector, low opacity, purely atmospheric. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g stroke="#6f97c9" strokeOpacity="0.22" fill="none" strokeWidth="1.5">
          {/* compass / gear circles, top-left */}
          <circle cx="150" cy="140" r="120" strokeDasharray="2 6" />
          <circle cx="150" cy="140" r="86" />
          <circle cx="150" cy="140" r="6" fill="#6f97c9" fillOpacity="0.3" stroke="none" />
          {[...Array(16)].map((_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const x1 = 150 + Math.cos(angle) * 86;
            const y1 = 140 + Math.sin(angle) * 86;
            const x2 = 150 + Math.cos(angle) * 100;
            const y2 = 140 + Math.sin(angle) * 100;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}

          {/* node cluster, bottom-right, echoes an architecture-diagram symbol */}
          <rect x="1350" y="700" width="64" height="64" rx="2" />
          <line x1="1382" y1="700" x2="1382" y2="660" />
          <line x1="1414" y1="732" x2="1460" y2="732" />
          <circle cx="1460" cy="732" r="5" />
          <rect x="1382" y="632" width="52" height="28" rx="2" />

          {/* long dashed leader line tying the two corners together */}
          <path d="M 260 210 C 600 420, 1000 560, 1330 730" strokeDasharray="1 8" />

          {/* small crosshair registration marks scattered for texture */}
          <g strokeOpacity="0.28">
            <path d="M 1120 120 h 20 M 1130 110 v 20" />
            <path d="M 420 780 h 20 M 430 770 v 20" />
          </g>
        </g>
      </svg>

      {/* subtle vignette so content stays readable at the edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-blueprint-950/40 via-transparent to-blueprint-950/70" />
    </div>
  );
}
