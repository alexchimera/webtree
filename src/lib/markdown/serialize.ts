import type { Cell, Grid } from "../tree/types";

// Canonical Tree -> Markdown mapping.
//
//  - A *leaf table* (a grid with >1 column whose cells have no sub-grids) is
//    rendered as a GFM table. Round-trips exactly.
//  - Every other grid is rendered as a nested bullet list: one bullet per cell
//    in row-major order; a cell's sub-grid is nested (indented) beneath it.
//
// Single-column outlines and leaf tables round-trip losslessly. A grid that is
// both multi-column *and* nested normalizes to an outline on re-import.

const INDENT = "  "; // two spaces per nesting level

function cellInline(cell: Cell): string {
  let t = (cell.text ?? "").trim();
  if (cell.image) {
    const img = `![image](${cell.image})`;
    t = t ? `${t} ${img}` : img;
  }
  return t;
}

export function isLeafTable(grid: Grid): boolean {
  const cols = grid.cells[0]?.length ?? 0;
  if (cols < 2) return false;
  return grid.cells.every((row) => row.every((c) => !c.grid));
}

function serializeTable(grid: Grid): string {
  const rows = grid.cells.map((row) =>
    row.map((c) => cellInline(c).replace(/\n/g, "<br>") || " "),
  );
  const cols = rows[0]?.length ?? 0;
  const fmt = (r: string[]) => `| ${r.join(" | ")} |`;
  const header = rows[0] ?? Array(cols).fill(" ");
  const sep = Array(cols).fill("---");
  const body = rows.slice(1);
  return [fmt(header), fmt(sep), ...body.map(fmt)].join("\n");
}

function serializeOutline(grid: Grid, level: number): string[] {
  const out: string[] = [];
  const pad = INDENT.repeat(level);
  for (const row of grid.cells) {
    for (const cell of row) {
      const text = cellInline(cell);
      const lines = text.length ? text.split("\n") : [""];
      out.push(`${pad}- ${lines[0]}`);
      for (const cont of lines.slice(1)) out.push(`${pad}  ${cont}`);
      if (cell.grid) out.push(...serializeOutline(cell.grid, level + 1));
    }
  }
  return out;
}

/** Serialize a grid to Markdown. The top-level grid may become a table. */
export function serializeGrid(grid: Grid): string {
  if (isLeafTable(grid)) return serializeTable(grid);
  return serializeOutline(grid, 0).join("\n");
}

export function serializeDoc(root: Grid): string {
  return serializeGrid(root).replace(/\s+$/, "") + "\n";
}
