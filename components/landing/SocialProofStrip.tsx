import { SOCIAL_PROOF } from "@/lib/landing-data";

export default function SocialProofStrip() {
    return (
        <section className="border-y border-white/10 bg-white/[0.03]">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
                {SOCIAL_PROOF.map((it) => (
                    <div key={it.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-neutral-300">{it.label}</div>
                        <div className="mt-1 text-lg font-semibold">{it.value}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}
