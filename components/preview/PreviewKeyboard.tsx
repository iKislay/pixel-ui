"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { accessibleName, getTabbables, isEditable } from "@/lib/focusable";
import { usePreviewReducedMotion } from "@/lib/preview-reduced-motion";

type WalkerState = { index: number; total: number; label: string };

type PreviewKeyboardValue = WalkerState & {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
};

const EMPTY: WalkerState = { index: -1, total: 0, label: "" };

const PreviewKeyboardContext = createContext<PreviewKeyboardValue | null>(null);

function stageRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-preview-stage]");
}

function stageTabbables(): HTMLElement[] {
  const root = stageRoot();
  return root ? getTabbables(root) : [];
}

export function PreviewKeyboardProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = usePreviewReducedMotion();
  const [enabledState, setEnabledState] = useState(false);
  const [walker, setWalkerState] = useState<WalkerState>(EMPTY);

  const indexRef = useRef(EMPTY.index);
  const labelRef = useRef(EMPTY.label);
  const markedRef = useRef<HTMLElement | null>(null);
  const standingRef = useRef<HTMLElement | null>(null);
  const steppingRef = useRef(false);

  const setWalker = useCallback((next: WalkerState) => {
    indexRef.current = next.index;
    labelRef.current = next.label;
    setWalkerState(next);
  }, []);

  const clearMarker = useCallback(() => {
    markedRef.current?.removeAttribute("data-preview-step");
    markedRef.current = null;
  }, []);

  const setEnabled = useCallback(
    (value: boolean) => {
      if (!value) {
        clearMarker();
        setWalker(EMPTY);
      }
      setEnabledState(value);
    },
    [clearMarker, setWalker],
  );

  const focusIndex = useCallback(
    (index: number, list: HTMLElement[]) => {
      const el = list[index];
      if (!el) return;
      clearMarker();
      steppingRef.current = true;
      el.focus({ preventScroll: true });
      steppingRef.current = false;
      if (document.activeElement === el) {
        el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
        el.setAttribute("data-preview-step", "");
        markedRef.current = el;
        standingRef.current = el;
      }
      setWalker({ index, total: list.length, label: accessibleName(el) });
    },
    [clearMarker, setWalker],
  );

  const step = useCallback(
    (direction: 1 | -1) => {
      const list = stageTabbables();
      if (list.length === 0) return;
      const active = document.activeElement;
      const inside = active instanceof HTMLElement && !!stageRoot()?.contains(active);
      const focused = inside && active instanceof HTMLElement ? list.indexOf(active) : -1;
      let index = focused >= 0 ? focused : indexRef.current;
      index =
        index < 0
          ? direction > 0
            ? 0
            : list.length - 1
          : (index + direction + list.length) % list.length;
      focusIndex(index, list);
    },
    [focusIndex],
  );

  const handleFocusIn = useCallback(
    (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const root = stageRoot();
      if (!root || !root.contains(target)) return;
      // focusIndex owns the state right after it moves focus itself
      if (steppingRef.current) return;
      clearMarker();
      standingRef.current = target;
      const list = getTabbables(root);
      const index = list.indexOf(target);
      if (index >= 0) setWalker({ index, total: list.length, label: accessibleName(target) });
      else setWalker({ index: indexRef.current, total: list.length, label: labelRef.current });
    },
    [clearMarker, setWalker],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.isComposing) return;
      const direction = event.key === "]" ? 1 : event.key === "[" ? -1 : 0;
      if (direction === 0 || isEditable(event.target)) return;
      event.preventDefault();
      step(direction as 1 | -1);
    },
    [step],
  );

  useEffect(() => {
    // pathname and reduced motion remount the stage, so rebind to the fresh root
    clearMarker();
    if (!enabledState) return;

    const refresh = () => {
      const root = stageRoot();
      if (!root) return;
      const list = getTabbables(root);
      const active = document.activeElement;
      if (active instanceof HTMLElement && root.contains(active)) {
        const index = list.indexOf(active);
        if (index >= 0) {
          setWalker({ index, total: list.length, label: accessibleName(active) });
          return;
        }
        setWalker({ index: indexRef.current, total: list.length, label: labelRef.current });
        return;
      }
      // the walker keeps its place only while the element it stands on still exists
      const standing = standingRef.current;
      const alive =
        indexRef.current >= 0 &&
        list.length > 0 &&
        !!standing &&
        standing.isConnected &&
        root.contains(standing);
      const index = alive ? Math.min(indexRef.current, list.length - 1) : -1;
      setWalker({
        index,
        total: list.length,
        label: alive && index === indexRef.current ? labelRef.current : "",
      });
    };

    refresh();
    document.addEventListener("focusin", handleFocusIn);
    window.addEventListener("keydown", handleKeyDown);

    let frame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(refresh);
    });
    const root = stageRoot();
    if (root) {
      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["disabled", "hidden", "tabindex", "inert", "aria-expanded", "aria-hidden"],
      });
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabledState, pathname, reduce, clearMarker, setWalker, handleFocusIn, handleKeyDown]);

  useEffect(() => () => clearMarker(), [clearMarker]);

  const value = useMemo(
    () => ({
      ...walker,
      enabled: enabledState,
      setEnabled,
      next: () => step(1),
      back: () => step(-1),
      reset: () => {
        const list = stageTabbables();
        if (list.length === 0) {
          clearMarker();
          setWalker(EMPTY);
          return;
        }
        focusIndex(0, list);
      },
    }),
    [walker, enabledState, setEnabled, step, focusIndex, clearMarker, setWalker],
  );

  return (
    <PreviewKeyboardContext.Provider value={value}>{children}</PreviewKeyboardContext.Provider>
  );
}

export function usePreviewKeyboard(): PreviewKeyboardValue {
  const ctx = useContext(PreviewKeyboardContext);
  if (!ctx) throw new Error("usePreviewKeyboard requires PreviewKeyboardProvider");
  return ctx;
}
