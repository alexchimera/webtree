"use client";

import { useEffect, useState } from "react";
import { X, Check, RotateCcw } from "lucide-react";
import { useDocStore } from "@/store/useDoc";
import { serializeGrid } from "@/lib/markdown/serialize";
import { gridForZoom } from "@/lib/tree/ops";

export function MarkdownPanel({ onClose }: { onClose: () => void }) {
  const doc = useDocStore((s) => s.doc);
  const zoom = useDocStore((s) => s.zoom);
  const applyMarkdownToView = useDocStore((s) => s.applyMarkdownToView);

  const grid = gridForZoom(doc.root, zoom);
  const source = grid ? serializeGrid(grid) : "";
  const [text, setText] = useState(source);
  const [dirty, setDirty] = useState(false);

  const zoomKey = zoom.map((p) => `${p.row}.${p.col}`).join("/");
  // Reload the source whenever the zoom target changes.
  useEffect(() => {
    const g = gridForZoom(useDocStore.getState().doc.root, useDocStore.getState().zoom);
    setText(g ? serializeGrid(g) : "");
    setDirty(false);
  }, [zoomKey]);

  return (
    <div className="flex w-[420px] shrink-0 flex-col border-l border-line bg-panel">
      <div className="flex h-10 items-center justify-between border-b border-line px-3">
        <span className="label-mono">Markdown · current view</span>
        <button
          className="grid h-6 w-6 place-items-center text-ink-muted hover:text-danger"
          onClick={onClose}
          title="Close"
        >
          <X size={15} />
        </button>
      </div>

      <textarea
        className="min-h-0 flex-1 resize-none bg-void p-3 font-mono text-[12.5px] leading-relaxed text-ink outline-none"
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
        }}
        placeholder="- nested bullets become a sub-grid\n- leaf tables become GFM tables"
      />

      <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
        <span className="font-mono text-[10px] text-ink-muted">
          {dirty ? "unsaved edits" : "in sync"}
        </span>
        <div className="flex gap-2">
          <button
            className="flex h-7 items-center gap-1.5 rounded-[2px] border border-line px-2.5 text-xs text-ink-dim hover:border-accent hover:text-accent-bright"
            onClick={() => {
              setText(source);
              setDirty(false);
            }}
          >
            <RotateCcw size={13} /> Revert
          </button>
          <button
            className="flex h-7 items-center gap-1.5 rounded-[2px] border border-accent/60 bg-accent/15 px-2.5 text-xs text-accent-bright hover:bg-accent/25"
            onClick={() => {
              applyMarkdownToView(text);
              setDirty(false);
            }}
          >
            <Check size={13} /> Apply
          </button>
        </div>
      </div>
    </div>
  );
}
