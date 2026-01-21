import Link from "next/link";
import { Github, Twitter } from "lucide-react";

const footerLinks = {
    product: [
        { href: "/#features", label: "기능" },
        { href: "/#pricing", label: "가격" },
        { href: "/#workflow", label: "워크플로" },
    ],
    company: [
        { href: "/terms", label: "이용약관" },
        { href: "/privacy", label: "개인정보처리방침" },
    ],
    social: [
        { href: "https://github.com", label: "GitHub", icon: Github },
        { href: "https://twitter.com", label: "Twitter", icon: Twitter },
    ],
};

export function MarketingFooter() {
    return (
        <footer className="border-t bg-background">
            <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 lg:px-8">
                <div className="grid gap-8 md:grid-cols-4">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <Link href="/" className="text-lg font-semibold tracking-tight">
                            AutoSubAI
                        </Link>
                        <p className="mt-3 max-w-md text-sm text-muted-foreground">
                            영상 URL 하나로 Whisper STT, GPT 번역, SRT/MP4 생성까지.
                            자막 자동화 워크플로를 경험하세요.
                        </p>
                        <div className="mt-4 flex gap-3">
                            {footerLinks.social.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                                        aria-label={link.label}
                                    >
                                        <Icon className="size-5" />
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="text-sm font-semibold">제품</h3>
                        <ul className="mt-3 space-y-2">
                            {footerLinks.product.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition hover:text-foreground"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="text-sm font-semibold">회사</h3>
                        <ul className="mt-3 space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-muted-foreground transition hover:text-foreground"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs text-muted-foreground md:flex-row">
                    <p>© {new Date().getFullYear()} AutoSubAI. All rights reserved.</p>
                    <p>Built with Next.js 14 + Supabase.</p>
                </div>
            </div>
        </footer>
    );
}
