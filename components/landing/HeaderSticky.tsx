"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/landing-data";
import { LoginModal } from "./LoginModal";

export default function HeaderSticky() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="h-7 w-7 bg-primary ring-1 ring-border" />
                        <span className="text-sm font-semibold tracking-wide">AI Sub Auto</span>
                    </Link>

                    <nav className="hidden items-center gap-6 md:flex">
                        {NAV_ITEMS.map((it) => (
                            <Link key={it.href} href={it.href} className="text-sm text-muted-foreground hover:text-foreground">
                                {it.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsLoginModalOpen(true)}
                            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            로그인
                        </button>
                        <Link
                            href="/signup"
                            className="bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                            무료로 시작
                        </Link>
                    </div>
                </div>
            </header>
            <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
        </>
    );
}
