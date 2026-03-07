"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function FinalCTA() {
    const { t } = useLanguage();

    return (
        <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-24 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-purple-600 p-8 md:p-16 text-center">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:2rem_2rem]" />
                </div>

                {/* Floating elements */}
                <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                <div className="relative">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
                        <Sparkles className="w-4 h-4 text-white" />
                        <span className="text-sm text-white/90">{t("landing.cta.badge") || t("common.signup")}</span>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        {t("landing.cta.title")}
                    </h3>

                    <p className="max-w-2xl mx-auto text-white/80 mb-8 text-lg">
                        {t("landing.cta.subtitle")}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/signup"
                            className="group inline-flex items-center gap-2 bg-white px-8 py-4 text-sm font-semibold text-primary rounded-full hover:bg-white/90 transition-all shadow-lg"
                        >
                            {t("landing.cta.primary")}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/#pricing"
                            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium text-white border border-white/30 rounded-full hover:bg-white/10 transition-colors"
                        >
                            {t("landing.cta.secondary")}
                        </Link>
                    </div>

                    <p className="text-white/60 text-sm mt-6">
                        {t("landing.cta.disclaimer") || "Start without credit card · Cancel anytime"}
                    </p>
                </div>
            </div>
        </section>
    );
}
