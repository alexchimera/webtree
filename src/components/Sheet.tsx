"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useDocStore } from "@/store/useDoc";
import { pathsEqual } from "@/lib/tree/ops";
import type { Cell, CellPath, Grid } from "@/lib/tree/types";
import { MarkdownText } from "./MarkdownText";

function cellTextStyle(cell: Cell): CSSProperties {
  const s = cell.style;
  return {
    color: s?.fg,
    fontWeight: s?.bold ? 700 : undefined,
    fontStyle: s?.italic ? "italic" : undefined,
    textDecoration: s?.strike ? "line-through" : undefined,
  };
}

export function GridView({
  grid,
  path,
  depth = 0,
}: {
  grid: Grid;
  path: CellPath;
  depth?: number;
}) {
  return (
    <table
      className={depth === 0 ? "wt-grid wt-grid--root" : "wt-grid"}
      data-depth={depth}
    >
      <tbody>
        {grid.cells.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => (
              <CellView
                key={cell.id}
                cell={cell}
                path={[...path, { row: r, col: c }]}
                depth={depth}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CellView({
  cell,
  path,
  depth,
}: {
  cell: Cell;
  path: CellPath;
  depth: number;
}) {
  const selected = useDocStore((s) => pathsEqual(s.selection, path));
  const editing = useDocStore((s) => s.editing && pathsEqual(s.selection, path));
  const select = useDocStore((s) => s.select);
  const setEditing = useDocStore((s) => s.setEditing);
  const toggleFold = useDocStore((s) => s.toggleFold);

  const hasGrid = !!cell.grid;
  const folded = !!cell.folded;
  const isHeader = hasGrid && !!cell.text?.trim();

  return (
    <td
      className={`wt-cell${selected ? " is-selected" : ""}${hasGrid ? " has-sub" : ""}`}
      style={{ background: cell.style?.bg }}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (!editing) select(path);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        select(path);
        setEditing(true);
      }}
    >
      <div className="wt-cell-inner">
        {hasGrid && (
          <button
            className="wt-fold"
            title={folded ? "Unfold (show sub-grid)" : "Fold (hide sub-grid)"}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              select(path);
              toggleFold(path);
            }}
          >
            {folded ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          </button>
        )}

        {editing ? (
          <CellEditor path={path} value={cell.text} />
        ) : (
          <div
            className={`wt-cell-content${isHeader ? " wt-cell-content--head" : ""}`}
            style={cellTextStyle(cell)}
          >
            {cell.text?.trim() ? (
              <MarkdownText text={cell.text} />
            ) : !cell.image && !hasGrid ? (
              <span className="wt-empty">·</span>
            ) : null}
            {cell.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="wt-img" src={cell.image} alt="" />
            )}
          </div>
        )}

        {hasGrid && !folded && (
          <div className="wt-sub">
            <GridView grid={cell.grid!} path={path} depth={depth + 1} />
          </div>
        )}
        {hasGrid && folded && (
          <span className="wt-folded-badge">
            {cell.grid!.cells.length}×{cell.grid!.cells[0]?.length ?? 0}
          </span>
        )}
      </div>
    </td>
  );
}

function autosize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

/** Wrap the current textarea selection with a marker (e.g. ** or *). */
function wrapSelection(
  el: HTMLTextAreaElement,
  marker: string,
  apply: (text: string) => void,
) {
  const { selectionStart: a, selectionEnd: b, value } = el;
  const next = value.slice(0, a) + marker + value.slice(a, b) + marker + value.slice(b);
  apply(next);
  requestAnimationFrame(() => {
    el.selectionStart = a + marker.length;
    el.selectionEnd = b + marker.length;
  });
}

function CellEditor({ path, value }: { path: CellPath; value: string }) {
  const setText = useDocStore((s) => s.setText);
  const setEditing = useDocStore((s) => s.setEditing);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    autosize(el);
  }, []);

  return (
    <textarea
      ref={ref}
      className="wt-editor focus-glow"
      value={value}
      spellCheck={false}
      onChange={(e) => {
        setText(path, e.target.value);
        autosize(e.target);
      }}
      onBlur={() => setEditing(false)}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          setEditing(false);
          return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "i")) {
          e.preventDefault();
          wrapSelection(e.currentTarget, e.key === "b" ? "**" : "*", (t) =>
            setText(path, t),
          );
        }
      }}
    />
  );
}
