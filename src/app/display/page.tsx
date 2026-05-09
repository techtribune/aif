import Image from "next/image";
import Link from "next/link";
import { DM_Sans, Press_Start_2P } from "next/font/google";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Asian Innovation Forum",
  description: "Public showcase for the Asian Innovation Forum, presented by Daily Tribune.",
  robots: { index: true, follow: true },
};

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-display-sans",
  display: "swap",
});

const pixelAccent = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display-pixel",
  display: "swap",
});

export default function DisplayPage() {
  return (
    <main className={`${sans.className} min-h-screen bg-black text-zinc-100 antialiased`}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.18),transparent)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.35))]" />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-14 pt-10 sm:px-6 md:pb-16 md:pt-14">
        <header className="flex flex-col items-center gap-6 border-b border-white/10 pb-10">
          <p
            className={`${pixelAccent.className} text-[10px] uppercase tracking-[0.35em] text-amber-300/90 sm:text-xs sm:tracking-[0.45em]`}
          >
            Presented by
          </p>
          <Link
            href="https://tribune.net.ph/"
            target="_blank"
            rel="noopener noreferrer"
            className="relative block w-full max-w-xs transition-opacity hover:opacity-90 sm:max-w-sm"
          >
            <Image
              src="/assets/dt.png"
              alt="Daily Tribune — Without fear, without favor"
              width={440}
              height={160}
              className="h-auto w-full object-contain"
              priority
            />
          </Link>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center gap-8 py-12 text-center sm:py-16">
          <div className="relative w-full max-w-lg">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-blue-500/10 via-transparent to-amber-400/5 blur-2xl" />
            <div className="relative rounded-2xl border border-white/10 bg-zinc-950/40 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] sm:p-8">
              <Image
                src="/assets/aif.png"
                alt="Asian Innovation Forum logo"
                width={640}
                height={360}
                className="mx-auto h-auto w-full max-w-md object-contain sm:max-w-lg"
                priority
              />
            </div>
          </div>

          <div className="max-w-xl space-y-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
            <p className="text-balance text-zinc-200">
              Welcome to the <span className="text-zinc-100">Asian Innovation Forum</span> — a gathering
              focused on technology, ideas, and the people shaping what comes next.
            </p>
            <p className="text-pretty">
              Event registration links are shared by organizers for each session. This page is open to all
              visitors; authorized tools for data and administration require a signed-in account.
            </p>
          </div>
        </section>

        <footer className="mt-auto flex flex-col items-center gap-4 border-t border-white/10 pt-8 text-center text-xs text-zinc-500 sm:flex-row sm:justify-between sm:text-left">
          <p>
            Images and marks are shown for identification.{" "}
            <span className="text-zinc-400">© {new Date().getFullYear()} Daily Tribune.</span>
          </p>
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline">
            Staff sign in
          </Link>
        </footer>
      </div>
    </main>
  );
}
