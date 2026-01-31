"use client";

import Link from "next/link";
import { HERO } from "@/lib/landing-data";
import { Play, Sparkles, ArrowRight, Check } from "lucide-react";

export default function HeroSplit() {
    return (
        <section className="relative overflow-hidden pt-10">
            {/* Animated background gradient */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Top badge */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/80 backdrop-blur-sm shadow-sm">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{HERO.eyebrow}</span>
                        <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">New</span>
                    </div>
                </div>

                {/* Main headline */}
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-bold leading-tight bg-gradient-to-br from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
                        {HERO.h1}
                    </h1>

                    <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        {HERO.sub}
                    </p>

                    {/* CTA Buttons */}
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href={HERO.primaryCta.href}
                            className="group inline-flex items-center gap-2 bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground rounded-full hover:opacity-90 transition-all shadow-lg shadow-primary/25"
                        >
                            {HERO.primaryCta.label}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href={HERO.secondaryCta.href}
                            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium border border-border rounded-full hover:bg-muted transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            {HERO.secondaryCta.label}
                        </Link>
                    </div>

                    {/* Bullet features */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        {HERO.bullets.map((bullet, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                <span>{bullet}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {HERO.stats.map((stat, idx) => (
                        <div key={idx} className="text-center p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
                            <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                            <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Product Preview */}
                <div className="mt-16 flex justify-center perspective-1200 group">
                    <div className="relative w-full max-w-4xl rounded-xl border border-border bg-card p-2 shadow-2xl transition-all duration-500 ease-out md:group-hover:-translate-y-2 md:group-hover:shadow-primary/10">
                        <div className="overflow-hidden rounded-lg bg-background ring-1 ring-border">
                            <img
                                src="/dashboard-preview.png"
                                alt="AI Sub Auto Dashboard Preview"
                                className="w-full object-cover"
                            />
                        </div>
                        {/* Glow Effect */}
                        <div className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/10 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </div>
                </div>

                {/* Trusted by text */}
                <p className="text-center text-sm text-muted-foreground mt-8">
                    이미 수천 명의 크리에이터가 사용 중입니다
                </p>
            </div>
        </section>
    );
}
