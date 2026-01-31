"use client";

import { SOCIAL_PROOF } from "@/lib/landing-data";
import { Globe, Clock, CheckCircle, Download } from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
    globe: Globe,
    clock: Clock,
    check: CheckCircle,
    download: Download,
};

export default function SocialProofStrip() {
    return (
        <section className="border-y border-border bg-muted/30 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {SOCIAL_PROOF.map((item) => {
                        const Icon = ICONS[item.icon] || Globe;
                        return (
                            <div
                                key={item.label}
                                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Icon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold">{item.value}</div>
                                    <div className="text-xs text-muted-foreground">{item.label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
