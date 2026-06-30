"use client";

import { create } from "zustand";
import { temporal } from "zundo";
import { immer } from "zustand/middleware/immer";
import { useStore } from "zustand";
import type { CellPath, CellStyle, TreeDoc } from "@/lib/tree/types";
import * as ops from "@/lib/tree/ops";
import { parseMarkdown } from "@/lib/markdown/parse";

export type SaveState = "idle" | "saving" | "saved" | "error";

interface DocState {
  docId: string | null;
  doc: TreeDoc;
  title: string;
  selection: CellPath;
  zoom: CellPath;
  editing: boolean;
  saveState: SaveState;
  lastSavedAt: number | null;

  init: (docId: string, doc: TreeDoc, title: string) => void;
  setSaveState: (s: SaveState) => void;

  select: (path: CellPath) => void;
  setEditing: (editing: boolean) => void;
  move: (dir: "up" | "down" | "left" | "right") => void;
  zoomInto: (path?: CellPath) => void;
  zoomOut: () => void;
  setZoom: (path: CellPath) => void;

  setTitle: (t: string) => void;
  setText: (path: CellPath, text: string) => void;
  toggleFlag: (path: CellPath, flag: "bold" | "italic" | "strike") => void;
  setStyle: (path: CellPath, patch: Partial<CellStyle>) => void;
  setImage: (path: CellPath, image: string | undefined) => void;
  addSubgrid: (path: CellPath, rows?: number, cols?: number) => void;
  removeSubgrid: (path: CellPath) => void;
  toggleFold: (path: CellPath) => void;
  insertRow: (path: CellPath, where: "above" | "below") => void;
  insertCol: (path: CellPath, where: "left" | "right") => void;
  deleteRow: (path: CellPath) => void;
  deleteCol: (path: CellPath) => void;
  replaceDoc: (doc: TreeDoc) => void;
  applyMarkdownToView: (md: string) => void;
}

export const useDocStore = create<DocState>()(
  temporal(
    immer((set, get) => ({
      docId: null,
      doc: ops.emptyDoc(),
      title: "Untitled",
      selection: [{ row: 0, col: 0 }],
      zoom: [],
      editing: false,
      saveState: "idle",
      lastSavedAt: null,

      init: (docId, doc, title) =>
        set((s) => {
          s.docId = docId;
          s.doc = doc;
          s.title = title;
          s.selection = [{ row: 0, col: 0 }];
          s.zoom = [];
          s.editing = false;
          s.saveState = "saved";
          s.lastSavedAt = Date.now();
        }),

      setSaveState: (st) =>
        set((s) => {
          s.saveState = st;
          if (st === "saved") s.lastSavedAt = Date.now();
        }),

      select: (path) =>
        set((s) => {
          s.selection = path;
          s.editing = false;
        }),

      setEditing: (editing) =>
        set((s) => {
          s.editing = editing;
        }),

      move: (dir) =>
        set((s) => {
          const sel = s.selection;
          if (sel.length === 0) {
            s.selection = [...s.zoom, { row: 0, col: 0 }];
            return;
          }
          const containing = ops.gridContaining(s.doc.root, sel);
          if (!containing) return;
          const { rows, cols } = ops.gridDims(containing);
          const last = sel[sel.length - 1];
          let { row, col } = last;
          if (dir === "up") {
            if (row === 0) {
              // ascend to the parent cell when deeper than the zoom root
              if (sel.length > s.zoom.length + 1) {
                s.selection = sel.slice(0, -1);
                s.editing = false;
              }
              return;
            }
            row -= 1;
          } else if (dir === "down") {
            row = Math.min(rows - 1, row + 1);
          } else if (dir === "left") {
            col = Math.max(0, col - 1);
          } else {
            col = Math.min(cols - 1, col + 1);
          }
          s.selection = [...sel.slice(0, -1), { row, col }];
          s.editing = false;
        }),

      zoomInto: (path) =>
        set((s) => {
          const target = path ?? s.selection;
          if (target.length === 0) return;
          const cell = ops.cellAt(s.doc.root, target);
          if (!cell) return;
          if (!cell.grid) ops.addSubgrid(s.doc.root, target, 1, 1);
          s.zoom = target;
          s.selection = [...target, { row: 0, col: 0 }];
          s.editing = false;
        }),

      zoomOut: () =>
        set((s) => {
          if (s.zoom.length === 0) return;
          s.zoom = s.zoom.slice(0, -1);
          s.selection = s.zoom.length
            ? [...s.zoom, { row: 0, col: 0 }]
            : [{ row: 0, col: 0 }];
          s.editing = false;
        }),

      setZoom: (path) =>
        set((s) => {
          s.zoom = path;
          s.selection = path.length
            ? [...path, { row: 0, col: 0 }]
            : [{ row: 0, col: 0 }];
          s.editing = false;
        }),

      setTitle: (t) =>
        set((s) => {
          s.title = t;
        }),

      setText: (path, text) =>
        set((s) => {
          ops.setText(s.doc.root, path, text);
        }),

      toggleFlag: (path, flag) =>
        set((s) => {
          ops.toggleFlag(s.doc.root, path, flag);
        }),

      setStyle: (path, patch) =>
        set((s) => {
          ops.setStyle(s.doc.root, path, patch);
        }),

      setImage: (path, image) =>
        set((s) => {
          ops.setImage(s.doc.root, path, image);
        }),

      addSubgrid: (path, rows = 1, cols = 1) =>
        set((s) => {
          ops.addSubgrid(s.doc.root, path, rows, cols);
        }),

      removeSubgrid: (path) =>
        set((s) => {
          ops.removeSubgrid(s.doc.root, path);
        }),

      toggleFold: (path) =>
        set((s) => {
          ops.toggleFold(s.doc.root, path);
        }),

      insertRow: (path, where) =>
        set((s) => {
          const grid = ops.gridContaining(s.doc.root, path);
          if (!grid) return;
          const at = path[path.length - 1].row + (where === "below" ? 1 : 0);
          ops.insertRow(grid, at);
        }),

      insertCol: (path, where) =>
        set((s) => {
          const grid = ops.gridContaining(s.doc.root, path);
          if (!grid) return;
          const at = path[path.length - 1].col + (where === "right" ? 1 : 0);
          ops.insertCol(grid, at);
        }),

      deleteRow: (path) =>
        set((s) => {
          const grid = ops.gridContaining(s.doc.root, path);
          if (!grid) return;
          ops.deleteRow(grid, path[path.length - 1].row);
          clampSelection(s);
        }),

      deleteCol: (path) =>
        set((s) => {
          const grid = ops.gridContaining(s.doc.root, path);
          if (!grid) return;
          ops.deleteCol(grid, path[path.length - 1].col);
          clampSelection(s);
        }),

      replaceDoc: (doc) =>
        set((s) => {
          s.doc = doc;
          s.zoom = [];
          s.selection = [{ row: 0, col: 0 }];
          s.editing = false;
        }),

      applyMarkdownToView: (md) =>
        set((s) => {
          const grid = parseMarkdown(md);
          if (s.zoom.length === 0) {
            s.doc.root = grid;
            s.selection = [{ row: 0, col: 0 }];
          } else {
            const cell = ops.cellAt(s.doc.root, s.zoom);
            if (cell) {
              cell.grid = grid;
              s.selection = [...s.zoom, { row: 0, col: 0 }];
            }
          }
          s.editing = false;
        }),
    })),
    {
      // Only structural/content state participates in undo/redo.
      partialize: (s) => ({ doc: s.doc, title: s.title }),
      limit: 200,
    },
  ),
);

function clampSelection(s: DocState) {
  const grid = ops.gridContaining(s.doc.root, s.selection);
  if (!grid) {
    s.selection = s.zoom.length ? [...s.zoom, { row: 0, col: 0 }] : [{ row: 0, col: 0 }];
    return;
  }
  const { rows, cols } = ops.gridDims(grid);
  const last = s.selection[s.selection.length - 1];
  const row = Math.min(Math.max(0, last.row), rows - 1);
  const col = Math.min(Math.max(0, last.col), cols - 1);
  s.selection = [...s.selection.slice(0, -1), { row, col }];
}

// Convenience hook for undo/redo controls backed by zundo's temporal store.
export function useTemporal<T>(selector: (state: TemporalState) => T): T {
  return useStore(useDocStore.temporal, selector);
}

export interface TemporalState {
  pastStates: unknown[];
  futureStates: unknown[];
  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;
}
