"use client";

import { Upload, Mic, Languages, Download, ArrowRight } from "lucide-react";

const STEPS = [
    {
        title: "Upload",
        desc: "URL 또는 로컬 파일을 드래그 앤 드롭으로 업로드",
        icon: Upload,
        color: "from-blue-500 to-blue-600",
    },
    {
        title: "STT",
        desc: "AI가 음성을 인식해 자동으로 타임코드 포함 자막 생성",
        icon: Mic,
        color: "from-purple-500 to-purple-600",
    },
    {
        title: "Translate",
        desc: "90개+ 언어로 원클릭 번역. 맥락을 이해한 자연스러운 결과",
        icon: Languages,
        color: "from-green-500 to-green-600",
    },
    {
        title: "Export",
        desc: "SRT/VTT 자막 파일 또는 자막 입힌 MP4로 바로 다운로드",
        icon: Download,
        color: "from-orange-500 to-orange-600",
    },
];

export default function HowItWorksTimeline() {
    return (
        <section id="how" className="mx-auto max-w-6xl px-4 py-16 md:py-24 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700">
            <div className="text-center mb-12">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
                    How it works
                </span>
                <h2 className="text-3xl font-bold md:text-4xl">
                    4단계로 끝나는 자막 작업
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                    복잡한 과정 없이, 업로드만 하면 AI가 알아서 처리합니다.
                </p>
            </div>

            {/* Timeline for desktop */}
            <div className="hidden md:block relative">
                {/* Connection line */}
                <div className="absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 via-green-500 to-orange-500" />

                <div className="grid grid-cols-4 gap-6">
                    {STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        return (
                            <div key={step.title} className="relative">
                                {/* Step number & icon */}
                                <div className="flex flex-col items-center mb-6">
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg relative z-10`}>
                                        <Icon className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="absolute top-20 w-4 h-4 rounded-full bg-background border-4 border-primary z-20" />
                                </div>

                                {/* Content */}
                                <div className="text-center pt-8">
                                    <div className="text-xs text-muted-foreground mb-1">Step {idx + 1}</div>
                                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                                </div>

                                {/* Arrow (except last) */}
                                {idx < STEPS.length - 1 && (
                                    <div className="absolute top-7 -right-3 z-30">
                                        <ArrowRight className="w-6 h-6 text-muted-foreground/30" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Timeline for mobile */}
            <div className="md:hidden space-y-6">
                {STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    return (
                        <div key={step.title} className="flex gap-4">
                            {/* Left: Icon & line */}
                            <div className="flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shrink-0`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className="w-0.5 flex-1 bg-border my-2" />
                                )}
                            </div>

                            {/* Right: Content */}
                            <div className="pb-6">
                                <div className="text-xs text-muted-foreground mb-1">Step {idx + 1}</div>
                                <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                                <p className="text-sm text-muted-foreground">{step.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
                <p className="text-muted-foreground mb-4">
                    지금 바로 시작해보세요. 회원가입 후 무료 크레딧이 제공됩니다.
                </p>
            </div>
        </section>
    );
}
