import { StartActions } from "@/components/StartActions";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-12 items-center gap-2 border-b border-line bg-panel-2 px-4">
        <div className="grid h-6 w-6 place-items-center border border-accent/60 bg-accent/10">
          <span className="font-mono text-[13px] font-bold text-accent-bright">W</span>
        </div>
        <span className="font-mono text-xs font-semibold tracking-[0.18em] text-ink">
          WEBTREE
        </span>
        <span className="ml-auto font-mono text-[10px] tracking-[0.18em] text-ink-muted">
          HIERARCHICAL DATA CONSOLE
        </span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="mb-10 w-full max-w-2xl">
          <div className="label-mono mb-3 text-accent/70">
            // treesheets, reimagined for the web
          </div>
          <h1 className="text-4xl font-bold leading-tight text-ink">
            Shrink complexity.
            <br />
            <span className="text-accent-bright">Nest grids inside cells</span>, infinitely.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-dim">
            WebTree is a hierarchical spreadsheet: every cell can hold Markdown,
            an image, a style — or an entire grid of its own. Zoom into any cell,
            fold what you don&apos;t need, and edit whole branches as Markdown.
            Documents autosave and live at a shareable link.
          </p>
        </div>

        <StartActions />

        <div className="mt-14 grid w-full max-w-2xl grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
          {[
            ["NESTED", "Cells contain grids contain cells — recursively."],
            ["MARKDOWN", "Cells render Markdown. Edit branches as outlines."],
            ["GOTHAM", "Dark, dense, electric-cyan intelligence console."],
          ].map(([k, v]) => (
            <div key={k} className="bg-panel p-4">
              <div className="label-mono mb-1 text-accent/70">{k}</div>
              <div className="text-xs leading-relaxed text-ink-dim">{v}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="flex h-7 items-center gap-4 border-t border-line bg-panel-2 px-4 font-mono text-[10px] text-ink-muted">
        <span>WEBTREE // GOTHAM</span>
        <span className="ml-auto">deployable on Railway</span>
      </footer>
    </div>
  );
}
