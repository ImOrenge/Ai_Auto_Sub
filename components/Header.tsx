"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/LogoutButton";

interface HeaderProps {
    isAuthenticated: boolean;
    title?: React.ReactNode;
}

export function Header({ isAuthenticated, title }: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 w-full max-w-full items-center justify-between px-4 md:px-6 lg:px-8">
                <div className="flex items-center gap-4">
                    <Link className="flex items-center gap-2 font-semibold tracking-tight" href="/dashboard">
                        <span className="text-lg">AutoSubAI</span>
                        {title}
                    </Link>
                </div>

                <nav className="flex items-center gap-3 text-sm">
                    <LogoutButton isAuthenticated={isAuthenticated} />
                    <Link
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                        href="https://supabase.com/docs"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Docs
                        <span aria-hidden="true" className="text-[10px]">↗</span>
                    </Link>
                </nav>
            </div>
        </header>
    );
}
