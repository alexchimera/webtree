"use client";

import { useState } from "react";
import {
  Undo2,
  Redo2,
  Share2,
  Download,
  Upload,
  FileCode2,
  Plus,
  Check,
  Loader2,
  TriangleAlert,
  ChevronRight,
} from "lucide-react";
import { useDocStore, useTemporal } from "@/store/useDoc";
import { toJSON, toMarkdown, toCSV, toHTML } from "@/lib/export";
import { parseMarkdown } from "@/lib/markdown/parse";
import type { TreeDoc } from "@/lib/tree/types";

function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SaveStatus() {
  const state = useDocStore((s) => s.saveState);
  if (state === "saving")
    return (
      <span className="flex items-center gap-1.5 text-amber">
        <Loader2 size={13} className="animate-spin" /> saving
      </span>
    );
  if (state === "error")
    return (
      <span className="flex items-center gap-1.5 text-danger">
        <TriangleAlert size={13} /> error
      </span>
    );
  if (state === "saved")
    return (
      <span className="flex items-center gap-1.5 text-good">
        <Check size={13} /> saved
      </span>
    );
  return <span className="text-ink-muted">idle</span>;
}

function Breadcrumb() {
  const zoom = useDocStore((s) => s.zoom);
  const setZoom = useDocStore((s) => s.setZoom);
  return (
    <div className="flex items-center gap-1 font-mono text-[11px] text-ink-muted">
      <button
        className="hover:text-accent-bright"
        onClick={() => setZoom([])}
      >
        ROOT
      </button>
      {zoom.map((p, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight size={11} className="opacity-50" />
          <button
            className="hover:text-accent-bright"
            onClick={() => setZoom(zoom.slice(0, i + 1))}
          >
            {p.row + 1},{p.col + 1}
          </button>
        </span>
      ))}
    </div>
  );
}

export function CommandBar({
  onToggleMarkdown,
  markdownOpen,
}: {
  onToggleMarkdown: () => void;
  markdownOpen: boolean;
}) {
  const title = useDocStore((s) => s.title);
  const setTitle = useDocStore((s) => s.setTitle);
  const [menu, setMenu] = useState<null | "export">(null);
  const [copied, setCopied] = useState(false);

  const undo = useTemporal((s) => s.undo);
  const redo = useTemporal((s) => s.redo);
  const canUndo = useTemporal((s) => s.pastStates.length > 0);
  const canRedo = useTemporal((s) => s.futureStates.length > 0);

  const exportAs = (fmt: "json" | "md" | "csv" | "html") => {
    const { doc, title } = useDocStore.getState();
    const slug = (title || "webtree").replace(/[^\w.-]+/g, "_").toLowerCase();
    if (fmt === "json") download(`${slug}.json`, toJSON(doc, title), "application/json");
    if (fmt === "md") download(`${slug}.md`, toMarkdown(doc.root), "text/markdown");
    if (fmt === "csv") download(`${slug}.csv`, toCSV(doc.root), "text/csv");
    if (fmt === "html") download(`${slug}.html`, toHTML(doc, title), "text/html");
    setMenu(null);
  };

  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      try {
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text) as TreeDoc & { title?: string };
          if (parsed.root) {
            useDocStore.getState().replaceDoc({ root: parsed.root });
            if (parsed.title) useDocStore.getState().setTitle(parsed.title);
          }
        } else {
          useDocStore.getState().replaceDoc({ root: parseMarkdown(text) });
        }
      } catch {
        alert("Could not import that file.");
      }
    };
    reader.readAsText(file);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-panel-2 px-3">
      <div className="flex items-center gap-2">
        <div className="grid h-6 w-6 place-items-center border border-accent/60 bg-accent/10">
          <span className="font-mono text-[13px] font-bold text-accent-bright">W</span>
        </div>
        <span className="hidden font-mono text-xs font-semibold tracking-[0.18em] text-ink sm:inline">
          WEBTREE
        </span>
      </div>

      <div className="mx-1 h-5 w-px bg-line" />
      <Breadcrumb />

      <input
        className="mx-2 min-w-0 flex-1 border-b border-transparent bg-transparent px-1 py-1 text-sm font-medium text-ink outline-none focus:border-accent"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        aria-label="Document title"
      />

      <div className="flex items-center gap-1">
        <button
          className="grid h-8 w-8 place-items-center rounded-[2px] border border-line text-ink-dim enabled:hover:border-accent enabled:hover:text-accent-bright disabled:opacity-30"
          title="Undo (Ctrl+Z)"
          onClick={() => undo()}
          disabled={!canUndo}
        >
          <Undo2 size={15} />
        </button>
        <button
          className="grid h-8 w-8 place-items-center rounded-[2px] border border-line text-ink-dim enabled:hover:border-accent enabled:hover:text-accent-bright disabled:opacity-30"
          title="Redo (Ctrl+Shift+Z)"
          onClick={() => redo()}
          disabled={!canRedo}
        >
          <Redo2 size={15} />
        </button>

        <button
          className={`grid h-8 w-8 place-items-center rounded-[2px] border text-ink-dim hover:border-accent hover:text-accent-bright ${
            markdownOpen ? "border-accent bg-accent/15 text-accent-bright" : "border-line"
          }`}
          title="Edit view as Markdown"
          onClick={onToggleMarkdown}
        >
          <FileCode2 size={15} />
        </button>

        <label
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-[2px] border border-line text-ink-dim hover:border-accent hover:text-accent-bright"
          title="Import (.json / .md)"
        >
          <Upload size={15} />
          <input
            type="file"
            accept=".json,.md,.markdown,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f);
              e.target.value = "";
            }}
          />
        </label>

        <div className="relative">
          <button
            className="grid h-8 w-8 place-items-center rounded-[2px] border border-line text-ink-dim hover:border-accent hover:text-accent-bright"
            title="Export"
            onClick={() => setMenu(menu === "export" ? null : "export")}
          >
            <Download size={15} />
          </button>
          {menu === "export" && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} />
              <div className="absolute right-0 z-20 mt-1 w-40 border border-line bg-elevated py-1 shadow-xl">
                {(["json", "md", "csv", "html"] as const).map((f) => (
                  <button
                    key={f}
                    className="block w-full px-3 py-1.5 text-left text-xs text-ink-dim hover:bg-accent/10 hover:text-accent-bright"
                    onClick={() => exportAs(f)}
                  >
                    Export {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          className="flex h-8 items-center gap-1.5 rounded-[2px] border border-line px-2.5 text-xs text-ink-dim hover:border-accent hover:text-accent-bright"
          title="Copy shareable link"
          onClick={share}
        >
          {copied ? <Check size={14} className="text-good" /> : <Share2 size={14} />}
          <span className="hidden md:inline">{copied ? "Copied" : "Share"}</span>
        </button>

        <a
          href="/"
          className="flex h-8 items-center gap-1.5 rounded-[2px] border border-accent/50 bg-accent/10 px-2.5 text-xs text-accent-bright hover:bg-accent/20"
          title="New document"
        >
          <Plus size={14} />
          <span className="hidden md:inline">New</span>
        </a>

        <div className="ml-1 hidden w-[68px] justify-end font-mono text-[11px] lg:flex">
          <SaveStatus />
        </div>
      </div>
    </header>
  );
}
