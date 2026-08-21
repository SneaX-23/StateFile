import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono, Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "StateFile — Proof of run, not proof of claim",
  description:
    "A portfolio platform for DevOps, SRE, and platform engineers. Verifiable infrastructure evidence instead of self-reported resume claims.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn(display.variable, mono.variable, sans.variable, "font-sans", geist.variable)}>
      <body className="bg-blueprint-950 font-sans text-blueprint-100 antialiased">
        {children}
      </body>
    </html>
  );
}
