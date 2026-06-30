"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Loader2, Clock } from "lucide-react";

interface Recent {
  id: string;
  title: string;
  ts: number;
}

export function StartActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("webtree:recent");
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const createDoc = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/docs", { method: "POST" });
      const { id } = await res.json();
      router.push(`/d/${id}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <button
        onClick={createDoc}
        disabled={loading}
        className="group flex w-full items-center justify-between gap-3 border border-accent/50 bg-accent/10 px-5 py-4 text-left transition-colors hover:bg-accent/20 disabled:opacity-60"
      >
        <span className="flex items-center gap-3">
          {loading ? (
            <Loader2 size={18} className="animate-spin text-accent-bright" />
          ) : (
            <FileText size={18} className="text-accent-bright" />
          )}
          <span>
            <span className="block text-sm font-semibold text-ink">
              New document
            </span>
            <span className="block font-mono text-[11px] text-ink-muted">
              spawn a fresh hierarchical sheet
            </span>
          </span>
        </span>
        <ArrowRight
          size={18}
          className="text-accent-bright transition-transform group-hover:translate-x-1"
        />
      </button>

      {recent.length > 0 && (
        <div className="mt-8">
          <div className="label-mono mb-2 flex items-center gap-1.5">
            <Clock size={11} /> Recent
          </div>
          <ul className="divide-y divide-line border border-line">
            {recent.map((d) => (
              <li key={d.id}>
                <a
                  href={`/d/${d.id}`}
                  className="flex items-center justify-between px-4 py-2.5 text-sm text-ink-dim transition-colors hover:bg-accent/5 hover:text-accent-bright"
                >
                  <span className="truncate">{d.title || "Untitled"}</span>
                  <span className="ml-3 shrink-0 font-mono text-[10px] text-ink-muted">
                    {new Date(d.ts).toLocaleDateString()}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
