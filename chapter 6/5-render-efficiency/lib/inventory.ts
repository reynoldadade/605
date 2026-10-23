// A stand-in for a live inventory feed (a WebSocket in a real app). It
// counts subscriptions so the example can show how often an effect
// re-subscribes.
type Listener = (stock: number) => void;

export const inventory = {
  subscriptions: 0,
  subscribe(productId: string, onChange: Listener) {
    inventory.subscriptions++;
    document.body.dataset.subscriptions = String(inventory.subscriptions);
    const id = setInterval(() => onChange(3 + Math.floor(Math.random() * 5)), 1000);
    return () => clearInterval(id);
  },
};

export function notify(message: string, opts: { muted: boolean }) {
  const log = document.getElementById("log");
  if (log) log.textContent = `${message}${opts.muted ? " (muted)" : " (with sound)"}`;
}
