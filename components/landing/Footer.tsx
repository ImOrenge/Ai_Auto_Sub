import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-border bg-background">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
                <div>
                    <div className="text-sm font-semibold">Product</div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        <Link href="#features" className="hover:text-foreground">Features</Link>
                        <Link href="#pricing" className="hover:text-foreground">Pricing</Link>
                        <Link href="/changelog" className="hover:text-foreground">Changelog</Link>
                    </div>
                </div>

                <div>
                    <div className="text-sm font-semibold">Resources</div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        <Link href="/docs" className="hover:text-foreground">Docs</Link>
                        <Link href="/status" className="hover:text-foreground">Status</Link>
                        <Link href="/support" className="hover:text-foreground">Support</Link>
                    </div>
                </div>

                <div>
                    <div className="text-sm font-semibold">Company</div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        <Link href="/about" className="hover:text-foreground">About</Link>
                        <Link href="/contact" className="hover:text-foreground">Contact</Link>
                    </div>
                </div>

                <div>
                    <div className="text-sm font-semibold">Legal</div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        <Link href="/terms" className="hover:text-foreground">Terms</Link>
                        <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted-foreground">
                © {new Date().getFullYear()} AI Sub Auto. All rights reserved.
            </div>
        </footer>
    );
}
