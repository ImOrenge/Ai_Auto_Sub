import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-white/10 bg-neutral-950">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
                <div>
                    <div className="text-sm font-semibold">Product</div>
                    <div className="mt-3 grid gap-2 text-sm text-neutral-200">
                        <Link href="#features" className="hover:text-white">Features</Link>
                        <Link href="#pricing" className="hover:text-white">Pricing</Link>
                        <Link href="/changelog" className="hover:text-white">Changelog</Link>
                    </div>
                </div>

                <div>
                    <div className="text-sm font-semibold">Resources</div>
                    <div className="mt-3 grid gap-2 text-sm text-neutral-200">
                        <Link href="/docs" className="hover:text-white">Docs</Link>
                        <Link href="/status" className="hover:text-white">Status</Link>
                        <Link href="/support" className="hover:text-white">Support</Link>
                    </div>
                </div>

                <div>
                    <div className="text-sm font-semibold">Company</div>
                    <div className="mt-3 grid gap-2 text-sm text-neutral-200">
                        <Link href="/about" className="hover:text-white">About</Link>
                        <Link href="/contact" className="hover:text-white">Contact</Link>
                    </div>
                </div>

                <div>
                    <div className="text-sm font-semibold">Legal</div>
                    <div className="mt-3 grid gap-2 text-sm text-neutral-200">
                        <Link href="/terms" className="hover:text-white">Terms</Link>
                        <Link href="/privacy" className="hover:text-white">Privacy</Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 pb-10 text-xs text-neutral-400">
                © {new Date().getFullYear()} AI Sub Auto. All rights reserved.
            </div>
        </footer>
    );
}
