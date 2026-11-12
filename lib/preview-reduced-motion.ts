"use client";

import { useSyncExternalStore } from "react";

type Override = boolean | null;

const MARKER = "prefers-reduced-motion";
const SYSTEM_QUERY = "(prefers-reduced-motion: reduce)";
// kept on window so a hot reload of this module reuses the same store as
// listeners captured by motion and the canvas demos
const STORE_KEY = "__pixelPreviewReducedMotion";

type PreviewStore = {
  original: (query: string) => MediaQueryList;
  override: Override;
  reactListeners: Set<() => void>;
  synthetic: Map<string, PreviewMediaQueryList>;
  system: MediaQueryList | null;
};

class PreviewMediaQueryList extends EventTarget {
  readonly media: string;
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null =
    null;
  private readonly store: PreviewStore;
  private readonly source: MediaQueryList;

  constructor(store: PreviewStore, query: string) {
    super();
    this.store = store;
    this.media = query;
    this.source = store.original(query);
    this.source.addEventListener("change", this.onSourceChange);
  }

  get matches(): boolean {
    if (this.store.override !== null) return this.store.override;
    return this.source.matches;
  }

  private onSourceChange = () => {
    if (this.store.override === null) this.emitChange();
  };

  emitChange(): void {
    const event = new Event("change") as MediaQueryListEvent;
    Object.defineProperty(event, "matches", { value: this.matches });
    Object.defineProperty(event, "media", { value: this.media });
    this.onchange?.(event);
    this.dispatchEvent(event);
  }

  addListener(
    callback: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown,
  ): void {
    this.addEventListener("change", callback as EventListener);
  }

  removeListener(
    callback: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown,
  ): void {
    this.removeEventListener("change", callback as EventListener);
  }
}

function getStore(): PreviewStore | null {
  if (typeof window === "undefined") return null;
  const scoped = window as unknown as Record<string, unknown>;
  const existing = scoped[STORE_KEY] as PreviewStore | undefined;
  if (existing) return existing;

  const store: PreviewStore = {
    original: window.matchMedia.bind(window),
    override: null,
    reactListeners: new Set(),
    synthetic: new Map(),
    system: null,
  };
  scoped[STORE_KEY] = store;

  window.matchMedia = (query: string): MediaQueryList => {
    if (!query.includes(MARKER)) return store.original(query);
    let list = store.synthetic.get(query);
    if (!list) {
      list = new PreviewMediaQueryList(store, query);
      store.synthetic.set(query, list);
    }
    return list as unknown as MediaQueryList;
  };

  return store;
}

function systemList(): MediaQueryList | null {
  const store = getStore();
  if (!store) return null;
  store.system ??= store.original(SYSTEM_QUERY);
  return store.system;
}

function subscribeReact(listener: () => void): () => void {
  const store = getStore();
  if (!store) return () => {};
  store.reactListeners.add(listener);
  return () => {
    store.reactListeners.delete(listener);
  };
}

function setOverride(next: Override): void {
  const store = getStore();
  if (!store || store.override === next) return;
  store.override = next;
  // motion-dom caches its MediaQueryList on first use, so existing listeners
  // are notified before any React render reads the new value
  for (const list of store.synthetic.values()) list.emitChange();
  for (const listener of store.reactListeners) listener();
}

export function setPreviewReducedMotion(active: boolean): void {
  // off releases the override so the system setting applies again
  setOverride(active ? true : null);
}

export function resetPreviewReducedMotion(): void {
  setOverride(null);
}

export function usePreviewReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReact,
    () => getStore()?.override === true,
    () => false,
  );
}

export function useSystemReducedMotion(): boolean {
  return useSyncExternalStore(
    (listener) => {
      const list = systemList();
      if (!list) return () => {};
      list.addEventListener("change", listener);
      return () => list.removeEventListener("change", listener);
    },
    () => systemList()?.matches === true,
    () => false,
  );
}
