"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";

// A small external store: each toggle subscribes to one boolean.
function createCompareStore() {
  let ids: string[] = [];
  const listeners = new Set<() => void>();
  return {
    get: () => ids,
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    toggle(id: string) {
      ids = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
      listeners.forEach((l) => l());
    },
  };
}
type CompareStore = ReturnType<typeof createCompareStore>;
const StoreContext = createContext<CompareStore | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createCompareStore);
  return <StoreContext value={store}>{children}</StoreContext>;
}

function useCompare<T>(selector: (ids: string[]) => T): T {
  const store = useContext(StoreContext)!;
  return useSyncExternalStore(store.subscribe, () => selector(store.get()), () => selector(store.get()));
}

export function CompareToggle({ productId }: { productId: string }) {
  const store = useContext(StoreContext)!;
  const selected = useCompare((ids) => ids.includes(productId));
  return (
    <label>
      <input type="checkbox" checked={selected} onChange={() => store.toggle(productId)} /> Compare
    </label>
  );
}

export function CompareTray() {
  const ids = useCompare((ids) => ids);
  return <div className="tray">Comparing: {ids.join(", ")}</div>;
}
