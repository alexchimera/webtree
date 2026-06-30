"use client";

import { useEffect, useRef } from "react";
import { useDocStore } from "./useDoc";

/**
 * Subscribes to document/title changes and persists them to the server with a
 * trailing debounce. Also best-effort flushes on tab close.
 */
export function useAutosave(delay = 800) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    const save = async () => {
      const { docId, doc, title } = useDocStore.getState();
      if (!docId) return;
      try {
        const res = await fetch(`/api/docs/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, data: doc }),
        });
        if (mounted) useDocStore.getState().setSaveState(res.ok ? "saved" : "error");
      } catch {
        if (mounted) useDocStore.getState().setSaveState("error");
      }
    };

    const unsub = useDocStore.subscribe((state, prev) => {
      // Ignore the initial load transition (docId goes null -> id).
      if (prev.docId !== state.docId) return;
      if (!state.docId) return;
      if (state.doc === prev.doc && state.title === prev.title) return;

      useDocStore.getState().setSaveState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(save, delay);
    });

    const onUnload = () => {
      const { docId, doc, title, saveState } = useDocStore.getState();
      if (!docId || saveState === "saved") return;
      try {
        fetch(`/api/docs/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, data: doc }),
          keepalive: true,
        });
      } catch {
        /* best effort */
      }
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      mounted = false;
      unsub();
      window.removeEventListener("beforeunload", onUnload);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [delay]);
}
