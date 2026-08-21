import Link from "next/link"
export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-blueprint-700/40 bg-blueprint-950/70 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo mark + wordmark */}
        <div className="flex items-center gap-3">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <rect
              x="1"
              y="1"
              width="20"
              height="20"
              rx="1"
              fill="none"
              stroke="#6f97c9"
              strokeWidth="1.5"
            />
            <path d="M1 6 H5 M1 16 H5 M17 6 H21 M17 16 H21" stroke="#6f97c9" strokeWidth="1.5" />
            <circle cx="11" cy="11" r="3" fill="none" stroke="#cfe0f5" strokeWidth="1.5" />
          </svg>
          <span className="font-display text-lg font-semibold tracking-tight text-blueprint-100">
            StateFile
            <span className="font-mono text-sm font-normal text-blueprint-400">.tfstate</span>
          </span>
        </div>

        {/* Placeholder nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {["Exhibits", "How it works", "Pricing"].map((label) => (
            <span
              key={label}
              className="font-mono text-xs uppercase tracking-widest text-blueprint-400"
            >
              {label}
            </span>
          ))}
        </div>

        {/* Auth slot */}
        <Link href={"/login"}>
          <div className="flex items-center gap-3" data-slot="auth-buttons">
            <span className="group relative inline-flex items-center justify-center overflow-hidden rounded-sm border border-blueprint-500 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-blueprint-100 transition-all duration-300 ease-out hover:border-blueprint-400 hover:text-white hover:shadow-[0_0_12px_rgba(59,130,246,0.3)] active:scale-95">
              <span className="absolute inset-0 -z-10 bg-gradient-to-r from-blueprint-600/0 via-blueprint-500/20 to-blueprint-600/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              Login
            </span>
          </div>
        </Link>
      </nav>
    </header>
  );
}
