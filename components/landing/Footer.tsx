"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="border-t border-border bg-background">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
                <div>
                    <div className="text-sm font-semibold">{t("landing.footer.product")}</div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        <Link href="#features" className="hover:text-foreground">{t("landing.footer.links.features")}</Link>
                        <Link href="#pricing" className="hover:text-foreground">{t("landing.footer.links.pricing")}</Link>
                        <Link href="/changelog" className="hover:text-foreground">Changelog</Link>
                    </div>
                </div>

                <div>
                    <div className="text-sm font-semibold">Resources</div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        <Link href="/docs" className="hover:text-foreground">{t("landing.footer.links.docs")}</Link>
                        <Link href="/status" className="hover:text-foreground">Status</Link>
                        <Link href="/support" className="hover:text-foreground">Support</Link>
                    </div>
                </div>

                <div>
                    <div className="text-sm font-semibold">{t("landing.footer.company")}</div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        <Link href="/about" className="hover:text-foreground">About</Link>
                        <Link href="/contact" className="hover:text-foreground">Contact</Link>
                    </div>
                </div>

                <div>
                    <div className="text-sm font-semibold">{t("landing.footer.legal")}</div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        <Link href="/terms" className="hover:text-foreground">{t("landing.footer.links.terms")}</Link>
                        <Link href="/privacy" className="hover:text-foreground">{t("landing.footer.links.privacy")}</Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted-foreground">
                {t("common.footer.copyright").replace("{year}", new Date().getFullYear().toString())}
            </div>
        </footer>
    );
}
