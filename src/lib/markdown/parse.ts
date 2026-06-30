import { makeCell, makeGrid, newId } from "../tree/ops";
import type { Cell, Grid } from "../tree/types";

// Markdown -> Tree. Inverse of serialize.ts.
//
//  - A GFM table becomes a multi-column grid (one row per table row).
//  - A nested bullet/heading outline becomes a single-column grid where each
//    item is a row and indentation/heading-depth defines sub-grids.

interface Node {
  text: string;
  image?: string;
  children: Node[];
}

const BULLET_RE = /^(\s*)(?:[-*+]|\d+\.)\s+(.*)$/;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const STANDALONE_IMG_RE = /^!\[[^\]]*\]\(([^)]+)\)\s*$/;

function looksLikeTable(lines: string[]): boolean {
  const nonEmpty = lines.filter((l) => l.trim().length);
  if (nonEmpty.length < 2) return false;
  const first = nonEmpty[0].trim();
  const second = nonEmpty[1].trim();
  return (
    first.startsWith("|") &&
    /^\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?$/.test(second)
  );
}

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim().replace(/<br\s*\/?>/gi, "\n"));
}

function parseTable(lines: string[]): Grid {
  const rows = lines.filter((l) => l.trim().length);
  const header = splitRow(rows[0]);
  const cols = header.length;
  const dataRows = rows.slice(2); // skip header + separator
  const cells: Cell[][] = [header, ...dataRows.map(splitRow)].map((r) => {
    const padded = [...r];
    while (padded.length < cols) padded.push("");
    return padded.slice(0, cols).map((text) => toCell(text));
  });
  return { id: newId(), cells: cells.length ? cells : [[makeCell()]] };
}

function toCell(text: string): Cell {
  const cell = makeCell();
  const m = text.match(STANDALONE_IMG_RE);
  if (m) {
    cell.image = m[1];
    cell.text = "";
  } else {
    cell.text = text;
  }
  return cell;
}

function nodeToCell(node: Node): Cell {
  const cell = makeCell(node.text);
  if (node.image) cell.image = node.image;
  if (node.children.length) cell.grid = nodesToGrid(node.children);
  return cell;
}

function nodesToGrid(nodes: Node[]): Grid {
  return { id: newId(), cells: nodes.map((n) => [nodeToCell(n)]) };
}

function parseOutline(lines: string[]): Grid {
  const roots: Node[] = [];
  // stack[level] = the most recent node opened at that level
  const stack: Node[] = [];
  let headingBase = 0;
  // Holder object so the closure assignment below is visible to the type
  // checker (TS ignores closure writes when narrowing a bare `let`).
  const ref: { last: Node | null } = { last: null };

  const attach = (node: Node, level: number) => {
    stack.length = level; // drop deeper entries
    if (level === 0) roots.push(node);
    else {
      const parent = stack[level - 1];
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
    stack[level] = node;
    ref.last = node;
  };

  for (const raw of lines) {
    if (!raw.trim()) continue;

    const heading = raw.match(HEADING_RE);
    if (heading) {
      const level = heading[1].length - 1;
      headingBase = level + 1;
      attach({ text: heading[2].trim(), children: [] }, level);
      continue;
    }

    const bullet = raw.match(BULLET_RE);
    if (bullet) {
      const indentUnits = Math.round(bullet[1].replace(/\t/g, "  ").length / 2);
      const level = headingBase + indentUnits;
      const content = bullet[2];
      const imgMatch = content.match(STANDALONE_IMG_RE);
      const node: Node = imgMatch
        ? { text: "", image: imgMatch[1], children: [] }
        : { text: content, children: [] };
      attach(node, level);
      continue;
    }

    // continuation line -> append to the last item's text
    if (ref.last) {
      ref.last.text = ref.last.text ? `${ref.last.text}\n${raw.trim()}` : raw.trim();
    } else {
      attach({ text: raw.trim(), children: [] }, 0);
    }
  }

  if (!roots.length) return makeGrid(1, 1);
  return { id: newId(), cells: roots.map((n) => [nodeToCell(n)]) };
}

/** Parse Markdown text into a grid (the inverse of serializeGrid). */
export function parseMarkdown(md: string): Grid {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  if (looksLikeTable(lines)) return parseTable(lines);
  return parseOutline(lines);
}
