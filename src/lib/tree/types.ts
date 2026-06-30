// Core hierarchical data model for WebTree (a TreeSheets-style document).
//
// A document is a `Grid`. Every `Cell` can hold Markdown text, an image, style,
// and/or its own nested sub-`Grid` — recursively, forever.

export interface CellStyle {
  /** background color (hex/rgb) */
  bg?: string;
  /** foreground / text color */
  fg?: string;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
}

export interface Cell {
  id: string;
  /** Markdown source. Rendered when idle, edited raw when focused. */
  text: string;
  /** Optional inline image, stored as a (downscaled) data URL. */
  image?: string;
  style?: CellStyle;
  /** When true and a sub-grid exists, the sub-grid is collapsed. */
  folded?: boolean;
  /** Optional nested grid. */
  grid?: Grid;
}

export interface Grid {
  id: string;
  /** Row-major: cells[row][col]. All rows have the same length. */
  cells: Cell[][];
}

export interface TreeDoc {
  root: Grid;
}

/** A path from the document root to a particular cell. */
export type CellPath = Array<{ row: number; col: number }>;

export const SCHEMA_VERSION = 1;
