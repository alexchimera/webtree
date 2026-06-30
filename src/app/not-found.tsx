import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="font-mono text-5xl font-bold text-accent-bright">404</div>
      <p className="text-sm text-ink-dim">
        No document at this address — it may have been removed.
      </p>
      <Link
        href="/"
        className="border border-accent/50 bg-accent/10 px-4 py-2 text-sm text-accent-bright hover:bg-accent/20"
      >
        Back to start
      </Link>
    </div>
  );
}
