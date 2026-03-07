"use client";

import { useLanguage } from "@/lib/i18n";

export default function FAQAccordion() {
    const { t } = useLanguage();
    const faqItems = t("landing.faq.items") as { q: string; a: string }[];

    return (
        <section id="faq" className="mx-auto max-w-6xl px-4 py-16 md:py-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="mb-8">
                <h2 className="text-2xl font-semibold md:text-3xl">{t("landing.faq.title")}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    {t("landing.faq.subtitle")}
                </p>
            </div>

            <div className="grid gap-3">
                {faqItems.map((f, idx) => (
                    <details key={idx} className="group border border-border bg-card p-5">
                        <summary className="cursor-pointer list-none text-sm font-semibold">
                            <div className="flex items-center justify-between gap-4">
                                <span>{f.q}</span>
                                <span className="text-muted-foreground group-open:rotate-45 transition">+</span>
                            </div>
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                    </details>
                ))}
            </div>
        </section>
    );
}
