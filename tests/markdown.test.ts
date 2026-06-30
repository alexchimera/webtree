import { describe, it, expect } from "vitest";
import { serializeGrid, serializeDoc, isLeafTable } from "@/lib/markdown/serialize";
import { parseMarkdown } from "@/lib/markdown/parse";
import { makeGrid } from "@/lib/tree/ops";
import type { Grid } from "@/lib/tree/types";

/** Strip ids so two grids can be compared structurally. */
function shape(g: Grid): unknown {
  return g.cells.map((row) =>
    row.map((c) => ({
      text: c.text,
      ...(c.image ? { image: c.image } : {}),
      ...(c.grid ? { grid: shape(c.grid) } : {}),
    })),
  );
}

describe("markdown outline round-trip", () => {
  it("round-trips a nested single-column outline", () => {
    const g: Grid = {
      id: "x",
      cells: [
        [
          {
            id: "a",
            text: "Parent",
            grid: {
              id: "y",
              cells: [
                [{ id: "b", text: "Child one" }],
                [
                  {
                    id: "c",
                    text: "Child two",
                    grid: { id: "z", cells: [[{ id: "d", text: "Grandchild" }]] },
                  },
                ],
              ],
            },
          },
        ],
        [{ id: "e", text: "Sibling" }],
      ],
    };
    const md = serializeGrid(g);
    const back = parseMarkdown(md);
    expect(shape(back)).toEqual(shape(g));
  });

  it("preserves markdown inline formatting in cell text", () => {
    const g: Grid = {
      id: "x",
      cells: [[{ id: "a", text: "**bold** and *italic* and `code`" }]],
    };
    const back = parseMarkdown(serializeGrid(g));
    expect(back.cells[0][0].text).toBe("**bold** and *italic* and `code`");
  });
});

describe("markdown table round-trip", () => {
  it("round-trips a leaf table", () => {
    const g: Grid = {
      id: "x",
      cells: [
        [
          { id: "a", text: "Name" },
          { id: "b", text: "Status" },
        ],
        [
          { id: "c", text: "Alpha" },
          { id: "d", text: "Active" },
        ],
      ],
    };
    expect(isLeafTable(g)).toBe(true);
    const md = serializeGrid(g);
    expect(md).toContain("| Name | Status |");
    const back = parseMarkdown(md);
    expect(shape(back)).toEqual(shape(g));
  });
});

describe("markdown import conveniences", () => {
  it("imports headings as nesting levels", () => {
    const md = ["# Top", "- child a", "- child b"].join("\n");
    const g = parseMarkdown(md);
    expect(g.cells[0][0].text).toBe("Top");
    expect(g.cells[0][0].grid?.cells.length).toBe(2);
    expect(g.cells[0][0].grid?.cells[0][0].text).toBe("child a");
  });

  it("extracts a standalone image bullet into cell.image", () => {
    const md = "- ![image](data:image/png;base64,AAAA)";
    const g = parseMarkdown(md);
    expect(g.cells[0][0].image).toBe("data:image/png;base64,AAAA");
    expect(g.cells[0][0].text).toBe("");
  });

  it("serializeDoc ends with a single trailing newline", () => {
    const md = serializeDoc(makeGrid(1, 1));
    expect(md.endsWith("\n")).toBe(true);
    expect(md.endsWith("\n\n")).toBe(false);
  });
});
