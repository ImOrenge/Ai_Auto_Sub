"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
    { href: "/#features", label: "기능" },
    { href: "/#workflow", label: "워크플로" },
    { href: "/pricing", label: "가격" },
];

export function MarketingHeader() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6 lg:px-8">
                {/* Logo */}
                <Link className="flex items-center gap-2 font-semibold tracking-tight" href="/">
                    <span className="text-lg">AutoSubAI</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-6 md:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium text-muted-foreground transition hover:text-foreground",
                                pathname === link.href && "text-foreground"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Desktop CTA */}
                <div className="hidden items-center gap-3 md:flex">
                    <Link
                        href="/login"
                        className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                    >
                        로그인
                    </Link>
                    <Link
                        href="/signup"
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                        무료로 시작하기
                        <ArrowRight className="size-4" />
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground md:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
                >
                    {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="border-t bg-background md:hidden">
                    <nav className="flex flex-col gap-1 p-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <hr className="my-2" />
                        <Link
                            href="/login"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            로그인
                        </Link>
                        <Link
                            href="/signup"
                            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            무료로 시작하기
                            <ArrowRight className="size-4" />
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
