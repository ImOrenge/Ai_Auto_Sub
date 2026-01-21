"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/LogoutButton";
import { Sidebar } from "@/components/Sidebar";

interface AppShellProps {
    children: React.ReactNode;
    isAuthenticated: boolean;
}

export function AppShell({ children, isAuthenticated }: AppShellProps) {
    const params = useParams();
    const projectId = params?.id as string | undefined;

    return (
        <div className="relative flex min-h-screen flex-col">
            {/* Header - Fixed */}
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto flex h-16 w-full max-w-full items-center justify-between px-4 md:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Link className="flex items-center gap-2 font-semibold tracking-tight" href="/dashboard">
                            <span className="text-lg">AutoSubAI</span>
                            <span className="hidden rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary sm:inline">
                                콘솔
                            </span>
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

            {/* Sidebar + Main */}
            <div className="flex flex-1">
                <Sidebar projectId={projectId} />

                {/* Main Content */}
                <main className="flex-1 md:pl-60">
                    {children}
                </main>
            </div>

            {/* Footer */}
            <footer className="border-t bg-background/80 md:pl-60">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
                    <p>© {new Date().getFullYear()} AutoSubAI · Subtitle Automation</p>
                    <p className="text-muted-foreground/80">Built with Next.js 14 + Supabase.</p>
                </div>
            </footer>
        </div>
    );
}
