"use client";

import { USE_CASES } from "@/lib/landing-data";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function UseCasesSection() {
    return (
        <section id="usecases" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
            <div className="text-center mb-12">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
                    Use Cases
                </span>
                <h2 className="text-3xl font-bold md:text-4xl">
                    누구를 위한 서비스인가요?
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                    유튜버, 마케터, 교육자까지. 영상 자막이 필요한 모든 분들을 위한 솔루션입니다.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {USE_CASES.map((useCase, idx) => {
                    const Icon = useCase.icon;
                    return (
                        <div
                            key={idx}
                            className="group relative p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 overflow-hidden"
                        >
                            {/* Background gradient on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Icon */}
                            <div className="relative w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <Icon className="w-6 h-6 text-primary" />
                            </div>

                            {/* Content */}
                            <div className="relative">
                                <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                    {useCase.description}
                                </p>

                                {/* Benefits */}
                                <ul className="space-y-2">
                                    {useCase.benefits.map((benefit, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-500 shrink-0" />
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <Link
                                    href="/signup"
                                    className="inline-flex items-center gap-1 text-sm text-primary font-medium mt-4 group-hover:underline"
                                >
                                    시작하기
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
