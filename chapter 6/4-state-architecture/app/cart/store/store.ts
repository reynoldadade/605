// A minimal external store: state outside React, subscribers notified on
// change. Libraries such as Zustand provide the same shape with more care.
type Line = { productId: string; qty: number };
export type CartState = { items: Line[]; isOpen: boolean };

export function createCartStore() {
  let state: CartState = { items: [], isOpen: false };
  const listeners = new Set<() => void>();
  const set = (next: CartState) => {
    state = next;
    listeners.forEach((l) => l());
  };

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    actions: {
      addItem(productId: string) {
        const line = state.items.find((l) => l.productId === productId);
        set({
          ...state,
          items: line
            ? state.items.map((l) => (l === line ? { ...l, qty: l.qty + 1 } : l))
            : [...state.items, { productId, qty: 1 }],
        });
      },
      toggleDrawer() {
        set({ ...state, isOpen: !state.isOpen });
      },
    },
  };
}

export type CartStore = ReturnType<typeof createCartStore>;
