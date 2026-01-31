import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Legal</p>
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Please review these terms carefully before using the service.
        </p>
      </header>

      <section className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p>
          This page is the official Terms of Service for AutoSubAI. Replace the
          text below with your finalized policy copy.
        </p>
        <div className="rounded-2xl border border-border bg-card/70 p-5 text-foreground">
          <p className="font-semibold">Policy placeholder</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your terms, obligations, refund policy, and service limitations
            here. You can also link to your Privacy Policy for data handling
            details.
          </p>
          <p className="mt-3 text-sm">
            Related:{" "}
            <Link className="font-semibold text-primary underline-offset-4 hover:underline" href="/privacy">
              Privacy Policy
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
