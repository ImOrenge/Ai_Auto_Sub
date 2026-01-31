"use client";

import { FEATURES } from "@/lib/landing-data";

export default function FeatureGrid() {
    return (
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 md:py-24 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            <div className="text-center mb-12">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
                    Features
                </span>
                <h2 className="text-3xl font-bold md:text-4xl">
                    자막 작업의 모든 것을 한 곳에서
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                    업로드부터 편집, 내보내기까지. 복잡한 자막 워크플로우를 단순하게 만들어드립니다.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((f, idx) => {
                    const Icon = f.icon;
                    return (
                        <div
                            key={f.title}
                            className="group relative p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            {/* Icon with gradient background */}
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Icon className="w-6 h-6 text-primary" />
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{f.title}</h3>
                                {f.badge && (
                                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${f.badge === "Core"
                                            ? "bg-primary text-primary-foreground"
                                            : f.badge === "Popular"
                                                ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                                                : "bg-muted text-muted-foreground"
                                        }`}>
                                        {f.badge}
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {f.description}
                            </p>

                            {/* Hover glow effect */}
                            <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
