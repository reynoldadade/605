// Measurement harness shared by the Chapter 7 examples (copied into each
// example's scripts/ folder so every example stays self-contained).
//
// - buildAndStart(): runs `next build` with the given env, then `next start`
// - openPage(): a fresh browser context with optional CPU and network
//   throttling (Chrome DevTools Protocol), locale, and the web-vitals
//   attribution build injected before any page script runs, so LCP, INP,
//   CLS, FCP and TTFB are collected the same way field code collects them
// - vitals(): the latest value and attribution of each metric
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { spawn, type ChildProcess } from "node:child_process";
import { chromium, type Browser, type Page } from "playwright";

const require = createRequire(import.meta.url);
// The attribution IIFE build sits next to the package's CommonJS entry.
const WEB_VITALS = readFileSync(join(dirname(require.resolve("web-vitals/attribution")),
  "web-vitals.attribution.iife.js"), "utf8");

// Lighthouse's mobile preset: 150 ms RTT, 1.6 Mbps down, 750 Kbps up.
export const SLOW_4G = { latency: 150, down: 1638.4 * 1024 / 8, up: 750 * 1024 / 8 };

export const VITALS_COLLECTOR = `${WEB_VITALS}
;(() => {
  const v = (window.__VITALS__ = {});
  const keep = (m) => {
    const a = m.attribution || {};
    v[m.name] = {
      value: m.value,
      rating: m.rating,
      navigationType: m.navigationType,
      attribution: m.name === "LCP" ? {
        target: a.target, url: a.url,
        timeToFirstByte: a.timeToFirstByte,
        resourceLoadDelay: a.resourceLoadDelay,
        resourceLoadDuration: a.resourceLoadDuration,
        elementRenderDelay: a.elementRenderDelay,
      } : m.name === "INP" ? {
        interactionTarget: a.interactionTarget,
        inputDelay: a.inputDelay,
        processingDuration: a.processingDuration,
        presentationDelay: a.presentationDelay,
        loafScripts: (a.longAnimationFrameEntries || []).flatMap((e) =>
          (e.scripts || []).map((s) => ({ src: s.sourceURL, ms: Math.round(s.duration) }))),
      } : m.name === "CLS" ? { largestShiftTarget: a.largestShiftTarget } : undefined,
    };
  };
  const o = { reportAllChanges: true };
  webVitals.onLCP(keep, o); webVitals.onINP(keep, o); webVitals.onCLS(keep, o);
  webVitals.onFCP(keep, o); webVitals.onTTFB(keep, o);
})();`;

export async function buildAndStart(opts: {
  env?: Record<string, string>;
  port: number;
  build?: boolean;
  args?: string[];
}): Promise<ChildProcess> {
  const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1", ...opts.env };
  if (opts.build !== false) {
    await run("npx", ["next", "build", ...(opts.args ?? [])], env);
  }
  const server = spawn("npx", ["next", "start", "-p", String(opts.port)], {
    env, stdio: process.env.VERBOSE ? "inherit" : "ignore", detached: true,
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

export function run(cmd: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
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

export type Profile = {
  cpu?: number;                       // CPU slowdown factor
  network?: typeof SLOW_4G;           // network throttling
  locale?: string;                    // navigator.language / Accept-Language
  mobile?: boolean;                   // small viewport
  vitals?: boolean;                   // inject the web-vitals collector
};

export async function openPage(browser: Browser, url: string | null, p: Profile = {}) {
  const ctx = await browser.newContext({
    locale: p.locale ?? "en-US",
    viewport: p.mobile ? { width: 412, height: 823 } : { width: 1350, height: 940 },
    deviceScaleFactor: p.mobile ? 2 : 1,
    isMobile: !!p.mobile,
    hasTouch: !!p.mobile,
  });
  const page = await ctx.newPage();
  if (p.vitals !== false) await page.addInitScript(VITALS_COLLECTOR);
  const cdp = await ctx.newCDPSession(page);
  if (p.cpu && p.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: p.cpu });
  if (p.network) {
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: p.network.latency,
      downloadThroughput: p.network.down, uploadThroughput: p.network.up,
    });
  }
  if (url) await page.goto(url, { waitUntil: "load" });
  return page;
}

export async function vitals(page: Page): Promise<Record<string, any>> {
  return page.evaluate(() => (window as any).__VITALS__ ?? {});
}

// Makes the page report final values, the way leaving the tab does.
export async function hide(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(200);
}

export const pct = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
};
export const median = (xs: number[]) => pct(xs, 50);
export const round = (x: number) => Math.round(x);
