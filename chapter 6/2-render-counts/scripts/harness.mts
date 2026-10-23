// Measurement harness shared by the Chapter 6 examples (copied into each
// example's scripts/ folder so every example stays self-contained).
//
// - buildAndStart(): runs `next build` with the given env, then `next start`
// - countRenders: an init script that plays the part of React DevTools.
//   React (production builds included) reports every commit to
//   window.__REACT_DEVTOOLS_GLOBAL_HOOK__. On each commit we walk the fiber
//   tree and count every function/class component whose function actually
//   ran in this commit (PerformedWork flag set on a fiber that is new since
//   the previous commit). Names need `next build --no-mangling`.
// - eventTiming: collects Event Timing entries, the data behind INP.
import { spawn, type ChildProcess } from "node:child_process";
import { chromium, type Browser, type Page } from "playwright";

export const RENDER_COUNTER = `(() => {
  const FN = new Set([0, 1, 11, 15]); // function, class, forwardRef, simple memo
  const counts = new Map();
  let prev = new WeakSet();
  const nameOf = (f) => {
    const t = f.type;
    return (t && (t.displayName || t.name)) || "Anonymous";
  };
  window.__RENDERS__ = {
    commits: 0,
    reset() { counts.clear(); this.commits = 0; },
    snapshot() { return { commits: this.commits, counts: Object.fromEntries(counts) }; },
  };
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    isDisabled: false,
    renderers: new Map(),
    inject(renderer) { this.renderers.set(1, renderer); return 1; },
    checkDCE() {},
    onScheduleFiberRoot() {},
    onCommitFiberUnmount() {},
    onPostCommitFiberRoot() {},
    onCommitFiberRoot(_id, root) {
      const next = new WeakSet();
      const stack = [root.current];
      while (stack.length) {
        const f = stack.pop();
        next.add(f);
        if (FN.has(f.tag) && (f.flags & 1) && !prev.has(f)) {
          const n = nameOf(f);
          counts.set(n, (counts.get(n) || 0) + 1);
        }
        if (f.sibling) stack.push(f.sibling);
        if (f.child) stack.push(f.child);
      }
      prev = next;
      window.__RENDERS__.commits++;
    },
  };
})();`;

export const EVENT_TIMING = `(() => {
  window.__EVENTS__ = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      window.__EVENTS__.push({ name: e.name, duration: e.duration,
        interactionId: e.interactionId || 0 });
    }
  }).observe({ type: "event", buffered: true, durationThreshold: 16 });
})();`;

export async function buildAndStart(opts: {
  env?: Record<string, string>;
  port: number;
  build?: boolean;
}): Promise<ChildProcess> {
  const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1", ...opts.env };
  if (opts.build !== false) {
    await run("npx", ["next", "build", "--no-mangling"], env);
  }
  const server = spawn("npx", ["next", "start", "-p", String(opts.port)], {
    env, stdio: "ignore", detached: true,
  });
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://localhost:${opts.port}/`);
      if (r.status < 600) return server;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("server did not start");
}

export function stop(server: ChildProcess) {
  try { process.kill(-server.pid!, "SIGTERM"); } catch {}
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { env, stdio: ["ignore", process.env.VERBOSE ? "inherit" : "ignore", "inherit"] });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`))));
  });
}

export async function launch(): Promise<Browser> {
  // CHROMIUM_PATH lets the scripts use a preinstalled Chromium; otherwise
  // run `npx playwright install chromium` once.
  return chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
}

export async function openPage(browser: Browser, url: string, o: {
  counter?: boolean; timing?: boolean; cpuThrottle?: number;
} = {}): Promise<Page> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  if (o.counter) await page.addInitScript(RENDER_COUNTER);
  if (o.timing) await page.addInitScript(EVENT_TIMING);
  if (o.cpuThrottle && o.cpuThrottle > 1) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: o.cpuThrottle });
  }
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  return page;
}

export async function resetRenders(page: Page) {
  await page.evaluate(() => (window as any).__RENDERS__.reset());
}

export async function renders(page: Page, only?: string[]) {
  const snap = await page.evaluate(() => (window as any).__RENDERS__.snapshot());
  const counts: Record<string, number> = snap.counts;
  const picked = only
    ? Object.fromEntries(Object.entries(counts).filter(([k]) => only.includes(k)))
    : counts;
  const total = Object.values(picked).reduce((a, b) => a + b, 0);
  return { commits: snap.commits as number, total, counts: picked };
}

// Worst keyboard interaction (max event duration per interactionId), ms.
export async function worstInteraction(page: Page, kinds = ["keydown", "keypress", "keyup", "input", "beforeinput"]) {
  const events = await page.evaluate(() => (window as any).__EVENTS__);
  const byId = new Map<number, number>();
  for (const e of events) {
    if (!kinds.includes(e.name)) continue;
    const id = e.interactionId || -1;
    byId.set(id, Math.max(byId.get(id) ?? 0, e.duration));
  }
  const all = [...byId.values()];
  return { worst: all.length ? Math.max(...all) : 0, interactions: all.length };
}

export async function scriptBytes(page: Page) {
  return page.evaluate(() =>
    (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
      .filter((e) => e.initiatorType === "script")
      .reduce((a, e) => a + e.encodedBodySize, 0),
  );
}

export async function domNodes(page: Page) {
  return page.evaluate(() => document.getElementsByTagName("*").length);
}
