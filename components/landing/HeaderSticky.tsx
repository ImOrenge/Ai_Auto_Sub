"use client";

import Link from "next/link";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/landing-data";
import { LoginModal } from "./LoginModal";

export default function HeaderSticky() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-white/10 ring-1 ring-white/10" />
                        <span className="text-sm font-semibold tracking-wide">AI Sub Auto</span>
                    </Link>

                    <nav className="hidden items-center gap-6 md:flex">
                        {NAV_ITEMS.map((it) => (
                            <Link key={it.href} href={it.href} className="text-sm text-neutral-200 hover:text-white">
                                {it.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsLoginModalOpen(true)}
                            className="rounded-lg px-3 py-2 text-sm text-neutral-200 hover:text-white transition-colors"
                        >
                            로그인
                        </button>
                        <Link
                            href="/signup"
                            className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-neutral-950 hover:bg-neutral-200 transition-colors"
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
