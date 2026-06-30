"use client";

import { useEffect, useState } from "react";
import { useDocStore } from "@/store/useDoc";
import { useAutosave } from "@/store/useAutosave";
import { gridForZoom, emptyDoc } from "@/lib/tree/ops";
import type { TreeDoc } from "@/lib/tree/types";
import { CommandBar } from "./CommandBar";
import { Inspector } from "./Inspector";
import { MarkdownPanel } from "./MarkdownPanel";
import { GridView } from "./Sheet";

const RECENT_KEY = "webtree:recent";

function rememberRecent(id: string, title: string) {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list: { id: string; title: string; ts: number }[] = raw ? JSON.parse(raw) : [];
    const next = [
      { id, title, ts: Date.now() },
      ...list.filter((d) => d.id !== id),
    ].slice(0, 12);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable */
  }
}

export function Editor({
  id,
  title,
  data,
}: {
  id: string;
  title: string;
  data: unknown;
}) {
  const init = useDocStore((s) => s.init);
  const activeGrid = useDocStore((s) => gridForZoom(s.doc.root, s.zoom));
  const zoom = useDocStore((s) => s.zoom);
  const docTitle = useDocStore((s) => s.title);
  const [mdOpen, setMdOpen] = useState(false);

  useAutosave();

  useEffect(() => {
    const doc: TreeDoc =
      data && typeof data === "object" && "root" in (data as TreeDoc)
        ? (data as TreeDoc)
        : emptyDoc();
    init(id, doc, title);
    useDocStore.temporal.getState().clear();
    rememberRecent(id, title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keep the recent-docs label in sync with title edits (debounced-ish).
  useEffect(() => {
    const t = setTimeout(() => rememberRecent(id, docTitle), 600);
    return () => clearTimeout(t);
  }, [id, docTitle]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useDocStore.getState();
      const ae = document.activeElement as HTMLElement | null;
      const inField =
        !!ae &&
        (ae.tagName === "INPUT" ||
          ae.tagName === "TEXTAREA" ||
          ae.isContentEditable);
      if (s.editing || inField) return;

      const sel = s.selection;
      const mod = e.ctrlKey || e.metaKey;

      if (mod) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) useDocStore.temporal.getState().redo();
            else useDocStore.temporal.getState().undo();
            return;
          case "y":
            e.preventDefault();
            useDocStore.temporal.getState().redo();
            return;
          case "]":
            e.preventDefault();
            s.zoomInto();
            return;
          case "[":
            e.preventDefault();
            s.zoomOut();
            return;
          case "enter":
            e.preventDefault();
            s.addSubgrid(sel);
            return;
          case "b":
            e.preventDefault();
            s.toggleFlag(sel, "bold");
            return;
          case "i":
            e.preventDefault();
            s.toggleFlag(sel, "italic");
            return;
        }
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          s.move("up");
          return;
        case "ArrowDown":
          e.preventDefault();
          s.move("down");
          return;
        case "ArrowLeft":
          e.preventDefault();
          s.move("left");
          return;
        case "ArrowRight":
          e.preventDefault();
          s.move("right");
          return;
        case "Tab":
          e.preventDefault();
          s.move(e.shiftKey ? "left" : "right");
          return;
        case "Enter":
        case "F2":
          e.preventDefault();
          s.setEditing(true);
          return;
        case "Insert":
          e.preventDefault();
          s.addSubgrid(sel);
          return;
        case "Escape":
          e.preventDefault();
          if (s.zoom.length) s.zoomOut();
          return;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          s.setText(sel, "");
          return;
      }

      // Begin editing on a printable keystroke (replaces cell content).
      if (e.key.length === 1 && !e.altKey) {
        e.preventDefault();
        s.setText(sel, e.key);
        s.setEditing(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-base">
      <CommandBar onToggleMarkdown={() => setMdOpen((v) => !v)} markdownOpen={mdOpen} />

      <div className="relative flex min-h-0 flex-1">
        <main
          className="min-w-0 flex-1 overflow-auto p-6"
          onMouseDown={() => useDocStore.getState().setEditing(false)}
        >
          {activeGrid ? (
            <div className="inline-block align-top">
              <GridView grid={activeGrid} path={zoom} />
            </div>
          ) : (
            <div className="text-sm text-ink-muted">
              This cell has no sub-grid yet. Press{" "}
              <kbd className="rounded-[2px] border border-line px-1">Ctrl</kbd>+
              <kbd className="rounded-[2px] border border-line px-1">[</kbd> to go back.
            </div>
          )}
        </main>

        {mdOpen && <MarkdownPanel onClose={() => setMdOpen(false)} />}
        <Inspector />
      </div>

      <FooterBar id={id} />
    </div>
  );
}

function FooterBar({ id }: { id: string }) {
  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-line bg-panel-2 px-3 font-mono text-[10px] text-ink-muted">
      <span className="text-accent/70">DOC://{id}</span>
      <span className="hidden sm:inline">↑↓←→ move</span>
      <span className="hidden sm:inline">Enter edit</span>
      <span className="hidden sm:inline">Insert nest</span>
      <span className="hidden md:inline">Ctrl+] zoom</span>
      <span className="hidden md:inline">Ctrl+Z undo</span>
      <span className="ml-auto tracking-[0.18em]">WEBTREE // GOTHAM</span>
    </footer>
  );
}
