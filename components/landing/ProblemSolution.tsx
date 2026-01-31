"use client";

import { BEFORE_AFTER } from "@/lib/landing-data";
import { Check, X, ArrowRight } from "lucide-react";

export default function ProblemSolution() {
    return (
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-24 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
            <div className="text-center mb-12">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
                    Before & After
                </span>
                <h2 className="text-3xl font-bold md:text-4xl">
                    자막 작업, 이렇게 달라집니다
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                    반복적인 수작업에서 벗어나 AI가 처리하는 효율적인 워크플로우로.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 relative">
                {/* Arrow connector (desktop only) */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                        <ArrowRight className="w-8 h-8 text-primary-foreground" />
                    </div>
                </div>

                {/* Before Card */}
                <div className="relative p-6 md:p-8 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                            <X className="w-4 h-4 text-red-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">
                            {BEFORE_AFTER.before.title}
                        </h3>
                    </div>

                    <ul className="space-y-4">
                        {BEFORE_AFTER.before.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0 mt-0.5">
                                    <X className="w-3 h-3 text-red-500" />
                                </div>
                                <span className="text-sm text-muted-foreground">{item.text}</span>
                            </li>
                        ))}
                    </ul>

                    {/* Time indicator */}
                    <div className="mt-6 pt-4 border-t border-red-200 dark:border-red-900/50">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <span className="text-2xl font-bold">4~6시간</span>
                            <span className="text-sm">/ 영상 1개당</span>
                        </div>
                    </div>
                </div>

                {/* After Card */}
                <div className="relative p-6 md:p-8 rounded-2xl border border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-green-700 dark:text-green-400">
                            {BEFORE_AFTER.after.title}
                        </h3>
                    </div>

                    <ul className="space-y-4">
                        {BEFORE_AFTER.after.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0 mt-0.5">
                                    <Check className="w-3 h-3 text-green-500" />
                                </div>
                                <span className="text-sm text-foreground">{item.text}</span>
                            </li>
                        ))}
                    </ul>

                    {/* Time indicator */}
                    <div className="mt-6 pt-4 border-t border-green-200 dark:border-green-900/50">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <span className="text-2xl font-bold">15~30분</span>
                            <span className="text-sm">/ 영상 1개당</span>
                        </div>
                    </div>

                    {/* Savings badge */}
                    <div className="absolute -top-3 -right-3 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                        90% 시간 절약
                    </div>
                </div>
            </div>
        </section>
    );
}
