"use client";

import { Upload, Wand2, Edit, Download } from "lucide-react";

const STEPS = [
    {
        icon: Upload,
        title: "영상 업로드",
        description: "드래그 앤 드롭으로 영상 파일을 간편하게 업로드하세요. 다양한 포맷을 지원합니다.",
        step: "01"
    },
    {
        icon: Wand2,
        title: "AI 자동 처리",
        description: "AI가 음성을 인식하고 자막을 자동으로 생성합니다. 90개 이상의 언어를 지원합니다.",
        step: "02"
    },
    {
        icon: Edit,
        title: "편집 및 스타일링",
        description: "타임라인에서 자막을 수정하고, 스타일을 커스터마이징하세요. 실시간 미리보기를 제공합니다.",
        step: "03"
    },
    {
        icon: Download,
        title: "내보내기",
        description: "SRT, VTT, 또는 자막이 입혀진 MP4 파일로 다운로드하세요. 원클릭으로 완성됩니다.",
        step: "04"
    }
];

export default function HowItWorksTimeline() {
    return (
        <section id="how" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
            <div className="text-center mb-16">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
                    How It Works
                </span>
                <h2 className="text-3xl font-bold md:text-4xl">
                    간단한 4단계로 완성
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                    복잡한 설정 없이 누구나 쉽게 사용할 수 있습니다.
                </p>
            </div>

            <div className="relative">
                {/* Timeline line - hidden on mobile, shown on md+ */}
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 -translate-x-1/2" />

                <div className="space-y-12 md:space-y-16">
                    {STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isEven = idx % 2 === 0;

                        return (
                            <div
                                key={step.title}
                                className={`relative flex flex-col md:flex-row items-center gap-6 ${isEven ? "md:flex-row" : "md:flex-row-reverse"
                                    }`}
                            >
                                {/* Content card */}
                                <div className={`w-full md:w-[calc(50%-3rem)] ${isEven ? "md:text-right" : "md:text-left"}`}>
                                    <div className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                                        {/* Mobile icon (only shown on mobile) */}
                                        <div className="md:hidden w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <Icon className="w-6 h-6 text-primary" />
                                        </div>

                                        <div className={`flex items-center gap-3 mb-3 ${isEven ? "md:flex-row-reverse" : "md:flex-row"}`}>
                                            <span className="text-4xl font-bold text-primary/20">
                                                {step.step}
                                            </span>
                                            <h3 className="text-xl font-semibold">
                                                {step.title}
                                            </h3>
                                        </div>

                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {step.description}
                                        </p>

                                        {/* Hover glow effect */}
                                        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                                    </div>
                                </div>

                                {/* Timeline node (desktop only) */}
                                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-background bg-gradient-to-br from-primary to-primary/60 items-center justify-center shadow-lg shadow-primary/20 z-10">
                                    <Icon className="w-7 h-7 text-primary-foreground" />
                                </div>

                                {/* Spacer for the other side on desktop */}
                                <div className="hidden md:block w-[calc(50%-3rem)]" />
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
