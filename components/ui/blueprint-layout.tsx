import React, { ReactNode } from 'react';

export default function BlueprintLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-dark-blueprint relative font-sans text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none"></div>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}
