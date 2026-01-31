"use client";

import { Lightbulb, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export function TipsSection() {
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Tips & Updates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/50 rounded-none">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-amber-500/10 text-amber-600 rounded-full shrink-0">
                            <Lightbulb className="size-5" />
                        </div>
                        <div>
                            <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                                Did you know?
                            </h3>
                            <p className="text-sm text-amber-800/80 dark:text-amber-200/70 mb-3">
                                You can use AI to automatically translate your subtitles into multiple languages with one click.
                            </p>
                            <Link href="#" className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1">
                                Learn about translations <ArrowRight className="size-3" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900/50 rounded-none">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-500/10 text-blue-600 rounded-full shrink-0">
                            <Zap className="size-5" />
                        </div>
                        <div>
                            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Pro Tip: Keyboard Shortcuts
                            </h3>
                            <p className="text-sm text-blue-800/80 dark:text-blue-200/70 mb-3">
                                Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-black border border-gray-200 dark:border-gray-800 font-mono text-xs">K</kbd> to pause/play and <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-black border border-gray-200 dark:border-gray-800 font-mono text-xs">J</kbd>/<kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-black border border-gray-200 dark:border-gray-800 font-mono text-xs">L</kbd> to seek while editing.
                            </p>
                            <Link href="#" className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1">
                                View all shortcuts <ArrowRight className="size-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
