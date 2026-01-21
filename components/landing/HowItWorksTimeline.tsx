const STEPS = [
    { title: "Upload", desc: "URL 또는 로컬 업로드 → Job 생성" },
    { title: "STT", desc: "자동 전사 + 타임코드 생성" },
    { title: "Translate", desc: "다국어 번역(옵션) + 표기 규칙" },
    { title: "Edit & Export", desc: "필요한 부분만 편집 → SRT/VTT/MP4" },
];

export default function HowItWorksTimeline() {
    return (
        <section id="how" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <div className="mb-8">
                <h2 className="text-2xl font-semibold md:text-3xl">How it works</h2>
                <p className="mt-2 max-w-2xl text-sm text-neutral-200">
                    복잡한 흐름을 “표준 파이프라인 + 상태 머신”으로 고정해서, 운영이 쉬워지고 결과가 일관됩니다.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                {STEPS.map((s, idx) => (
                    <div key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-neutral-300">Step {idx + 1}</div>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-neutral-200">
                                {s.title.toUpperCase()}
                            </span>
                        </div>
                        <div className="mt-3 text-base font-semibold">{s.title}</div>
                        <p className="mt-2 text-sm leading-relaxed text-neutral-200">{s.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
