import { FAQS } from "@/lib/landing-data";

export default function FAQAccordion() {
    return (
        <section id="faq" className="mx-auto max-w-6xl px-4 py-16 md:py-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="mb-8">
                <h2 className="text-2xl font-semibold md:text-3xl">FAQ</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    결제/품질/보관/편집 범위에서 많이 나오는 질문을 미리 정리했습니다.
                </p>
            </div>

            <div className="grid gap-3">
                {FAQS.map((f) => (
                    <details key={f.q} className="group border border-border bg-card p-5">
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
