"use client";

import Image from "next/image";
import Link from "next/link";
import { DM_Sans, Press_Start_2P } from "next/font/google";
import { animated, useReducedMotion as useSpringReducedMotion, useSpring, useTrail } from "@react-spring/web";
import { useEffect, useMemo, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-coverflow";

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
  const reducedMotion = useReducedMotion();
  const springReducedMotion = useSpringReducedMotion();
  const scrolled = true;

  const pointer = usePointerTilt({ disabled: reducedMotion });

  const heroFile = EVENT_PHOTO_FILES[0];
  const galleryFiles = useMemo(() => EVENT_PHOTO_FILES.slice(1), []);

  const projects = [
    { title: "Project 01", year: "2026", file: EVENT_PHOTO_FILES[4] },
    { title: "Project 02", year: "2026", file: EVENT_PHOTO_FILES[9] },
    { title: "Project 03", year: "2026", file: EVENT_PHOTO_FILES[12] },
    { title: "Project 04", year: "2026", file: EVENT_PHOTO_FILES[16] },
    { title: "Project 05", year: "2026", file: EVENT_PHOTO_FILES[21] },
    { title: "Project 06", year: "2026", file: EVENT_PHOTO_FILES[25] },
  ] as const;

  return (
    <div id="top" className={`${sans.className} relative min-h-screen bg-black text-zinc-100 antialiased`}>
      {/* Ambient layers */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[15%] top-[-10%] h-[120%] w-[130%]">
          <div className="h-full w-full bg-[radial-gradient(ellipse_70%_50%_at_30%_20%,rgba(37,99,235,0.22),transparent_55%),radial-gradient(ellipse_50%_40%_at_80%_60%,rgba(234,179,8,0.08),transparent_50%)]" />
        </div>
        <div className="absolute inset-0 opacity-40">
          <div className="h-full w-full bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.04)_35%,transparent_70%)] bg-[length:280%_100%]" />
        </div>
        <div className="absolute left-1/2 top-[18%] h-64 w-64 -translate-x-1/2 rounded-full bg-amber-400/15 blur-[100px]" />
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
            className={[
              // Mobile: keep one line and allow horizontal scroll instead of wrapping/cramping.
              "flex items-center justify-start gap-x-4",
              "max-w-[52vw] overflow-x-auto whitespace-nowrap",
              "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
              "text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-400",
              "sm:max-w-none sm:justify-center sm:gap-x-10 sm:text-xs",
            ].join(" ")}
            aria-label="Page sections"
          >
            <a href="#about" className="hover:text-amber-200/95">
              About
            </a>
            <a href="#highlights" className="hover:text-amber-200/95">
              Highlights
            </a>
            <a href="#projects" className="hover:text-amber-200/95">
              Projects
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
        {/* Hero — layered (no nested scroll container) */}
        <section id="hero" className="relative" aria-labelledby="hero-heading">
          <div className="relative h-screen overflow-hidden">
            <div className="absolute inset-0">
              <Image
                src={eventPhotoSrc(heroFile)}
                alt=""
                fill
                className="object-cover object-[50%_40%]"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black" />
            </div>

            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_20%,rgba(37,99,235,0.20),transparent_55%),radial-gradient(ellipse_60%_45%_at_75%_65%,rgba(234,179,8,0.10),transparent_58%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(105deg,transparent_0%,rgba(255,255,255,0.04)_35%,transparent_70%)] opacity-40" />
            </div>

            <HeroContent
              reducedMotion={Boolean(reducedMotion || springReducedMotion)}
              pixelClassName={pixelAccent.className}
              pointer={pointer}
            />
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-10">
          {/* About (rehash) */}
          <section id="about" className="scroll-mt-24 py-16 sm:scroll-mt-32 sm:py-20">
            <div className="grid gap-10 md:grid-cols-[1.1fr,0.9fr] md:items-start md:gap-14">
              <div className="space-y-4">
                <h2 className={`${pixelAccent.className} text-[10px] uppercase tracking-[0.35em] text-amber-300/95`}>
                  About
                </h2>
                <p className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  A platform for stories, demos, and collaboration—built around what innovation looks like on the ground.
                </p>
                <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
                  Each AIF gathering connects founders, builders, public leaders, and media—so ideas move from talk to
                  prototypes to partnerships. Registration links are shared per event by organizers.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                {[
                  { k: "Panels", v: "Actionable discussions" },
                  { k: "Exhibits", v: "Showcase & demos" },
                  { k: "Networking", v: "Meet people fast" },
                  { k: "Media", v: "Stories that travel" },
                ].map((x) => (
                  <div
                    key={x.k}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                  >
                    <div className={`${pixelAccent.className} text-[10px] tracking-[0.28em] text-zinc-400`}>{x.k}</div>
                    <div className="mt-2 text-sm font-semibold text-zinc-100">{x.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Highlights (rehash) */}
          <section id="highlights" className="scroll-mt-24 py-16 sm:scroll-mt-32 sm:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={`${pixelAccent.className} text-[10px] uppercase tracking-[0.35em] text-amber-300/95`}>
                  Highlights
                </h2>
                <p className="mt-3 max-w-2xl text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Keynotes, panels, exhibition floors, and meetups—capturing momentum.
                </p>
              </div>
              <p className="max-w-md text-sm text-zinc-400">
                A curated snapshot of the experience—designed to read cleanly on any device.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-12">
              <div className="md:col-span-7">
                <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/12">
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={eventPhotoSrc(EVENT_PHOTO_FILES[4])}
                      alt="Asian Innovation Forum highlights"
                      fill
                      className="object-cover object-[50%_25%]"
                      sizes="(max-width: 768px) 100vw, 720px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="max-w-lg rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-zinc-200 backdrop-blur">
                      Conversations designed to unlock collaboration between media, innovators, enterprises, and the public sphere.
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:col-span-5">
                {[
                  { t: "Curated speakers", d: "Operators, founders, and public voices." },
                  { t: "Hands-on demos", d: "See product and prototypes up close." },
                  { t: "Fast networking", d: "Structured moments to connect." },
                ].map((c) => (
                  <div key={c.t} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="text-sm font-semibold text-white">{c.t}</div>
                    <div className="mt-2 text-sm text-zinc-400">{c.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Projects (rehash) */}
          <section id="projects" className="scroll-mt-24 py-16 sm:scroll-mt-32 sm:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={`${pixelAccent.className} text-[10px] uppercase tracking-[0.35em] text-amber-300/95`}>
                  Projects
                </h2>
                <p className="mt-3 max-w-2xl text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  A clean, scrollable showcase.
                </p>
              </div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">Swipe / scroll</div>
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-950/30 py-6 backdrop-blur-sm sm:mt-10">
              <Swiper
                modules={[EffectCoverflow, Autoplay]}
                effect="coverflow"
                centeredSlides
                slidesPerView="auto"
                grabCursor
                loop
                autoplay={
                  reducedMotion
                    ? false
                    : {
                        delay: 2200,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                      }
                }
                coverflowEffect={{
                  rotate: 14,
                  stretch: 0,
                  depth: 170,
                  modifier: 1.1,
                  slideShadows: false,
                }}
                breakpoints={{
                  640: {
                    coverflowEffect: { rotate: 16, depth: 200, modifier: 1.1, stretch: 0, slideShadows: false },
                  },
                  1024: {
                    coverflowEffect: { rotate: 18, depth: 240, modifier: 1.15, stretch: 0, slideShadows: false },
                  },
                }}
                className="!px-3 sm:!px-6"
              >
                {projects.map((p) => (
                  <SwiperSlide
                    key={p.title}
                    className="!w-[14.25rem] xs:!w-[15.5rem] sm:!w-[20rem] lg:!w-[22rem]"
                  >
                    <div className="overflow-hidden rounded-2xl ring-1 ring-white/12">
                      <div className="relative aspect-[4/5]">
                        <Image
                          src={eventPhotoSrc(p.file)}
                          alt={p.title}
                          fill
                          className="object-cover object-[50%_35%]"
                          sizes="(max-width: 640px) 75vw, 360px"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      </div>
                      <div className="p-4">
                        <div className="flex items-baseline justify-between gap-3">
                          <div className="text-sm font-semibold text-white">{p.title}</div>
                          <div className={`${pixelAccent.className} text-[10px] text-amber-200/90`}>{p.year}</div>
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.25em] text-zinc-400">Asian Innovation Forum</div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>

          {/* Gallery (rehash) */}
          <section id="moments" className="scroll-mt-24 py-16 sm:scroll-mt-32 sm:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={`${pixelAccent.className} text-[10px] uppercase tracking-[0.35em] text-amber-300/95`}>
                  Gallery
                </h2>
                <p className="mt-3 max-w-2xl text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Moments from the floor.
                </p>
              </div>
              <div className="text-sm text-zinc-400">{galleryFiles.length} photos</div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {galleryFiles.slice(0, 12).map((file, idx) => (
                <figure key={file} className="overflow-hidden rounded-xl ring-1 ring-white/12">
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={eventPhotoSrc(file)}
                      alt={`AIF photo ${idx + 1}`}
                      fill
                      className="object-cover object-[50%_40%] transition-transform duration-500 hover:scale-[1.04]"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px"
                    />
                  </div>
                </figure>
              ))}
            </div>
          </section>

          {/* Partners (rehash) */}
          <section id="partners" className="scroll-mt-24 py-16 sm:scroll-mt-32 sm:py-20">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-10">
              <div className="grid gap-8 md:grid-cols-[1.2fr,0.8fr] md:items-center">
                <div>
                  <h2 className={`${pixelAccent.className} text-[10px] uppercase tracking-[0.35em] text-amber-300/95`}>
                    Presented by
                  </h2>
                  <p className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">Daily Tribune</p>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
                    Produced with the journalism mission of Daily Tribune—supporting public understanding of innovation and
                    accountability in the digital age.
                  </p>
                </div>
                <div className="relative mx-auto h-12 w-[15rem] sm:h-14 sm:w-[17rem]">
                  <Image src="/assets/dt.png" alt="Daily Tribune logo" fill className="object-contain" sizes="272px" />
                </div>
              </div>
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

function HeroContent({
  reducedMotion,
  pixelClassName,
  pointer,
}: {
  reducedMotion: boolean;
  pixelClassName: string;
  pointer: { x: number; y: number };
}) {
  const titleLines = useMemo(() => ["Asian", "Innovation", "Forum"], []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const intro = useSpring({
    from: { opacity: 0, y: 18, scale: 0.98 },
    to: mounted ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 18, scale: 0.98 },
    config: { tension: 220, friction: 26, mass: 0.9 },
    immediate: reducedMotion,
  });

  const titleTrail = useTrail(titleLines.length, {
    from: { opacity: 0, y: 22 },
    to: mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 },
    config: { tension: 250, friction: 22, mass: 0.9 },
    immediate: reducedMotion,
    delay: reducedMotion ? 0 : 90,
  });

  const tilt = reducedMotion
    ? undefined
    : `perspective(1200px) rotateX(${(-pointer.y * 3.8).toFixed(3)}deg) rotateY(${(pointer.x * 5.0).toFixed(3)}deg)`;

  return (
      <div className="absolute inset-0 grid place-items-center px-4 pt-20 sm:pt-24">
        <animated.div
          className="relative w-full max-w-5xl"
          style={{
            opacity: intro.opacity,
            transform: intro.y.to((y) => `translate3d(0, ${y}px, 0)`),
          }}
        >
          <div className="grid gap-7 md:grid-cols-[1.05fr,0.95fr] md:items-center md:gap-10">
            <div className="text-center md:text-left">
              <p className={`${pixelClassName} text-[10px] uppercase tracking-[0.45em] text-amber-300/95`}>
                Presented by Daily Tribune
              </p>
              <h1 className="sr-only">Asian Innovation Forum</h1>

              <div className="mt-5 space-y-1 text-4xl font-semibold leading-[0.95] tracking-tight text-white xs:text-5xl sm:text-6xl md:text-7xl">
                {titleTrail.map((st, idx) => (
                  <animated.div
                    key={titleLines[idx]}
                    style={{
                      opacity: st.opacity,
                      transform: st.y.to((y) => `translate3d(0, ${y}px, 0)`),
                    }}
                    className="text-balance"
                  >
                    {titleLines[idx]}
                  </animated.div>
                ))}
              </div>

              <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base md:mx-0">
                A showcase of leaders, builders, and ideas shaping the next wave of technology and public innovation across
                Asia-Pacific.
              </p>

              <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center md:justify-start">
                <a
                  href="#highlights"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/15 sm:w-auto"
                >
                  Explore highlights
                </a>
                <a
                  href="#projects"
                  className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-black/30 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:bg-white/5 sm:w-auto"
                >
                  View projects
                </a>
              </div>
            </div>

            <div className="mx-auto w-full max-w-xl md:max-w-none">
              <div
                className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/45 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-md sm:p-8"
                style={{
                  transform: tilt,
                  transformStyle: "preserve-3d",
                  willChange: reducedMotion ? undefined : "transform",
                }}
              >
                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
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

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { k: "Panels", v: "Big ideas, clear actions" },
                    { k: "Showcase", v: "Demos and exhibits" },
                    { k: "Network", v: "Meet people fast" },
                  ].map((x) => (
                    <div key={x.k} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className={`${pixelClassName} text-[10px] tracking-[0.28em] text-zinc-400`}>{x.k}</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-100">{x.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none mt-10 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.35em] text-zinc-500 md:justify-start">
            <span className="h-px w-10 bg-white/10" />
            Scroll
            <span className="h-px w-10 bg-white/10" />
          </div>
        </animated.div>
      </div>
  );
}
