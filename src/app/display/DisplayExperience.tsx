"use client";

import Image from "next/image";
import Link from "next/link";
import { DM_Sans, Press_Start_2P } from "next/font/google";
import { useEffect, useRef, useState } from "react";

import { EVENT_PHOTO_FILES, eventPhotoSrc } from "@/app/display/eventPhotos";

const sans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
});

const pixelAccent = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function parallax(scrollY: number, factor: number, reducedMotion: boolean) {
  return reducedMotion ? 0 : Math.round(scrollY * factor * 100) / 100;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function usePointerTilt({ disabled }: { disabled: boolean }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const raf = useRef(0);
  const latest = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (disabled) {
      setTilt({ x: 0, y: 0 });
      return;
    }

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1; // [-1, 1]
      const ny = (e.clientY / window.innerHeight) * 2 - 1; // [-1, 1]
      latest.current = { x: clamp(nx, -1, 1), y: clamp(ny, -1, 1) };
      if (raf.current) return;
      raf.current = window.requestAnimationFrame(() => {
        raf.current = 0;
        setTilt(latest.current);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [disabled]);

  return tilt;
}

export default function DisplayExperience() {
  const [scrollY, setScrollY] = useState(0);
  const reducedMotion = useReducedMotion();
  const rafScroll = useRef(0);

  useEffect(() => {
    let latest = window.scrollY || 0;
    const flush = () => {
      rafScroll.current = 0;
      setScrollY(latest);
    };
    const onScroll = () => {
      latest = window.scrollY || 0;
      if (rafScroll.current) return;
      rafScroll.current = window.requestAnimationFrame(flush);
    };
    setScrollY(latest);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafScroll.current) cancelAnimationFrame(rafScroll.current);
    };
  }, []);

  const scrolled = scrollY > 56;
  const ySlow = parallax(scrollY, 0.22, reducedMotion);
  const yMid = parallax(scrollY, 0.12, reducedMotion);
  const yFloat = parallax(scrollY, -0.06, reducedMotion);
  const heroParallax = parallax(scrollY, 0.28, reducedMotion);
  const heroCardShift = parallax(scrollY, -0.04, reducedMotion);

  const pointer = usePointerTilt({ disabled: reducedMotion });

  const heroFile = EVENT_PHOTO_FILES[0];
  const galleryFiles = EVENT_PHOTO_FILES.slice(1);

  return (
    <div id="top" className={`${sans.className} relative min-h-screen bg-black text-zinc-100 antialiased`}>
      {/* Parallax / ambient layers */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -left-[15%] top-[-10%] h-[120%] w-[130%]"
          style={{ transform: `translate3d(0, ${ySlow}px, 0)` }}
        >
          <div className="h-full w-full bg-[radial-gradient(ellipse_70%_50%_at_30%_20%,rgba(37,99,235,0.22),transparent_55%),radial-gradient(ellipse_50%_40%_at_80%_60%,rgba(234,179,8,0.08),transparent_50%)]" />
        </div>
        <div
          className="absolute inset-0 opacity-40"
          style={{ transform: `translate3d(0, ${yMid}px, 0)` }}
        >
          <div className="h-full w-full bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.04)_35%,transparent_70%)] bg-[length:280%_100%]" />
        </div>
        <div
          className="absolute left-1/2 top-[18%] h-64 w-64 -translate-x-1/2 rounded-full bg-amber-400/15 blur-[100px]"
          style={{ transform: `translate(-50%, ${yFloat}px)` }}
        />
      </div>

      {/* Header */}
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 border-b transition-[padding,background-color,backdrop-filter,border-color] duration-300",
          scrolled
            ? "border-white/10 bg-black/72 py-3 backdrop-blur-xl"
            : "border-transparent bg-gradient-to-b from-black via-black/85 to-transparent py-5 backdrop-blur-[2px]",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6">
          <Link
            href="#top"
            className="group flex shrink-0 items-center gap-3"
            aria-label="Asian Innovation Forum — top of page"
          >
            <span className="relative flex h-10 w-[4.75rem] items-center justify-center overflow-hidden rounded-lg bg-zinc-950 ring-1 ring-white/15 sm:h-11 sm:w-28">
              <Image
                src="/assets/aif.png"
                alt=""
                fill
                className="object-contain p-0.5"
                sizes="112px"
                priority
              />
            </span>
            <span
              className={`${pixelAccent.className} hidden text-[9px] leading-tight tracking-wide text-amber-200/90 sm:block sm:text-[10px]`}
            >
              Asian
              <br />
              Innovation
              <br />
              Forum
            </span>
          </Link>

          <nav
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 sm:gap-x-10 sm:text-xs"
            aria-label="Page sections"
          >
            <a href="#about" className="hover:text-amber-200/95">
              About
            </a>
            <a href="#highlights" className="hover:text-amber-200/95">
              Highlights
            </a>
            <a href="#moments" className="hover:text-amber-200/95">
              Moments
            </a>
            <a href="#partners" className="hidden hover:text-amber-200/95 md:inline">
              Partners
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="https://tribune.net.ph/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Daily Tribune (opens in new tab)"
              className="relative hidden h-8 w-[5.75rem] opacity-95 transition-opacity hover:opacity-100 sm:block sm:h-10 sm:w-28 md:h-11 md:w-[7.25rem]"
            >
              <Image src="/assets/dt.png" alt="" fill className="object-contain object-right" sizes="116px" />
            </Link>
            <Link
              href="/login?next=/dashboard"
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] transition-colors hover:bg-white/10 sm:px-4 sm:text-xs"
            >
              Staff
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* Hero with parallax background photo */}
        <section className="relative min-h-[78vh] overflow-hidden pb-14 pt-[7.75rem] sm:min-h-[85vh] sm:pt-[8.75rem]" aria-labelledby="hero-heading">
          <div className="absolute inset-0 -z-10">
            <div
              className="absolute inset-[-18%_-8%_-8%_-8%]"
              style={{ transform: `translate3d(0, ${heroParallax}px, 0) scale(1.08)` }}
            >
              <Image
                src={eventPhotoSrc(heroFile)}
                alt=""
                fill
                className="object-cover object-[50%_40%]"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black" />
            </div>
          </div>

          <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center">
            <p
              className={`${pixelAccent.className} mb-6 text-[9px] text-amber-300/95 sm:text-[10px]`}
              aria-hidden="true"
            >
              Presented by Daily Tribune
            </p>

            <h1 id="hero-heading" className="sr-only">
              Asian Innovation Forum public showcase
            </h1>
            <div className="relative w-full max-w-xl">
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-b from-blue-500/20 via-transparent to-amber-500/15 blur-xl" aria-hidden />
              <div
                className="relative rounded-2xl border border-white/15 bg-black/55 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8"
                style={{
                  transform: reducedMotion
                    ? `translate3d(0, ${heroCardShift}px, 0)`
                    : `perspective(1100px) translate3d(0, ${heroCardShift}px, 0) rotateX(${(-pointer.y * 4.0).toFixed(3)}deg) rotateY(${(pointer.x * 5.5).toFixed(3)}deg)`,
                  transformStyle: "preserve-3d",
                  willChange: reducedMotion ? undefined : "transform",
                }}
              >
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                  <div
                    className="absolute -inset-y-10 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                    style={reducedMotion ? undefined : { animation: "aif-sheen 6.5s ease-in-out infinite" }}
                  />
                </div>
                <Image
                  src="/assets/aif.png"
                  alt="Asian Innovation Forum logo"
                  width={560}
                  height={320}
                  className="mx-auto h-auto w-full max-w-md object-contain sm:max-w-lg"
                  priority
                />
                <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-zinc-300 sm:text-[15px]">
                  Bringing together creators, founders, builders, and policy voices to spotlight how technology shapes
                  how we live, learn, connect, and build for the region.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
          {/* About */}
          <section id="about" className="scroll-mt-28 border-y border-white/10 py-16 sm:scroll-mt-32 sm:py-20">
            <div className="grid gap-10 md:grid-cols-[1fr,1.1fr] md:gap-14 md:items-start">
              <div>
                <h2 className={`${pixelAccent.className} text-[10px] uppercase tracking-[0.25em] text-amber-300/95`}>
                  Why we gather
                </h2>
                <p className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Dialogue, demos, and real stories from innovators across Asia-Pacific.
                </p>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
                <p>
                  The Asian Innovation Forum is a platform for exchanging ideas across industries—from smart cities and
                  digital media to grassroots entrepreneurship and frontier research.
                </p>
                <p>
                  Sessions are designed to bridge audiences: emerging talent meets experienced operators; technologists
                  meet storytellers and civic leaders—so innovations are understood not just as products but as shifts
                  in culture and capability.
                </p>
                <p>
                  <span className="text-zinc-200">Attendance &amp; registration:</span> when an event opens, organizers
                  share a dedicated registration link for that date and venue.
                </p>
              </div>
            </div>
          </section>

          {/* Highlight strip — second photo with parallax feel */}
          <section id="highlights" className="scroll-mt-28 py-16 sm:scroll-mt-32 sm:py-20">
            <h2 className={`${pixelAccent.className} text-center text-[10px] uppercase tracking-[0.35em] text-amber-300/95`}>
              Highlights
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-lg font-semibold text-zinc-100 sm:text-xl">
              Keynotes, panels, exhibition floors, and meetups—capturing momentum on the ground.
            </p>
            <div
              className="relative mt-10 overflow-hidden rounded-2xl ring-1 ring-white/15"
              style={{
                transform:
                  reducedMotion
                    ? undefined
                    : `perspective(1100px) rotateX(${(-pointer.y * 2.0).toFixed(3)}deg) rotateY(${(pointer.x * 2.6).toFixed(3)}deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              <div className="relative aspect-[21/10] max-h-[min(56vh,780px)] w-full sm:aspect-[21/9]">
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `translate3d(0, ${parallax(scrollY, 0.08, reducedMotion)}px, 0) scale(1.02)`,
                  }}
                >
                  <Image
                    src={eventPhotoSrc(EVENT_PHOTO_FILES[4])}
                    alt="Asian Innovation Forum — panel and audience highlights"
                    fill
                    className="object-cover object-[50%_25%]"
                    sizes="(max-width: 768px) 100vw, 1152px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/55" />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <div className="max-w-xl rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-xs text-zinc-200 backdrop-blur sm:text-sm">
                    Moments from Forum programming: conversations designed to unlock collaboration between media,
                    innovators, enterprises, and the public sphere.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Moments gallery */}
          <section id="moments" className="scroll-mt-28 py-14 sm:scroll-mt-32 sm:py-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={`${pixelAccent.className} text-[10px] uppercase tracking-[0.3em] text-amber-300/95`}>
                  Moments &amp; gallery
                </h2>
                <p className="mt-2 max-w-xl text-sm text-zinc-400 sm:text-base">
                  A glimpse of gatherings, backstage energy, exhibitors, speakers, and the people who shape each edition.
                  Scroll for more—each tile uses event photography from Daily Tribune&apos;s Forum coverage archives.
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                {galleryFiles.length} photos
              </span>
            </div>

            <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
              {galleryFiles.map((file, idx) => {
                const lift = reducedMotion ? 0 : ((idx % 3) + 1) * -2;
                return (
                  <figure
                    key={file}
                    className="mb-4 break-inside-avoid overflow-hidden rounded-xl ring-1 ring-white/12 last:mb-0"
                    style={{
                      transform:
                        reducedMotion ? undefined : `translate3d(0, ${parallax(scrollY, lift * 0.012, reducedMotion)}px, 0)`,
                    }}
                  >
                    <div className="relative">
                      <div className="relative aspect-[4/5] sm:aspect-[3/4]">
                        <Image
                          src={eventPhotoSrc(file)}
                          alt={`Asian Innovation Forum event photo (${idx + 2})`}
                          fill
                          className="object-cover object-[50%_40%]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 30vw"
                        />
                      </div>
                    </div>
                  </figure>
                );
              })}
            </div>
          </section>

          {/* Partners footer block */}
          <section id="partners" className="scroll-mt-28 border-t border-white/10 py-14 sm:scroll-mt-32 sm:py-16">
            <div className="flex flex-col items-center gap-8 rounded-2xl border border-white/10 bg-zinc-950/55 px-6 py-12 text-center backdrop-blur-sm sm:flex-row sm:justify-between sm:gap-12 sm:text-left">
              <div className="max-w-md space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Presenting partner</h2>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Produced with the journalism and civic mission of Daily Tribune—independent reporting without fear,
                  without favor—supporting public understanding of innovation and accountability in the digital age.
                </p>
              </div>
              <Link
                href="https://tribune.net.ph/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative block h-12 w-[13.5rem] shrink-0 sm:h-14 sm:w-[16rem]"
              >
                <Image
                  src="/assets/dt.png"
                  alt="Daily Tribune logo"
                  fill
                  className="object-contain"
                  sizes="256px"
                />
              </Link>
            </div>
          </section>
        </div>

        {/* Page footer */}
        <footer className="border-t border-white/10 bg-black/55 py-10 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-center text-[11px] text-zinc-500 sm:flex-row sm:justify-between sm:px-6 sm:text-left sm:text-xs">
            <p>
              Event logos and photographs are displayed for informational use. Official registration is provided only via
              links shared by organizers.
            </p>
            <Link href="/login?next=/dashboard" className="text-indigo-400 hover:text-indigo-300 hover:underline">
              Staff sign in
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
