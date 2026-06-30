import { nanoid } from "nanoid";
import type { Cell, CellPath, CellStyle, Grid, TreeDoc } from "./types";

export const newId = () => nanoid(10);

export function makeCell(text = ""): Cell {
  return { id: newId(), text };
}

export function makeGrid(rows = 1, cols = 1): Grid {
  const cells: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) row.push(makeCell());
    cells.push(row);
  }
  return { id: newId(), cells };
}

export function gridDims(g: Grid): { rows: number; cols: number } {
  return { rows: g.cells.length, cols: g.cells[0]?.length ?? 0 };
}

/** Resolve the cell at an absolute path from the document root grid. */
export function cellAt(root: Grid, path: CellPath): Cell | null {
  if (path.length === 0) return null;
  let grid: Grid | undefined = root;
  let cell: Cell | undefined;
  for (const step of path) {
    if (!grid) return null;
    cell = grid.cells[step.row]?.[step.col];
    if (!cell) return null;
    grid = cell.grid;
  }
  return cell ?? null;
}

/** The grid that directly contains the cell at `path` (i.e. the last step indexes into it). */
export function gridContaining(root: Grid, path: CellPath): Grid | null {
  if (path.length === 0) return null;
  let grid: Grid | undefined = root;
  for (let i = 0; i < path.length - 1; i++) {
    const step = path[i];
    const cell: Cell | undefined = grid?.cells[step.row]?.[step.col];
    if (!cell?.grid) return null;
    grid = cell.grid;
  }
  return grid ?? null;
}

/** The grid to display when "zoomed into" the cell at `path`; root if path empty. */
export function gridForZoom(root: Grid, path: CellPath): Grid | null {
  if (path.length === 0) return root;
  const cell = cellAt(root, path);
  return cell?.grid ?? null;
}

export function pathsEqual(a: CellPath, b: CellPath): boolean {
  if (a.length !== b.length) return false;
  return a.every((s, i) => s.row === b[i].row && s.col === b[i].col);
}

export function isPrefix(prefix: CellPath, of: CellPath): boolean {
  if (prefix.length > of.length) return false;
  return prefix.every((s, i) => s.row === of[i].row && s.col === of[i].col);
}

// --- mutating operations (designed to run inside an immer producer) ---

export function setText(root: Grid, path: CellPath, text: string): void {
  const cell = cellAt(root, path);
  if (cell) cell.text = text;
}

export function setStyle(root: Grid, path: CellPath, patch: Partial<CellStyle>): void {
  const cell = cellAt(root, path);
  if (!cell) return;
  const next: CellStyle = { ...cell.style, ...patch };
  // prune falsy keys to keep the document tidy
  (Object.keys(next) as (keyof CellStyle)[]).forEach((k) => {
    if (next[k] === undefined || next[k] === false || next[k] === "") delete next[k];
  });
  cell.style = Object.keys(next).length ? next : undefined;
}

export function toggleFlag(
  root: Grid,
  path: CellPath,
  flag: "bold" | "italic" | "strike",
): void {
  const cell = cellAt(root, path);
  if (!cell) return;
  setStyle(root, path, { [flag]: !cell.style?.[flag] });
}

export function setImage(root: Grid, path: CellPath, image: string | undefined): void {
  const cell = cellAt(root, path);
  if (cell) cell.image = image;
}

/** Ensure the cell has a sub-grid; returns nothing (mutates). */
export function addSubgrid(root: Grid, path: CellPath, rows = 1, cols = 1): void {
  const cell = cellAt(root, path);
  if (cell && !cell.grid) {
    cell.grid = makeGrid(rows, cols);
    cell.folded = false;
  }
}

export function removeSubgrid(root: Grid, path: CellPath): void {
  const cell = cellAt(root, path);
  if (cell) {
    delete cell.grid;
    delete cell.folded;
  }
}

export function toggleFold(root: Grid, path: CellPath): void {
  const cell = cellAt(root, path);
  if (cell?.grid) cell.folded = !cell.folded;
}

export function insertRow(grid: Grid, at: number): void {
  const cols = grid.cells[0]?.length ?? 1;
  const row = Array.from({ length: cols }, () => makeCell());
  grid.cells.splice(Math.max(0, Math.min(at, grid.cells.length)), 0, row);
}

export function insertCol(grid: Grid, at: number): void {
  for (const row of grid.cells) {
    row.splice(Math.max(0, Math.min(at, row.length)), 0, makeCell());
  }
}

export function deleteRow(grid: Grid, at: number): void {
  if (grid.cells.length <= 1) {
    // keep at least one row; clear it instead
    const cols = grid.cells[0]?.length ?? 1;
    grid.cells[0] = Array.from({ length: cols }, () => makeCell());
    return;
  }
  grid.cells.splice(at, 1);
}

export function deleteCol(grid: Grid, at: number): void {
  const cols = grid.cells[0]?.length ?? 0;
  if (cols <= 1) {
    for (const row of grid.cells) row[0] = makeCell();
    return;
  }
  for (const row of grid.cells) row.splice(at, 1);
}

/** A small, illustrative starter document showing nesting, styling, markdown. */
export function sampleDoc(): TreeDoc {
  const c = (text: string, style?: CellStyle, grid?: Grid): Cell => ({
    id: newId(),
    text,
    ...(style ? { style } : {}),
    ...(grid ? { grid } : {}),
  });
  const g = (cells: Cell[][]): Grid => ({ id: newId(), cells });

  const accent: CellStyle = { fg: "#5ec8ff", bold: true };
  const head: CellStyle = { bg: "#143a5c", fg: "#cfe8ff", bold: true };

  const root = g([
    [
      c("# OPERATION WEBTREE", accent, g([
        [c("**Mission**", head), c("Reimplement TreeSheets for the web", head), c("**Status**", head)],
        [c("Nested grids in cells"), c("Every cell can hold a whole grid — recursively."), c("`ACTIVE`", { fg: "#4ade80" })],
        [c("Markdown-native"), c("Cells render *Markdown*. Edit raw on focus."), c("`ACTIVE`", { fg: "#4ade80" })],
        [c("Gotham console"), c("Dark, dense, electric-cyan accents."), c("`ACTIVE`", { fg: "#4ade80" })],
      ])),
    ],
    [
      c("## Try it", { fg: "#ffb454", bold: true }, g([
        [c("Double-click a cell to edit its Markdown.")],
        [c("Press **Insert** (or the +grid button) to nest a grid inside a cell.")],
        [c("Ctrl+] to zoom into a cell — it becomes the root view.")],
        [c("Fold ▾ a cell to collapse its sub-grid.", undefined, g([
          [c("Hidden detail one")],
          [c("Hidden detail two")],
        ]))],
      ])),
    ],
  ]);

  return { root };
}

export function emptyDoc(): TreeDoc {
  return { root: makeGrid(1, 1) };
}
