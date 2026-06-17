"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Shared behaviour for a button-anchored popup menu that must float above the
 * page (rendered via a portal with fixed positioning) instead of being clipped
 * by an `overflow` ancestor. Returns the button rect so the caller can position
 * a fixed menu, plus refs for the trigger and menu and click-away handling.
 *
 * A fixed-position menu can't follow the page, so it closes on scroll/resize.
 */
export function useAnchoredMenu(open: boolean, close: () => void) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (open) setRect(btnRef.current?.getBoundingClientRect() ?? null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      close();
    }
    function onMove() {
      close();
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, close]);

  return { btnRef, menuRef, rect };
}
