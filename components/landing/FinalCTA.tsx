"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalCTA() {
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
                        <span className="text-sm text-white/90">무료로 시작하세요</span>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        이제, 자막 작업을 자동화하세요.
                    </h3>

                    <p className="max-w-2xl mx-auto text-white/80 mb-8 text-lg">
                        업로드하면 AI가 자동으로 자막을 생성합니다.
                        <br className="hidden md:block" />
                        지금 바로 무료로 시작해보세요.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/signup"
                            className="group inline-flex items-center gap-2 bg-white px-8 py-4 text-sm font-semibold text-primary rounded-full hover:bg-white/90 transition-all shadow-lg"
                        >
                            무료로 시작하기
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/docs"
                            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium text-white border border-white/30 rounded-full hover:bg-white/10 transition-colors"
                        >
                            문서 살펴보기
                        </Link>
                    </div>

                    <p className="text-white/60 text-sm mt-6">
                        신용카드 없이 시작 · 언제든 취소 가능
                    </p>
                </div>
            </div>
        </section>
    );
}
