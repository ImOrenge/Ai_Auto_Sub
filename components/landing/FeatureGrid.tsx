import { FEATURES } from "@/lib/landing-data";

export default function FeatureGrid() {
    return (
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <div className="mb-8">
                <h2 className="text-2xl font-semibold md:text-3xl">Features</h2>
                <p className="mt-2 max-w-2xl text-sm text-neutral-200">
                    자동화는 “기능”이 아니라 “운영 경험”입니다. 큐/상태/편집/내보내기를 한 흐름으로 제공합니다.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {FEATURES.map((f) => (
                    <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <div className="flex items-center justify-between">
                            <div className="text-base font-semibold">{f.title}</div>
                            {f.badge ? (
                                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-neutral-200">
                                    {f.badge}
                                </span>
                            ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-neutral-200">{f.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
