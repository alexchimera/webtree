import type { Cell, Grid, TreeDoc } from "./tree/types";
import { serializeDoc } from "./markdown/serialize";

export { serializeDoc as toMarkdown };

export function toJSON(doc: TreeDoc, title: string): string {
  return JSON.stringify({ version: 1, title, ...doc }, null, 2);
}

function csvField(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Export the top-level grid as CSV (cell text only). */
export function toCSV(root: Grid): string {
  return root.cells
    .map((row) => row.map((c) => csvField(c.text ?? "")).join(","))
    .join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cellHtml(cell: Cell): string {
  const style: string[] = [];
  if (cell.style?.bg) style.push(`background:${cell.style.bg}`);
  if (cell.style?.fg) style.push(`color:${cell.style.fg}`);
  if (cell.style?.bold) style.push("font-weight:700");
  if (cell.style?.italic) style.push("font-style:italic");
  if (cell.style?.strike) style.push("text-decoration:line-through");
  const styleAttr = style.length ? ` style="${style.join(";")}"` : "";
  const img = cell.image
    ? `<img src="${cell.image}" style="max-width:200px;display:block" />`
    : "";
  const text = escapeHtml(cell.text ?? "").replace(/\n/g, "<br>");
  const sub = cell.grid ? gridHtml(cell.grid) : "";
  return `<td${styleAttr}>${text}${img}${sub}</td>`;
}

function gridHtml(grid: Grid): string {
  const rows = grid.cells
    .map((row) => `<tr>${row.map(cellHtml).join("")}</tr>`)
    .join("");
  return `<table>${rows}</table>`;
}

export function toHTML(doc: TreeDoc, title: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body{background:#0a0e14;color:#c7d4e3;font-family:system-ui,sans-serif;padding:24px}
  h1{color:#5ec8ff;font-size:18px;letter-spacing:.04em}
  table{border-collapse:collapse}
  td{border:1px solid rgba(130,170,210,.28);padding:4px 8px;vertical-align:top}
</style></head>
<body><h1>${escapeHtml(title)}</h1>${gridHtml(doc.root)}</body></html>`;
}
