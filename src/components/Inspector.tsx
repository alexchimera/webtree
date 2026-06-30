"use client";

import { useRef } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Grid2x2Plus,
  Grid2x2X,
  Maximize2,
  ChevronsDownUp,
  Rows3,
  Columns3,
  Trash2,
  ImagePlus,
  ImageOff,
  Eraser,
} from "lucide-react";
import { useDocStore } from "@/store/useDoc";
import { cellAt } from "@/lib/tree/ops";
import { fileToDownscaledDataURL } from "@/lib/image";

const BG_SWATCHES = [
  "#143a5c",
  "#0e2a3a",
  "#1c2b1c",
  "#3a2a14",
  "#3a1c24",
  "#26203a",
  "#11161f",
];
const FG_SWATCHES = [
  "#c7d4e3",
  "#5ec8ff",
  "#2ee6e6",
  "#4ade80",
  "#ffb454",
  "#ff5d6c",
  "#a98bff",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line px-3 py-3">
      <div className="label-mono mb-2">{title}</div>
      {children}
    </div>
  );
}

function IconBtn({
  active,
  title,
  onClick,
  children,
  danger,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex h-8 items-center justify-center gap-1 rounded-[2px] border px-2 text-xs transition-colors ${
        active
          ? "border-accent bg-accent/15 text-accent-bright"
          : danger
            ? "border-line text-ink-dim hover:border-danger hover:text-danger"
            : "border-line text-ink-dim hover:border-accent hover:text-accent-bright"
      }`}
    >
      {children}
    </button>
  );
}

export function Inspector() {
  const selection = useDocStore((s) => s.selection);
  const cell = useDocStore((s) => cellAt(s.doc.root, s.selection));
  const fileRef = useRef<HTMLInputElement>(null);

  const act = useDocStore.getState;

  if (!cell) {
    return (
      <aside className="flex w-[260px] shrink-0 flex-col border-l border-line bg-panel">
        <div className="px-3 py-4 text-xs text-ink-muted">No cell selected.</div>
      </aside>
    );
  }

  const coord = selection
    .map((p) => `${p.row + 1},${p.col + 1}`)
    .join(" › ");

  return (
    <aside className="flex w-[260px] shrink-0 flex-col overflow-y-auto border-l border-line bg-panel">
      <div className="border-b border-line px-3 py-2">
        <div className="label-mono">Cell</div>
        <div className="font-mono text-xs text-accent-bright">{coord}</div>
      </div>

      <Section title="Text">
        <div className="grid grid-cols-3 gap-1.5">
          <IconBtn
            active={!!cell.style?.bold}
            title="Bold (Ctrl+B)"
            onClick={() => act().toggleFlag(selection, "bold")}
          >
            <Bold size={14} />
          </IconBtn>
          <IconBtn
            active={!!cell.style?.italic}
            title="Italic (Ctrl+I)"
            onClick={() => act().toggleFlag(selection, "italic")}
          >
            <Italic size={14} />
          </IconBtn>
          <IconBtn
            active={!!cell.style?.strike}
            title="Strikethrough"
            onClick={() => act().toggleFlag(selection, "strike")}
          >
            <Strikethrough size={14} />
          </IconBtn>
        </div>
      </Section>

      <Section title="Fill">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {BG_SWATCHES.map((c) => (
            <button
              key={c}
              title={c}
              onClick={() => act().setStyle(selection, { bg: c })}
              className="h-6 w-6 rounded-[2px] border border-line"
              style={{ background: c }}
            />
          ))}
          <button
            title="Clear fill"
            onClick={() => act().setStyle(selection, { bg: undefined })}
            className="flex h-6 w-6 items-center justify-center rounded-[2px] border border-line text-ink-muted hover:text-danger"
          >
            <Eraser size={12} />
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-ink-dim">
          <input
            type="color"
            value={cell.style?.bg ?? "#11161f"}
            onChange={(e) => act().setStyle(selection, { bg: e.target.value })}
            className="h-7 w-9 cursor-pointer rounded-[2px] border border-line bg-transparent"
          />
          custom fill
        </label>
      </Section>

      <Section title="Ink">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {FG_SWATCHES.map((c) => (
            <button
              key={c}
              title={c}
              onClick={() => act().setStyle(selection, { fg: c })}
              className="h-6 w-6 rounded-[2px] border border-line"
              style={{ background: c }}
            />
          ))}
          <button
            title="Clear ink"
            onClick={() => act().setStyle(selection, { fg: undefined })}
            className="flex h-6 w-6 items-center justify-center rounded-[2px] border border-line text-ink-muted hover:text-danger"
          >
            <Eraser size={12} />
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-ink-dim">
          <input
            type="color"
            value={cell.style?.fg ?? "#c7d4e3"}
            onChange={(e) => act().setStyle(selection, { fg: e.target.value })}
            className="h-7 w-9 cursor-pointer rounded-[2px] border border-line bg-transparent"
          />
          custom ink
        </label>
      </Section>

      <Section title="Structure">
        <div className="grid grid-cols-2 gap-1.5">
          {cell.grid ? (
            <IconBtn
              danger
              title="Remove sub-grid"
              onClick={() => act().removeSubgrid(selection)}
            >
              <Grid2x2X size={14} /> Grid
            </IconBtn>
          ) : (
            <IconBtn
              title="Add sub-grid (Insert)"
              onClick={() => act().addSubgrid(selection, 1, 1)}
            >
              <Grid2x2Plus size={14} /> Grid
            </IconBtn>
          )}
          <IconBtn
            title="Zoom into cell (Ctrl+])"
            onClick={() => act().zoomInto(selection)}
          >
            <Maximize2 size={14} /> Zoom
          </IconBtn>
          {cell.grid && (
            <IconBtn
              active={!!cell.folded}
              title="Fold / unfold"
              onClick={() => act().toggleFold(selection)}
            >
              <ChevronsDownUp size={14} /> Fold
            </IconBtn>
          )}
        </div>
      </Section>

      <Section title="Rows & Columns">
        <div className="mb-1.5 grid grid-cols-2 gap-1.5">
          <IconBtn title="Insert row above" onClick={() => act().insertRow(selection, "above")}>
            <Rows3 size={14} /> +Above
          </IconBtn>
          <IconBtn title="Insert row below" onClick={() => act().insertRow(selection, "below")}>
            <Rows3 size={14} /> +Below
          </IconBtn>
          <IconBtn title="Insert column left" onClick={() => act().insertCol(selection, "left")}>
            <Columns3 size={14} /> +Left
          </IconBtn>
          <IconBtn title="Insert column right" onClick={() => act().insertCol(selection, "right")}>
            <Columns3 size={14} /> +Right
          </IconBtn>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <IconBtn danger title="Delete row" onClick={() => act().deleteRow(selection)}>
            <Trash2 size={14} /> Row
          </IconBtn>
          <IconBtn danger title="Delete column" onClick={() => act().deleteCol(selection)}>
            <Trash2 size={14} /> Col
          </IconBtn>
        </div>
      </Section>

      <Section title="Image">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const url = await fileToDownscaledDataURL(file);
              act().setImage(selection, url);
            }
            e.target.value = "";
          }}
        />
        <div className="grid grid-cols-2 gap-1.5">
          <IconBtn title="Upload image" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={14} /> Upload
          </IconBtn>
          {cell.image && (
            <IconBtn danger title="Remove image" onClick={() => act().setImage(selection, undefined)}>
              <ImageOff size={14} /> Remove
            </IconBtn>
          )}
        </div>
      </Section>
    </aside>
  );
}
