import { describe, it, expect } from "vitest";
import {
  makeGrid,
  cellAt,
  gridContaining,
  gridForZoom,
  insertRow,
  insertCol,
  deleteRow,
  deleteCol,
  addSubgrid,
  removeSubgrid,
  toggleFold,
  setStyle,
  toggleFlag,
  gridDims,
  isPrefix,
  pathsEqual,
} from "@/lib/tree/ops";

describe("grid structural ops", () => {
  it("inserts and deletes rows keeping a rectangle", () => {
    const g = makeGrid(2, 3);
    insertRow(g, 1);
    expect(gridDims(g)).toEqual({ rows: 3, cols: 3 });
    expect(g.cells.every((r) => r.length === 3)).toBe(true);
    deleteRow(g, 0);
    expect(gridDims(g)).toEqual({ rows: 2, cols: 3 });
  });

  it("inserts and deletes columns keeping a rectangle", () => {
    const g = makeGrid(2, 2);
    insertCol(g, 2);
    expect(gridDims(g)).toEqual({ rows: 2, cols: 3 });
    deleteCol(g, 0);
    expect(gridDims(g)).toEqual({ rows: 2, cols: 2 });
  });

  it("never deletes the last row or column", () => {
    const g = makeGrid(1, 1);
    g.cells[0][0].text = "keep me";
    deleteRow(g, 0);
    expect(gridDims(g)).toEqual({ rows: 1, cols: 1 });
    expect(g.cells[0][0].text).toBe(""); // cleared, not removed
    deleteCol(g, 0);
    expect(gridDims(g)).toEqual({ rows: 1, cols: 1 });
  });
});

describe("path navigation + nesting", () => {
  it("resolves nested cells by path and finds containing grid", () => {
    const g = makeGrid(2, 2);
    addSubgrid(g, [{ row: 0, col: 0 }], 2, 1);
    const path = [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
    ];
    const cell = cellAt(g, path);
    expect(cell).not.toBeNull();
    cell!.text = "deep";
    expect(cellAt(g, path)!.text).toBe("deep");
    const container = gridContaining(g, path);
    expect(container).toBe(g.cells[0][0].grid);
  });

  it("gridForZoom returns the cell's sub-grid, or root for empty path", () => {
    const g = makeGrid(1, 1);
    addSubgrid(g, [{ row: 0, col: 0 }]);
    expect(gridForZoom(g, [])).toBe(g);
    expect(gridForZoom(g, [{ row: 0, col: 0 }])).toBe(g.cells[0][0].grid);
  });

  it("addSubgrid/removeSubgrid/toggleFold behave", () => {
    const g = makeGrid(1, 1);
    const p = [{ row: 0, col: 0 }];
    addSubgrid(g, p);
    expect(g.cells[0][0].grid).toBeDefined();
    toggleFold(g, p);
    expect(g.cells[0][0].folded).toBe(true);
    removeSubgrid(g, p);
    expect(g.cells[0][0].grid).toBeUndefined();
    expect(g.cells[0][0].folded).toBeUndefined();
  });
});

describe("styling", () => {
  it("sets and prunes style flags", () => {
    const g = makeGrid(1, 1);
    const p = [{ row: 0, col: 0 }];
    toggleFlag(g, p, "bold");
    expect(g.cells[0][0].style?.bold).toBe(true);
    toggleFlag(g, p, "bold");
    expect(g.cells[0][0].style).toBeUndefined(); // pruned to nothing
    setStyle(g, p, { bg: "#111" });
    expect(g.cells[0][0].style).toEqual({ bg: "#111" });
  });
});

describe("path helpers", () => {
  it("isPrefix and pathsEqual", () => {
    const a = [{ row: 0, col: 0 }];
    const b = [
      { row: 0, col: 0 },
      { row: 1, col: 2 },
    ];
    expect(isPrefix(a, b)).toBe(true);
    expect(isPrefix(b, a)).toBe(false);
    expect(pathsEqual(a, a)).toBe(true);
    expect(pathsEqual(a, b)).toBe(false);
  });
});
