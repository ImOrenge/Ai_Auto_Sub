"use client";

import { TESTIMONIALS } from "@/lib/landing-data";
import { Star, Quote } from "lucide-react";

export default function TestimonialsSection() {
    return (
        <section id="testimonials" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
            <div className="text-center mb-12">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
                    Testimonials
                </span>
                <h2 className="text-3xl font-bold md:text-4xl">
                    사용자들의 이야기
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                    AI Sub Auto로 자막 작업 효율을 높인 크리에이터와 마케터들의 후기입니다.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {TESTIMONIALS.map((testimonial, idx) => (
                    <div
                        key={idx}
                        className="relative p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors"
                    >
                        {/* Quote icon */}
                        <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />

                        {/* Rating */}
                        <div className="flex gap-0.5 mb-4">
                            {Array.from({ length: testimonial.rating }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>

                        {/* Content */}
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                            &ldquo;{testimonial.content}&rdquo;
                        </p>

                        {/* Author */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-semibold text-primary">
                                {testimonial.avatar}
                            </div>
                            <div>
                                <div className="font-semibold text-sm">{testimonial.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {testimonial.role} · {testimonial.company}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
