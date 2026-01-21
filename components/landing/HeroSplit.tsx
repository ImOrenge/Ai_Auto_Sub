import Link from "next/link";
import { HERO } from "@/lib/landing-data";

export default function HeroSplit() {
    return (
        <section className="relative overflow-hidden">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
                <div className="flex flex-col justify-center">
                    <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                        {HERO.eyebrow}
                    </div>

                    <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
                        {HERO.h1}
                    </h1>

                    <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-200 md:text-lg">
                        {HERO.sub}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <Link
                            href={HERO.primaryCta.href}
                            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
                        >
                            {HERO.primaryCta.label}
                        </Link>
                        <Link
                            href={HERO.secondaryCta.href}
                            className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10"
                        >
                            {HERO.secondaryCta.label}
                        </Link>
                    </div>

                    <ul className="mt-6 grid gap-2 text-sm text-neutral-200">
                        {HERO.bullets.map((b) => (
                            <li key={b} className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                                {b}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Visual / Demo */}
                <div className="flex items-center">
                    <div
                        id="demo"
                        className="w-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
                    >
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-neutral-200">Dashboard Preview</div>
                            <div className="flex gap-2">
                                {["UPLOADED", "STT", "TRANSLATE", "DONE"].map((s) => (
                                    <span key={s} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-neutral-200">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="aspect-video rounded-xl bg-black/30 ring-1 ring-white/10">
                                    <div className="p-3 text-xs text-neutral-300">Video #{i}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
                            <div className="text-xs text-neutral-300">Subtitle Editor (Preview)</div>
                            <div className="mt-2 h-14 rounded-lg bg-white/5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* subtle background */}
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
                <div className="absolute left-[-20%] top-[-20%] h-[420px] w-[420px] rounded-full bg-white/10 blur-3xl" />
                <div className="absolute right-[-20%] bottom-[-30%] h-[520px] w-[520px] rounded-full bg-white/10 blur-3xl" />
            </div>
        </section>
    );
}
