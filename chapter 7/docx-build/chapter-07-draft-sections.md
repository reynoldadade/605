# Chapter 7: drafted prose (final, built into chapter_07.docx)

Drafted 2026-11-01 in Cowork against `chapter-07-outline.md`, all sections
in one pass, as with Chapter 6. `unslop` editing pass applied 2026-11-09 at
the user's request (Title Case headings and `**Label:**` bullet lead-ins
kept, as in Ch.6, because the publisher's guidelines use them).
Updated 2026-11-09 (later): the six worked examples are built and measured,
every `[[MEASURE]]` and `[[VERIFY]]` is filled in from them, and the prose
was corrected where the examples disagreed with the first draft (see the
outline's change log).

From this chapter on there is no Questions section and no Key Terms
section (user, 2026-11-01).

Style notes, carried over from Ch.3 to Ch.6: "we" not "I"/"me", no quoted
reported speech, no double dashes or em dashes, code identifiers in
backticks, bullets without end periods, no question-format headings,
Title Case headings, `**Label:**` bullet lead-ins. Targets Next.js 16.4,
React 19.3, web-vitals 6, Lighthouse 13, with version differences in
labelled Note boxes.

Markers: `[[CODE path]]` = full code in `605/chapter 7/`; `[[FIGURE 7.N]]`
= `605/chapter 7/figures/`. Every number in the prose comes from an
example's `npm run measure` (recorded in its README).
---

## Why Measurement Needs a Method

Every number in Chapter 6 came from the same place: a production build, running on one laptop, in a headless browser with the CPU slowed down four times, repeated until the result was stable. That setup was deliberate. It let us change one thing, run the same interaction again, and attribute the difference to the change. A search box that took 304 ms to respond and then 24 ms showed what bounding the list was worth.

It told us nothing about the reader in a train tunnel on a three-year-old Android phone, with forty browser tabs open and a battery saver slowing the CPU. That reader doesn't run our measurement script. They open the product page, wait, tap the size picker, wait again, and leave. Measurements on the laptop never include that reader.

This gap is the subject of the chapter. The previous four chapters built a product page that renders most of its code on the server, fetches data close to the database, keeps mutations in Server Actions, and keeps its Client Components small. We made each of those decisions to make the page faster and more reliable for real readers. This chapter shows how to check whether they did, and how to find out quickly when something goes wrong.

Two kinds of measurement answer two different questions.

- **Lab data:** measurements we take ourselves, under conditions we control, such as a Lighthouse run, a performance trace in Chrome DevTools, or a Playwright script like Chapter 6's. Lab data is repeatable and comes with full detail, so it can explain a result. It describes one device on one network
- **Field data:** measurements collected from real readers as they use the application, also called real user monitoring. Field data describes the whole spread of devices, networks, and behavior. It is noisy, it arrives without a stack trace or a flame graph, and it only exists after the code has shipped

This chapter's tension is lab against field. Lab data is precise but narrow. Field data is accurate about what readers experience but vague about why. A team that trusts only the lab ships pages that score 100 in Lighthouse and still feel slow to a third of its readers. A team that trusts only the field watches a chart get worse and has no idea where to start.

The resolution is to give each kind of data the job it does well. Field data decides what to fix, and it decides whether a fix worked. Lab tools and server traces explain why a number is what it is, so we can change it. Neither replaces the other, and the order matters. A lab investigation that doesn't start from a field problem often optimizes something no reader was suffering from.

Errors follow the same pattern. A bug we can reproduce on our own machine is easy to fix. The bugs that matter in production usually don't happen on our machines, because they depend on a reader's data, browser, extension, or network. Good error reporting is field data for correctness. It tells us which errors readers hit, how often, on which route, and after which deploy, and it gives us enough context to reproduce the failure in the lab.

The sections that follow start with the metrics: what happens during a page load and how each metric measures part of it (sections 2 to 4). Then come the tools: collecting field data (section 5), profiling in the lab (section 6), and analyzing hydration, which sits between the server's work and the reader's first interaction (section 7). Sections 8 and 9 follow a single request through the server with distributed tracing, and follow an error from the moment it is thrown to the moment someone fixes it. Section 10 turns all of it into a monitoring setup and a workflow, and the Case Study applies that workflow to a product page that was only slow in production.

## The Life of a Page Load

Every metric in this chapter measures part of one sequence. This section walks through that sequence for the product page we built in the previous chapters.

A reader taps a link to a product. The browser looks up the server's address, opens a connection, and sends a request for the HTML document. With Cache Components enabled, as in Chapter 4, Next.js answers with the static shell first: the layout, the header, the product title and image, and a fallback for each `<Suspense>` boundary whose content depends on the request. The first bytes of that response mark **Time to First Byte**, or TTFB.

The browser parses the HTML as it arrives, discovers the stylesheets, fonts, and scripts it references, and paints as soon as it can. The first time any text or image appears marks **First Contentful Paint**, or FCP. The server keeps the connection open and streams the rest of the page into the same response: the reviews, the price for the reader's region, the recommendations, each replacing its fallback as it resolves. When the largest image or block of text in the viewport finishes rendering, that moment marks **Largest Contentful Paint**, or LCP. For a product page, the LCP element is usually the main product photo.

Meanwhile, the JavaScript for the Client Components downloads and runs. React hydrates each client island. It runs the component functions once, matches their output against the HTML the server sent, and attaches event handlers. Until a component is hydrated, it looks ready but doesn't respond. React hydrates `<Suspense>` boundaries independently, and if the reader taps inside one that isn't hydrated yet, React hydrates that one first.

From then on, the reader interacts. Each tap, click, or key press starts an event, runs handlers, usually renders, and ends when the browser paints the next frame. The time from input to that paint is the interaction's latency, and the worst of these over the reader's visit becomes **Interaction to Next Paint**, or INP. Throughout the visit, the browser also tracks every unexpected movement of visible content. A late banner that pushes the size picker down just as the reader reaches for it is a layout shift, and the total of the worst burst of shifts is **Cumulative Layout Shift**, or CLS.

[[FIGURE 7.1]]

Figure 7.1 places each metric on that timeline. Two things about it are specific to applications built like ours. First, streaming separates FCP from LCP more than in a page that renders everything at once. The shell can paint early while the content that matters most is still on its way, so a page can have a good FCP and a poor LCP. Second, hydration overlaps with the reader's first interactions. A product page that paints in one second and hydrates in four has a three-second window in which a tap does nothing, and INP records that delay.

### Core Web Vitals and Their Thresholds

Google groups three of these metrics as the **Core Web Vitals**: LCP for loading, INP for responsiveness, and CLS for visual stability. Most tools report them first, Chrome collects them from real users for the Chrome User Experience Report, and Google's search ranking uses them. TTFB and FCP are supporting metrics. They don't measure an outcome the reader cares about on their own, but they help explain LCP.

Each metric has two thresholds that divide results into good, needs improvement, and poor, as Table 7.1 shows.

| Metric | Measures | Good | Poor |
|---|---|---|---|
| TTFB | Time until the first byte of the document arrives | 800 ms or less | over 1,800 ms |
| FCP | Time until any content first paints | 1.8 s or less | over 3.0 s |
| LCP | Time until the largest content element in the viewport paints | 2.5 s or less | over 4.0 s |
| INP | Latency of the slowest interactions during the visit | 200 ms or less | over 500 ms |
| CLS | Total of the largest burst of unexpected layout shifts | 0.1 or less | over 0.25 |

A page passes when each Core Web Vital is good at the **75th percentile** of page visits, measured separately for mobile and desktop. The percentile matters more than the threshold. The target isn't the typical reader, or our own experience on a fast laptop. It's the visit that was slower than three quarters of all visits. A page whose median LCP is 1.2 seconds can still fail at the 75th percentile if a quarter of its readers are on slow phones. Most of this chapter is about finding and helping that quarter.

> **Tip.** Read percentiles, never averages. A few extremely slow visits, such as a reader whose tab was in the background for a minute, pull an average far from what anyone experienced. The 75th percentile describes a real reader, and the 95th tells us how bad the tail gets. When a dashboard offers only an average, treat it as a trend indicator at best.

## Loading Metrics: TTFB, FCP, and LCP

Loading metrics form a chain. LCP can't happen before FCP, and FCP can't happen before TTFB. So when LCP is poor, the first job is to find out which step takes the time.

### TTFB: What the Server Did First

TTFB covers everything before the first byte of the HTML arrives: redirects, DNS lookup, connection and TLS setup, the request travelling to the server, and the server's work before it starts responding. For a Next.js page, that last part depends on how the route renders.

- **A fully static route:** the HTML comes from the CDN or the server's cache. TTFB is mostly network distance
- **A route with a static shell:** under Cache Components, the shell is prerendered at build time and sent immediately, and the request-time parts stream after it. TTFB stays close to the static case, however slow the dynamic parts are
- **A fully dynamic route:** the server has to start rendering before it can send anything. Whatever runs before the first byte, such as `proxy.ts`, a session lookup, or an uncached data fetch above the first `<Suspense>` boundary, adds to TTFB

The third case is where most poor TTFB comes from, and Chapter 4's advice addresses it. Push request-time reads down into `<Suspense>` boundaries, so that the shell doesn't wait for them. A single `await cookies()` in the root layout, outside any boundary, makes every route dynamic from the first byte.

TTFB is also the metric most sensitive to geography. A reader on another continent adds the network distance to every round trip before the first byte, and each redirect adds another round trip. A link to `http://` that redirects to `https://`, then to `www.`, then to a localized path costs three extra round trips before the server does any work.

### FCP: When Something Appears

FCP measures when the browser first paints any text or image. Between TTFB and FCP, the browser is waiting on whatever blocks rendering: stylesheets in the `<head>`, synchronous scripts, and sometimes web fonts. Next.js handles most of this for us. Its CSS is split per route, its scripts load without blocking parsing, and `next/font` serves fonts from the same origin with a size-matched fallback. So a poor FCP in a Next.js app usually means a slow TTFB, or a third-party script or stylesheet added to the root layout that blocks rendering.

With streaming, the first paint is often the shell, which arrives early. That makes FCP a weak signal for a streamed page. A page that paints its header in 600 ms and its product two seconds later has an excellent FCP and a reader who is still waiting.

### LCP: When the Main Content Appears

LCP is the loading metric that matches what the reader is waiting for. The browser keeps a running candidate for the largest image or text block in the viewport, and the candidate when the reader first interacts or scrolls becomes the final value. It doesn't matter whether that element is the one we consider important. If a cookie banner's text is the largest block above the fold, the banner is the LCP element.

When the LCP element is an image, which is usual for a product page, its time breaks into four parts. The web-vitals library's attribution build reports them separately:

- **Time to first byte:** the document's TTFB, as above
- **Resource load delay:** the time from TTFB until the browser starts downloading the image. Long when the image is discovered late, for example because it's inside a streamed `<Suspense>` boundary or set as a CSS background
- **Resource load duration:** the download itself. Long when the image is large or the connection is slow
- **Element render delay:** the time from the download finishing until the image paints. Long when rendering is blocked, or when the element only appears after JavaScript runs

The breakdown shows which fix to try. A 3.8-second LCP whose largest part is load delay has a discovery problem, and making the image smaller won't help much. A 3.8-second LCP whose largest part is load duration has a size problem, and preloading it won't help much.

Two Next.js decisions affect LCP more than any others. The first is where the LCP element sits relative to the `<Suspense>` boundaries:

```tsx
// app/product/[id]/page.tsx (excerpt)
<main>
  <ProductHero product={product} />
  {/* name, price, and reviews (in their own <Suspense>) */}
  <Details product={product} />
</main>
```

[[CODE 1-load-metrics/app/product/[id]/page.tsx]]

The hero image belongs in the shell, outside any boundary that waits on request-time data. If the product photo depends on something slow, such as a personalization call or the reader's region, the browser can't discover the photo until that boundary streams in. The slow call's duration is added to the photo's load delay. Chapter 4 decided which data each part of the page waits for. That decision also decides LCP.

The second is how the image is loaded. `next/image` lazy-loads images by default, which is right for images below the fold and wrong for the LCP element. The browser doesn't request a lazy image until layout has placed it near the viewport, which adds to its load delay. Load the hero eagerly, and tell the browser it matters more than the other images on the page:

```tsx
// app/product/[id]/ProductHero.tsx (excerpt)
<Image
  src={product.imageUrl}
  alt={product.name}
  width={800}
  height={800}
  loading="eager"
  fetchPriority="high"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

[[CODE 1-load-metrics/app/product/[id]/ProductHero.tsx]]

`fetchPriority="high"` moves the request ahead of other images and scripts in the browser's queue. The `sizes` attribute lets the browser pick a smaller file on a narrow screen, which reduces load duration on the phones that make up the 75th percentile. When the browser can't find the image early in the HTML, the `preload` prop adds a preload hint for it to the document's `<head>`. The Next.js documentation recommends the first two props in most cases, and `preload` only when discovery is the problem.

> **Note (Next.js 16).** `next/image` deprecated the `priority` prop in Next.js 16 in favor of `preload`, whose name says what it does. Code that used `priority` on every hero image should usually move to `loading="eager"` with `fetchPriority="high"`, and keep `preload` for images the browser would otherwise find late.

Example `1-load-metrics/` builds the same product page three ways and measures LCP with the web-vitals attribution build, the same library field code uses. Table 7.2 shows the results.

| Version | LCP, 75th percentile of 20 loads | Largest part (median) |
|---|---|---|
| Hero in the shell, eager with high priority | 1,124 ms | resource load duration, 872 ms |
| Hero in the shell, lazy-loaded (the default) | 1,268 ms | resource load duration, 700 ms |
| Hero inside a `<Suspense>` boundary that waits 800 ms | 1,484 ms | resource load delay, 814 ms |

Each load used a fresh browser context, a phone-sized viewport, a CPU slowed four times, and Lighthouse's mobile network profile. Lazy loading added about 325 ms of resource load delay, the time the browser waited for layout before requesting the image. In the boundary version, the load delay was 814 ms, almost exactly the 800 ms the hero waited for. Making that image smaller wouldn't recover those 800 ms. Moving it out of the boundary does. FCP was about 420 ms in all three versions, because the shell painted at the same moment each time, which is why FCP alone couldn't tell them apart.

### CLS: Keeping Things Still

CLS isn't a loading metric, but most layout shifts happen during loading, so it belongs here. A shift happens when a visible element moves without the reader causing it. Streaming adds a specific risk. A `<Suspense>` fallback that's shorter than the content that replaces it pushes everything below it down when the content arrives.

The usual fixes still apply, and streaming adds one. Give every image `width` and `height`, which `next/image` requires anyway. Make each fallback reserve the space its content will take, for example a reviews skeleton with the height of three reviews. Put content that arrives late, such as a promotional banner, below the content the reader is using, or in space reserved for it. Shifts within 500 ms of a reader's tap or key press don't count, because the reader expects the page to change in response.

## Responsiveness: INP, and What Happened to TTI

Loading metrics end when the content is on screen. Responsiveness metrics start there. For a page made of client islands, they measure whether the page responds once it looks finished.

### What INP Measures

Interaction to Next Paint observes every click, tap, and key press during the reader's whole visit. Scrolling and hovering don't count. For each interaction, it measures the time from the input to the next frame the browser paints, which is the moment the reader sees that something happened. At the end of the visit, it reports one of the slowest. On pages with few interactions, that is the slowest one. On pages with many, it ignores one outlier for every fifty interactions, so a single unlucky tap in a long session doesn't define the result.

Each interaction's latency has three parts, and the web-vitals attribution build reports them separately:

- **Input delay:** the time from the input until the event handlers start running. Long when the main thread is busy with something else, such as hydration, a third-party script, or a previous interaction's rendering
- **Processing duration:** the time the event handlers take, including any synchronous React render they trigger
- **Presentation delay:** the time from the handlers finishing until the frame is painted. Long when the update produces a lot of style, layout, and paint work, for example a list that inserts thousands of DOM nodes

Chapter 6 worked almost entirely on the second part. Fewer renders, cheaper renders, and deferred renders all reduce processing duration. Chapter 6's Table 6.1 also showed the third part. Deferral couldn't reduce the time React spent committing thousands of DOM changes. The first part is new, and it's where hydration and third-party code show up.

### Hydration as Input Delay

A product page receives most of its interactions in the first few seconds. The reader opens the size picker, taps a thumbnail in the gallery, or starts typing a review. During those seconds, the main thread is often busy hydrating. React splits hydration into small chunks and yields between them, so a tap can interrupt hydration rather than wait for all of it. If the tap lands inside a `<Suspense>` boundary that isn't hydrated yet, React hydrates that boundary first, then replays the event. Because of that replay, a click on an island in a streamed page usually works. The hydration work still has to finish before the handler runs, though, and on a slow phone that time counts as input delay.

Two things keep this window short, and both come from earlier chapters. Small Client Components, as Chapter 3 recommended, have less to hydrate. Wrapping independent islands in their own `<Suspense>` boundaries lets React hydrate them separately and prioritize the one the reader touches. Section 7 covers how to measure hydration and what happens when it goes wrong.

### Long Animation Frames

Knowing that an interaction had a long input delay doesn't say what was running. The browser's Long Animation Frames API answers that. It reports every frame that took longer than 50 ms, with a list of the scripts that ran during it: the script's source URL, the function name where available, and how long it took. The web-vitals attribution build attaches the long animation frames that overlap the INP interaction. A field report can then show that the slowest tap on the product page spent 180 ms in a chat widget's script before our handler ran. That's a fact we couldn't find in the lab unless our lab setup happened to load the same widget at the same moment.

### What Happened to TTI

**Time to Interactive** was the earlier attempt to measure when a page becomes usable. It looked for the first five-second window after FCP with no long tasks and few network requests, and reported the start of that window. It was a lab metric only, because it needs a quiet period that a real visit rarely has, and it turned out to be unstable. One late network request or one long task could move it by seconds without changing what a reader experienced.

Lighthouse removed TTI from its performance score in version 10. Two metrics replaced its two jobs. In the lab, **Total Blocking Time** adds up the part of each long task beyond 50 ms, between FCP and the point TTI used to mark. It measures how long the main thread was blocked while the page loaded. In the field, INP measures what blocking cost real readers when they tried to interact. TTI still appears in older reports, dashboards, and performance budgets. When one of them reports a poor TTI, read it as a sign of heavy main-thread work during load, and check TBT in the lab and INP in the field.

> **Note (Lighthouse 13).** Lighthouse 10 removed TTI from the performance score. Lighthouse 13 went further on the diagnostic side. It replaced the old performance audits with insight audits, the same analysis the Chrome DevTools performance panel shows. The score itself didn't change. It still combines FCP, Speed Index, LCP, TBT, and CLS. Scripts or CI checks that read old audit IDs such as `server-response-time` or `largest-contentful-paint-element` from Lighthouse's JSON need to read the new insight IDs instead.

## Collecting Field Data

Field data starts with a few lines of code in the browser that observe the metrics, and a place on our side to send them. Several hosted services do both. This section builds the minimum ourselves, because doing so shows what any service is doing and which decisions matter.

### Observing the Metrics

Next.js wraps Google's `web-vitals` library in a hook. It must run in a Client Component, so it gets a small one of its own, rendered once in the root layout:

```tsx
// app/_components/WebVitals.tsx ("use client", excerpt)
import { useReportWebVitals } from "next/web-vitals";

function report(metric: Metric) {
  const page = metric.navigationURL ?? location.href;
  const url = new URL(page, location.href);
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    route: routePattern(url.pathname),
    release: process.env.NEXT_PUBLIC_RELEASE,
  });
  navigator.sendBeacon("/api/vitals", body);
}

export function WebVitals() {
  useReportWebVitals(report);
  return null;
}
```

[[CODE 2-rum-collector/app/_components/WebVitals.tsx]]

Three details in this component matter.

- **The callback is defined outside the component:** `useReportWebVitals` subscribes again whenever it receives a new function, and each new subscription reports the metrics collected so far a second time. A module-level function never changes. The React Compiler would also keep an inline function stable here, because it reads nothing reactive, but the module-level version doesn't depend on that
- **`sendBeacon` instead of `fetch`:** several metrics are only final when the reader leaves the page or switches tabs. CLS and INP keep changing for the whole visit. The browser queues a beacon and sends it even while the page is unloading, where it may cancel a normal `fetch`
- **The route pattern, not the URL:** `/product/123` and `/product/456` are the same page for performance purposes. Grouping by `/product/[id]` gives one distribution per page template, and keeps product IDs and query strings, which can contain personal data, out of the analytics store. The example's `routePattern` helper maps a path to its pattern with a short list of regular expressions

The Route Handler that receives the beacon only needs to validate the body and store it. Example `2-rum-collector/` appends each report to a newline-delimited JSON file, and a script computes percentiles from it. In production, the same data goes to whatever analytics or monitoring store the team uses.

[[CODE 2-rum-collector/app/api/vitals/route.ts]]

### Soft Navigations

The App Router navigates between pages without loading a new document. Until recently, that meant the browser measured LCP, FCP, and CLS only for the first page in a visit, and INP accumulated across every page the reader went on to visit in the same tab. A reader who landed on the home page and then browsed ten products contributed one LCP, the home page's, and one INP that blended all eleven pages.

> **Note (Next.js 16.4).** From Next.js 16.4, `useReportWebVitals` asks the web-vitals library to report soft navigations. In browsers that support them, each client-side navigation produces its own LCP, FCP, CLS, and INP, with `navigationType` set to `"soft-navigation"` and a `navigationURL` for the page they belong to. TTFB is still reported only for the first, full page load, since a soft navigation has no new document. Earlier 16.x versions reported metrics for the first page only.

> **Note (Chrome 151).** Chrome 151, released in July 2026, shipped the Soft Navigations API, which defines a soft navigation as a reader interaction that changes the URL and paints new content. Other browsers don't support it yet, so soft-navigation metrics come only from Chromium-based browsers. From its October 2026 release, the Chrome User Experience Report publishes experimental versions of LCP, INP, and CLS that include soft navigations, next to the unchanged stable values. Google plans to switch Search Console to the new data once it leaves its experimental status.

Soft-navigation metrics need care in analysis. A soft navigation's LCP only counts content painted after the navigation, so the header and anything else that stays on screen isn't a candidate. Its LCP is usually lower than a full load of the same page, and mixing the two in one distribution hides both. Segment by `navigationType` before computing percentiles. In example `2-rum-collector/`, ten simulated visits that each navigated client-side to two product pages produced twenty sets of soft-navigation metrics for `/product/[id]`, and no TTFB for any of them. The script first recorded every product view as a full page load, because it clicked links before the page had hydrated, and a click on a link React hasn't hydrated yet is an ordinary page load.

### Making the Data Useful

Raw beacons need four habits before they answer anything.

- **Segment before aggregating:** compute percentiles per route, per device class, and per navigation type. A product page that's fine on desktop and poor on mobile has a different problem from one that's poor everywhere. The User-Agent Client Hints and the `navigator.connection` API, where supported, give a rough device and network class
- **Record the release:** include a build or deployment identifier with every report. Without it, nobody can tie a regression to the deploy that caused it. Set the same value as the `deploymentId` in `next.config.ts` and expose it to the client as a `NEXT_PUBLIC_` variable. Next.js also writes the deployment ID to a `data-dpl-id` attribute on the `<html>` element, but example 2 showed that its client runtime removes the attribute during start-up, so reporting code can't read it there
- **Collect attribution for the poor results:** the attribution build adds a few kilobytes and a lot of detail. Sending the LCP breakdown, the LCP element's selector, and the INP interaction's target and long animation frames tells us where to start on a poor score. `useReportWebVitals` reports the standard build's metrics, without attribution. In Next.js 16.4, the experimental `webVitalsAttribution` option doesn't change that for the App Router hook. The case study therefore imports `onLCP`, `onINP`, and the other functions from `web-vitals/attribution` in a small Client Component instead, and passes `reportSoftNavs: true` to keep soft-navigation reporting
- **Sample when traffic is high:** at scale, reporting every visit costs more than the extra precision is worth. A fixed sample, such as one visit in ten chosen when the page loads, keeps every metric from that visit together and the percentiles stable

The Chrome User Experience Report, or CrUX, is Google's own field data. Chrome collects it from users who opted in, and Google publishes it monthly per origin and for popular pages. It requires no code, it's what Google's search ranking uses, and PageSpeed Insights and Search Console show it. It's a useful check on our own numbers, but it arrives a month late, covers only Chrome, and can't be segmented by our routes or releases. It tells us whether we have a problem. Our own collection tells us where.

## Profiling in the Lab

Field data points at a page, a device class, and a metric. The lab is where we find out why. The rule for lab work is to reproduce the field conditions as closely as possible and to measure more than once.

### Matching the Field

The laptop a developer works on is often several times faster than the phone at the 75th percentile, and the office network is far better than the reader's mobile connection. Chrome DevTools can narrow both gaps. Its performance panel throttles the CPU by a fixed factor and the network to a preset profile, and it can calibrate the CPU throttle to match a representative low-end or mid-range device. Chapter 6 used a fourfold slowdown throughout. That's a reasonable default, but the right setting comes from the field data. If most poor INP comes from a particular device class, calibrate to it. One detail matters when reading the results. DevTools network throttling delays response bodies, not response headers, so a throttled lab run reports almost the local server's TTFB, and the simulated round trips show up in the later parts of LCP. Compare lab TTFB with field TTFB only for unthrottled runs from a comparable location.

The performance panel's landing view also shows the page's own Core Web Vitals live, as we interact with it, and can place CrUX field values for the same URL beside them. That comparison is the quickest sanity check in this chapter. If the local LCP is 900 ms and the field's 75th percentile is 3.4 seconds, the lab setup isn't reproducing what readers experience yet, and we can't trust any conclusion from it.

### Reading a Trace

A recorded trace shows everything the browser did, on parallel tracks: network requests, the main thread's tasks, frames, layout shifts, and, with React 19.2's Performance Tracks from Chapter 6, which components React rendered and at what priority. For loading problems, start from the LCP marker and work backwards. Find the LCP image request in the network track, see when it started relative to the document, and see what the main thread was doing between the download finishing and the paint. For interaction problems, select the interaction in the interactions track. The panel splits it into input delay, processing, and presentation delay, the same three parts as INP, and shows the tasks inside each.

The panel's insights sidebar runs the same analysis as Lighthouse 13 on the recorded trace. It names the LCP element and breaks its time into the four parts from section 3, lists render-blocking requests, finds layout shift culprits, and attributes main-thread time to third parties. It doesn't replace reading the trace, but it's a good list of places to look first.

### Lighthouse and Repeatability

Lighthouse loads a page once under simulated mobile conditions and produces a score from five metrics. It's useful for catching regressions in CI and for a quick audit of a page we haven't looked at before. It has two limits worth knowing. It measures a single cold load, with no interactions, so it can't measure INP at all and relies on TBT instead. And a single run varies, sometimes by a lot, because of everything else running on the machine.

So measure more than once and report the median, or the 75th percentile when matching field data. Chapter 6's examples ran each measurement several times and recorded every run. A difference between two versions that's smaller than the spread between runs of the same version isn't a difference.

> **Tip.** Lab measurements of a development build are not measurements of the application. `next dev` compiles on demand, includes development-only checks, and doesn't minify. Always profile `next build && next start`, as Chapter 6 did. For loading measurements, also clear the cache or use a fresh browser profile for each run, unless the point is to measure a returning visit.

### Performance Budgets

A performance budget turns a measurement into a check that fails. A budget can be a metric, such as LCP under 2.5 seconds in a throttled lab run of the product page, or a resource limit, such as no more than 150 KB of compressed client JavaScript for the route. Resource budgets are cruder but more stable, because they don't vary between runs. `next analyze`, introduced in Chapter 6, shows where each route's client bytes come from when a resource budget fails.

Budgets belong in CI, run against a production build, with the same throttling every time. A budget checked on every pull request catches a regression in the commit that caused it, which is far cheaper than finding it in a field chart two weeks later.

## Hydration Analysis

Hydration is the step where the browser takes over the HTML the server rendered. The server sends HTML that looks finished. The browser then runs every Client Component once, checks that what it produces matches that HTML, and attaches event handlers. When it works, the reader never notices. When it's slow, the page looks ready but ignores taps, which shows up as input delay in INP. When the browser's output doesn't match the server's HTML, React throws away part of the page and renders it again on the client, which costs time, can shift the layout, and often goes unnoticed in production.

### Measuring What Hydration Costs

Hydration cost has two parts: downloading and parsing the client JavaScript, and running the components. The first grows with bundle size, which Chapter 3's leaf rule and section 6's resource budgets control. The second grows with the number and complexity of Client Components on the page, which Chapter 6 reduced.

In the lab, a performance trace shows both. The network track shows the client chunks, and with React's Performance Tracks, the Components track shows each island's hydration as a separate block with its duration. On a throttled CPU, an island that takes 5 ms on a laptop can take 40 ms. A page with a dozen islands then spends half a second hydrating before it can respond quickly to the reader's first tap.

In the field, there's no built-in hydration metric in the App Router, but two marks give a useful approximation. `instrumentation-client.ts` runs after the HTML has loaded and before hydration starts, so a mark there records the start. An effect in the island the reader is most likely to use first runs after that island has hydrated:

```ts
// instrumentation-client.ts (excerpt)
performance.mark("hydration-start");
```

```tsx
// app/product/[id]/SizePicker.tsx ("use client", excerpt)
useEffect(() => {
  const m = performance.measure("size-picker-ready", "hydration-start");
  reportTiming("size-picker-ready", m.duration);
}, []);
```

[[CODE 3-hydration/app/product/[id]/SizePicker.tsx]]

In example `3-hydration/`, the mark was visible to the island's effect on every load of a production build. Reported alongside the Web Vitals and segmented the same way, this tells us how long readers on slow phones wait before the most important control on the page responds.

### Hydration Mismatches

A mismatch happens when a Client Component renders something different in the browser from what it rendered on the server. There are only a few usual causes.

- **Time:** `new Date()` or `Date.now()` during render puts the server's time in the HTML and the browser's time in the hydration render, which runs later. The two disagree whenever the formatted value crosses a second, a minute, or a day in between
- **Locale and time zone:** `toLocaleString()`, `Intl.DateTimeFormat`, and `Intl.NumberFormat` without explicit options use the server's locale and time zone on the server and the reader's in the browser. A price formatted as 1,299.00 on the server becomes 1.299,00 in a German reader's browser
- **Browser-only checks:** `typeof window !== "undefined"` or a read from `localStorage` during render takes one branch on the server and the other in the browser
- **Invalid HTML nesting:** a `<div>` inside a `<p>`, or a `<a>` inside another `<a>`. The browser's HTML parser repairs the server's HTML, so the DOM no longer has the structure React rendered
- **Changes made by something else:** a browser extension or a third-party script that edits the DOM before React hydrates it

In development, React reports the first mismatch it finds as a single error with a diff of the server and client output, and Next.js shows it in its error overlay with the component that produced it. That makes mismatches easy to fix when they happen on a developer's machine. The trouble is that many of them don't. A developer in the same time zone and locale as the server, with no extensions, never sees the price mismatch that every German reader triggers.

> **Note (React 19).** React 19 replaced the stream of separate mismatch warnings from React 18 with a single error that shows the server and client output as a diff. It also tolerates elements that third-party scripts and browser extensions insert into `<head>` and `<body>`, skipping them during hydration instead of reporting a mismatch, which removed a common source of false alarms.

### What a Mismatch Costs in Production

In production, React doesn't show an overlay. When it finds a mismatch, it discards the server's HTML for the nearest `<Suspense>` boundary around the mismatch, renders that subtree from scratch on the client, and replaces the DOM. If there's no boundary, it does this for the whole root. The page keeps working, which is why mismatches survive in production for months.

React renders the content inside the boundary twice, once on the server and once on the client, and the client render happens on the main thread during the reader's first seconds on the page. The replaced DOM can move, which counts as a layout shift. If the LCP element is inside the replaced subtree, the browser paints it a second time, and LCP can move later. Example `3-hydration/` measured the price mismatch from the list above on a product island, with the CPU slowed four times. The island is the price, the size picker, and a list of specifications, inside one `<Suspense>` boundary. Table 7.3 shows medians of seven loads.

| Version | Reader's locale | Mismatch errors per load | Island ready | CLS |
|---|---|---|---|---|
| Default locale | `en-US` (matches the server) | 0 | 390 ms | 0 |
| Default locale | `de-DE` | 1 | 450 ms | 0 |
| Locale chosen on the server | `en-US` | 0 | 408 ms | 0 |
| Locale chosen on the server | `de-DE` | 0 | 387 ms | 0 |

For German readers, the mismatch added about 60 ms before the island was ready, the time React spent rendering the boundary a second time. The page didn't shift in this example, because the German price took the same space as the English one. In the Case Study, the same mismatch on a price that sits above other content did cause a shift.

React reports each mismatch it recovers from. Next.js forwards these recoverable errors to the browser's global `reportError`, so a listener for `window` `error` events sees them, which section 9 sets up. In example 3, every German load produced exactly one such error, with the message `Minified React error #418` and an argument of `text`, React's production code for a text mismatch during hydration. That makes hydration mismatches visible in the field, grouped and counted like any other error, which is usually how a team first learns that half its readers in one country are re-rendering the product page.

### Fixing Mismatches

Each cause has a direct fix, and none of them is to silence the error.

- **Make the server and the browser agree:** format with explicit options. `Intl.NumberFormat(locale, { style: "currency", currency })` with the locale chosen on the server, from the reader's preferences or the URL, and passed to the Client Component as a prop, renders the same string on both sides. The same applies to time zones
- **Move browser-only values after hydration:** a value that only the browser knows, such as the current time, the window size, or something in `localStorage`, belongs in state that an effect sets after the component mounts. `useSyncExternalStore` with a `getServerSnapshot` that returns the server's value works too. The first client render then matches the server, and the browser value appears one render later
- **Fix the markup:** invalid nesting is a bug in our JSX, and the development error names the elements involved
- **Narrow the exception:** for a single text node that can't match, such as a timestamp, `suppressHydrationWarning` on that element tells React to accept the difference. It applies to one element's own text and attributes, not its children, and it hides the difference rather than fixing it. Use it for values whose difference is the point, and nowhere else

Chapter 6 met the first cause from another direction. A Client Component that reads `Date.now()` during render breaks the purity rule, the React Compiler can freeze its value, and with Cache Components, `next build` rejects it on a prerendered page. The same fix, treating the time as state that changes on purpose, also removes the mismatch.

> **Tip.** Since Next.js 16.2, `next dev` forwards browser warnings and errors to the terminal by default, through the `logging.browserToTerminal` option. Hydration errors then show up in the same place as server logs, which is useful when an AI coding agent or a teammate reads only the terminal. Set the option to `true` to forward all console output, or `false` to turn it off.

## Distributed Tracing

Field data tells us that the product page's TTFB is poor for a fifth of requests, and that the reviews section streams in late. It can't tell us why, because the cause is on the server. The server's work for one page has many steps: the proxy, the session lookup, the product query, a call to the reviews service, a call to the recommendations service, each with its own latency. Logs from each step exist, but joining them for one request means matching timestamps across machines by hand. Distributed tracing records the steps of a request as a single structure.

### Traces and Spans

A **trace** records everything the server did for one request. It's made of **spans**, each of which records one unit of work: its name, its start time and duration, its status, a set of attributes such as the route or the product ID, and the span that started it. The parent links turn the spans into a tree, and drawn against a time axis, the tree becomes a waterfall that shows what ran in sequence, what ran in parallel, and where the time went.

The tree can cross services. When the Next.js server calls the reviews service, it adds a `traceparent` header to the request, carrying the trace ID and its own span ID, in the format defined by the W3C Trace Context standard. The reviews service reads the header and creates its spans as children of the caller's span. The same trace then covers both services, and any further services they call, as long as each one propagates the header.

**OpenTelemetry** is the vendor-neutral standard for producing traces, along with metrics and logs. It defines the API our code calls to create spans, the SDK that collects them, and the OTLP protocol for exporting them to a collector or directly to a tracing backend. Because the format is shared, the same instrumentation works with an open-source backend run by the team or with any hosted observability service.

### Tracing a Next.js App

Next.js is already instrumented with OpenTelemetry. It creates spans for each request, for rendering the route, for each `fetch` the server makes, for Route Handlers, and for `generateMetadata`. These spans go nowhere until we register a tracer provider, which happens in the `register` function of `instrumentation.ts`, which Chapter 5 used for `onRequestError`:

```ts
// instrumentation.ts (excerpt)
import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel({
    serviceName: "storefront",
    instrumentationConfig: {
      fetch: { propagateContextUrls: [/reviews\.internal/] },
    },
  });
}
```

[[CODE 4-tracing/instrumentation.ts]]

`@vercel/otel` configures the OpenTelemetry SDK for both the Node.js and Edge runtimes, and exports spans to the OTLP endpoint named in the standard `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable, using protobuf unless `OTEL_EXPORTER_OTLP_PROTOCOL` says otherwise. Despite its name, it doesn't require Vercel hosting. The `propagateContextUrls` option matters for distributed traces. By default, `@vercel/otel` only sends the `traceparent` header to the application's own deployment URLs, so that trace IDs don't leak to third parties. We have to list internal services explicitly.

Next.js's default spans cover the framework's work, not our own code. Custom spans fill that gap, and the data access layer from Chapter 4 is the place to add them, because every query passes through it. Example `4-tracing/` gives the data layer one small helper:

```ts
// lib/data/tracer.ts (excerpt)
const tracer = trace.getTracer("storefront-data");

export function traced<T>(name: string, attrs: Record<string, string>,
  fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    span.setAttributes(attrs);
    try {
      return await fn(span);
    } catch (e) {
      span.setStatus({ code: SpanStatusCode.ERROR,
        message: String(e) });
      throw e;
    } finally {
      span.end();
    }
  });
}
```

[[CODE 4-tracing/lib/data/tracer.ts]]

```ts
// lib/data/reviews.ts (excerpt)
return traced("getReviews", { "product.id": productId }, async () => {
  const res = await fetch(`http://localhost:4001/reviews/${productId}`);
  if (!res.ok) throw new Error(`reviews service ${res.status}`);
  return (await res.json()) as Review[];
});
```

[[CODE 4-tracing/lib/data/reviews.ts]]

`startActiveSpan` makes the new span the current one while the callback runs, so the `fetch` span Next.js creates inside `getReviews` becomes its child, and the `traceparent` header sent to the reviews service carries that span's ID. A failure marks the span as an error before the exception continues. The `finally` block ends the span even when the call throws, because the tracer never exports a span that doesn't end.

> **Tip.** Create spans only in code that runs while handling a request. Next.js documents that spans created while `instrumentation.ts` loads, or inside `register`, don't join any request's trace. The SDK doesn't record spans started before the tracer provider is registered.

### Reading a Request Waterfall

Figure 7.2 shows one trace from example `4-tracing/` for a product page request.

[[FIGURE 7.2]]

The example sends its spans to a small local receiver that stands in for a tracing backend, and the reviews service is a separate process that reports its own spans. Reading the trace from the top, the request span `GET` hands over to `GET /product/[id]`, which lasts 625 ms, almost all of it in `render route (app) /product/[id]`. The `start response` span at 9 ms is the static shell being sent, so TTFB on this request was decided in the first 9 ms. `getReviews` and `getRecommendations` start after that point, inside their `<Suspense>` boundaries, and run in parallel. Under `getReviews`, the `fetch` span to the reviews service has two children that the reviews service reported itself, `GET /reviews/:id` and `SELECT reviews`, so the trace crosses from one process to the other. `getRecommendations` takes 601 ms and sets the length of the whole response. It doesn't delay anything the reader sees first, because it streams into its own boundary.

Three patterns in a trace point at the most common server-side problems.

- **A staircase:** spans that run one after another when they don't depend on each other. This is Chapter 4's request waterfall, seen from the server. Start the independent requests together, or move them into separate `<Suspense>` boundaries so they stream independently
- **A long span above the first boundary:** any work that runs before the shell is sent adds directly to TTFB. In a trace, it's work that finishes before the response's first byte. Move it into a boundary, or cache it
- **A missing span:** a function wrapped in `"use cache"` doesn't run its body on a cache hit, so its custom span doesn't appear. A product page trace with no `getProduct` span means the cache answered. Example 4's three product page requests had no `getProduct` span at all, because the product was cached at build time. A trace with a long `getProduct` span on every request isn't caching at all

Server Actions appear in traces too, as `POST` requests to the page that hosts the form. In example 4, the Add to wishlist action produced a root span named `POST`, a child named `POST /product/[id]`, and under it the action's own custom span. Nothing in Next.js's spans names the action, so a custom span inside each action, like the data layer's, is what makes one action distinguishable from another in a trace. A slow action is usually slow for the same reasons as a slow page, and the transaction and invalidation steps from Chapter 5 show up as their own spans when they're instrumented.

### Connecting Traces to Everything Else

A trace on its own answers questions about one request. It becomes more useful when error reports and field data link to it. Two links are worth building.

- **Errors to traces:** when `onRequestError` reports a server error, include the active trace ID with it. The error report then leads straight to the waterfall of the request that failed, including the slow or failing downstream call
- **Field data to traces:** a field report says that a reader saw a 4-second LCP. If the document response carries its trace ID, the reporting code can send it with the metric, and we can match the slowest field reports with the server traces that produced them

The `Server-Timing` response header is the standard way to pass server information to page scripts. The browser exposes it through the Navigation Timing API's `serverTiming` entries. Example 4 sets it in `proxy.ts`, which runs inside the request's trace:

```ts
// proxy.ts (excerpt)
const res = NextResponse.next();
const ctx = trace.getActiveSpan()?.spanContext();
if (ctx) {
  res.headers.set("Server-Timing",
    `traceparent;desc="00-${ctx.traceId}-${ctx.spanId}-01"`);
}
return res;
```

[[CODE 4-tracing/proxy.ts]]

On every load in the example, the trace ID the page read from `performance.getEntriesByType("navigation")[0].serverTiming` matched a trace in the collector that held the page's render span.

At high traffic, recording every span of every request is expensive. Tracing systems sample. **Head sampling** decides at the start of a request whether to record it, for example one request in a hundred, which is cheap but misses most errors. **Tail sampling**, done in a collector, keeps every trace until the request finishes and then decides, so it can keep all errors and all slow requests and only a sample of the rest. For a team investigating the slow tail of its latency distribution, tail sampling keeps the traces that matter.

## Error Analysis

Chapter 5 divided errors into two kinds. Expected failures, such as invalid input or a duplicate review, come back from a Server Action as values, and the form shows them. Unexpected failures are thrown, reach the nearest `error.tsx`, and show the reader a fallback with a `digest`. Chapter 5 also noted that a thrown error is useless unless someone on the team sees it. This section builds that reporting, and shows how a report with enough context shortens debugging.

### Where Errors Come From

A Next.js application can throw in three places, and each one needs its own reporting path. Missing one of them is the most common gap in error reporting, because nothing fails visibly when an error goes unreported.

- **On the server:** while rendering a Server Component, running a Route Handler or a Server Action, or in `proxy.ts`. Next.js calls `onRequestError` in `instrumentation.ts` for each of these
- **In the browser, uncaught:** an error in an event handler, a rejected promise nobody handled, an error during rendering that no boundary of ours catches, or a hydration mismatch React recovered from. These reach the browser's global error handling
- **In the browser, caught by our own `error.tsx`:** an error during rendering of a Client Component inside a route segment with an error boundary. React catches it, and the boundary shows its fallback

The server path needs one function, extended from Chapter 5:

```ts
// instrumentation.ts (excerpt)
export const onRequestError: Instrumentation.onRequestError = async (
  err, request, context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { record } = await import("./lib/record");
  const { serialize } = await import("./lib/serialize");
  await record("errors.ndjson", {
    source: "server",
    error: serialize(err),
    digest: (err as { digest?: string }).digest,
    path: request.path,
    route: context.routePath,
    routeType: context.routeType,
  });
};
```

[[CODE 5-error-reporting/instrumentation.ts]]

`record` stands in for an error tracker's client. The runtime check and the dynamic imports keep Node.js-only code, such as file access, out of the Edge build of `instrumentation.ts`. Example 4's version also records `trace.getActiveSpan()?.spanContext().traceId`, and the trace ID it recorded for a failing render matched a trace in the collector, so the active span is available inside `onRequestError`. `context.routeType` says whether the error came from rendering (`render`), a Route Handler (`route`), a Server Action (`action`), or the proxy (`proxy`), which is the first thing to know when triaging it. The function must await its work, because Next.js doesn't wait for anything it doesn't return.

The uncaught browser path takes two listeners in `instrumentation-client.ts`, which runs before hydration, so it catches errors from the start of the page load:

```ts
// instrumentation-client.ts (excerpt)
window.addEventListener("error", (e) => {
  sendError({ source: "client", error: e.error ?? e.message });
});
window.addEventListener("unhandledrejection", (e) => {
  sendError({ source: "client", error: e.reason });
});
```

[[CODE 5-error-reporting/instrumentation-client.ts]]

The third path is the one teams miss. In a production build, Next.js logs an error caught by our own `error.tsx` to the console and nothing else. It doesn't reach the global `error` event, because from React's point of view it was handled. Example `5-error-reporting/` triggered a render error inside a segment with an `error.tsx` five times, and a listener set up as above received none of them. The boundary has to report them itself:

```tsx
// app/product/[id]/error.tsx ("use client", excerpt)
useEffect(() => {
  sendError({ source: "boundary", error, digest: error.digest });
}, [error]);
```

[[CODE 5-error-reporting/app/product/[id]/error.tsx]]

The same render error in a segment with no `error.tsx` anywhere above it reached the global listener every time, because Next.js passes on errors caught only by its built-in boundary as uncaught. So an application with no error boundaries of its own is fully covered by the listener, and each `error.tsx` it adds creates a gap unless the boundary reports.

The `digest` ties the two sides together. When a Server Component throws, `onRequestError` reports the full error on the server, and the browser's boundary receives a replacement message with the same `digest`. In example 5, the server report carried the original message, and the boundary's carried React's minified error #441, with matching digests every time. The boundary's report then shouldn't count as a second error. It records that a reader saw the fallback, and the digest leads to the server report with the real message and stack. An error caught by the boundary without a digest happened in the browser, and its report is the only one.

### Stack Traces That Point at Source Code

A stack trace from a production bundle points at minified code, such as `at o (.../_next/static/chunks/173pmwvwkc0md.js:1:185)` from example 5, which tells us nothing. Source maps translate those positions back to the original file, line, and function. Next.js doesn't generate browser source maps for production builds by default, so that the original source isn't published along with the bundle. The `productionBrowserSourceMaps` option generates them and serves them next to the JavaScript files, which publishes the source.

Most teams want the maps without publishing them. Error-tracking services handle this with a build step that uploads the maps to the service and removes them from the deployed output, so the service can translate stack traces while browsers never receive the maps. A self-hosted setup can build with the maps, copy them to private storage keyed by release, and delete them from the public output. Either way, the release identifier from section 5 is what tells the translation step which set of maps to use, which is one more reason to attach it to every report.

### Context Turns an Error into a Reproduction

An error message and a stack trace say what failed and where. Fixing it usually needs to know how the reader got there. A good error report carries the context that makes the failure reproducible.

- **Release and route:** which build, and which page template. An error that started with one release, on one route, has a short list of suspects
- **Environment:** browser, device class, and locale. A crash that only happens in one browser engine, or only with one locale, points at the cause immediately
- **Breadcrumbs:** the last few things that happened before the error, such as navigations, clicks, and failed requests. `onRouterTransitionStart`, exported from `instrumentation-client.ts`, reports each App Router navigation as it starts, which gives us navigation breadcrumbs without extra code
- **The trace ID:** for server errors, the link to the request's waterfall from section 8

What a report should not carry matters as much. Form contents, full URLs with query strings, and anything the reader typed can contain personal data. Record the route pattern instead of the URL, and the names of fields instead of their values.

### Grouping, Counting, and Choosing

A popular page with one bug can produce thousands of reports an hour. Nobody can read them one at a time. Error tracking works by grouping reports that share a cause, usually by error type, the message with its variable parts removed, and the top frames of the stack, and then counting each group.

Grouping makes it possible to answer the questions that decide priority. How many readers did this group affect, not how many reports did it produce? A single reader stuck in a retry loop can produce a thousand reports. Which routes and releases does it appear on? Did it start with a deploy, or has it always been there? What does the reader experience when it happens: a blank page from `global-error.tsx`, a section fallback with a retry button, or nothing visible at all? An error that breaks checkout for 2% of readers matters more than one that fails silently in an analytics script for 40%.

This is where error analysis makes debugging easier. Without reporting, a bug arrives as a support ticket that says the page broke, with no route, no release, and no way to reproduce it. With reporting, it arrives as a group that says a `TypeError` reading `price` of `undefined` started with release 214, happens only on `/product/[id]`, only for products whose variants array is empty, mostly in the size picker, right after the reader selected a size. That report already says how to reproduce the bug, which is most of the work of debugging it.

> **Tip.** Expected failures from Chapter 5, such as validation errors and duplicate reviews, aren't errors and shouldn't be reported as errors. They are still worth counting as metrics. A sudden rise in validation failures on the review form after a release often means the client-side limits and the server's schema drifted apart, which is a bug even though nothing threw.

## Monitoring and the Observability Workflow

The previous sections each produce a stream of data: Web Vitals from readers' browsers, traces from the server, and error reports from both. Monitoring means watching those streams all the time, so the team notices a regression when it starts rather than when a reader complains.

### What to Watch

A small set of signals covers most of what matters for a product like ours.

- **Core Web Vitals at the 75th percentile:** per route and per device class, from our own field data, with soft navigations reported separately
- **Server rate, errors, and duration:** for each route and each Server Action, the number of requests, the share that failed, and the 95th percentile latency. Traces provide all three
- **Error groups per release:** new groups, and groups whose count rose after a deploy
- **One or two outcomes:** a measure the business cares about, such as the share of add-to-cart actions that succeed. Technical signals can all look healthy while an outcome falls, and the outcome is what the reader experiences

Dashboards show these over time, and the most useful view on each one is the same chart split by release, so that the effect of a deploy is visible as a step.

### Alerts

An alert interrupts a person, so it should fire only when readers are affected and someone needs to act. Two rules keep alerts useful. Alert on symptoms, such as error rate, latency, or a Web Vital crossing its threshold, rather than on causes, such as a server's CPU usage, which may or may not affect anyone. And alert on a sustained change over a window, for example the product page's error rate above 1% for ten minutes, rather than on a single spike, which the noise in field data produces all the time.

Every alert should link to the data that explains it: the dashboard for the signal, the error group, or a sample of slow traces. An alert that says something is wrong without pointing anywhere is no more useful than the support ticket.

### The Workflow

Each section of this chapter added a source of data or a tool. As in Chapters 3 to 6, they come together as a short sequence of steps, in order, for any problem a reader can feel, whether it's slowness or a failure.

1. **Detect.** A field signal shows the problem: a Core Web Vital at the 75th percentile crossing its threshold, an alert on error rate, or a new error group after a release. Start from what readers experienced, not from what a lab tool flagged.
2. **Segment.** Narrow it down before looking at code. Which route, which device class, which navigation type, which locale, which release? A problem that appears on one route, on mobile, since one deploy, already narrows the search to a few changes.
3. **Reproduce.** Recreate the conditions in the lab: a production build, the same route, CPU and network throttling calibrated to the affected device class, the reader's locale. Confirm that the lab now shows the problem, using the field values as the target, as section 6 described.
4. **Explain.** Use the tool that matches the kind of problem. For loading, read the LCP breakdown and a performance trace. For interactions, read the INP breakdown and its long animation frames, plus the hydration measurements when the first tap is slow. For TTFB and slow streaming, read a server trace. For a failure, read the grouped error report and its context.
5. **Fix and guard.** Make the change, confirm it in the lab, and then confirm it in the field, because the problem showed up in the field. Add a guard so it can't return silently: a performance budget in CI, an alert threshold, a test for the error's reproduction recipe.

[[FIGURE 7.3]]

Steps 1 and 5 use field data. Steps 3 and 4 use the lab and the server's traces. That split gives this chapter's pattern its name: **field finds, lab explains.** It joins Chapter 3's server shell, client islands, Chapter 4's one page, many clocks, Chapter 5's every action is a front door, and Chapter 6's structure first, memoize last.

The first four patterns describe how to build the product page. This one describes how to check whether we built it well, for the readers we have. Every earlier chapter made claims about speed and reliability, backed by measurements on a laptop. This chapter's workflow is how a team keeps those claims true after the page ships, as the code, the data, and the readers change.

> **Tip.** Write down the field value that started an investigation, and check the same value two weeks after the fix ships. Field data changes slowly, because percentiles need enough visits to move and old cached pages take time to disappear. A fix that looks complete in the lab and changes nothing in the field fixed something other than what readers were experiencing.

## Case Study: The Product Page That Was Only Slow in Production

### Before

The product page from the previous chapters loads in well under a second on a developer's laptop: its LCP in a local production build, unthrottled, is 772 ms. The team's dashboard shows one number per metric for the whole site, and every one of them is in the good range. Support, meanwhile, has received a handful of complaints that the page jumps while loading, that the size picker sometimes ignores taps, and that the reviews on a few products never appear. Nobody on the team can reproduce any of them.

Over the last two months, several reasonable changes went in:

```tsx
// app/(before)/before/product/[id]/page.tsx (excerpt)
<Suspense fallback={<p>Loading product…</p>}>
  <ProductHeroWithPrice product={product} />
</Suspense>
```

[[CODE 6-case-study-product-page/app/(before)/before/product/[id]/page.tsx]]

```tsx
// components/PriceTag.tsx (excerpt)
return <span className="price">{price.toLocaleString(undefined, {
  style: "currency", currency,
})}</span>;
```

[[CODE 6-case-study-product-page/components/PriceTag.tsx]]

```tsx
// app/(before)/layout.tsx (excerpt)
<Script src="/chat-widget.js" strategy="beforeInteractive" />
```

[[CODE 6-case-study-product-page/app/(before)/layout.tsx]]

A developer combined the hero with the regional price, which is request-time data, so the whole hero, including the product photo and the product name, moved into a `<Suspense>` boundary that waits about 600 ms for the pricing service. The price tag formats with the runtime's default locale, so the server renders en-US and a German reader's browser renders de-DE. Someone added a support chat widget to the root layout and set it to load before the page becomes interactive, so that it would be available early. Its start-up does about a second of main-thread work, and it then refreshes a presence indicator with a 300 ms task every half second. The team's error reporting is a `window` `error` listener. The reviews section has its own error boundary, made with `catchError` as in Chapter 5, and the reviews service times out for products with more than 500 reviews.

### Task

Find and fix what makes the product page slow and unreliable for real readers, using section 10's workflow, so that:

1. LCP, INP, and CLS are good at the 75th percentile in every segment of device and locale, not only overall.
2. Every error a reader can see, including those caught by an error boundary, appears in error reporting with its route and release.
3. Each fix is backed by a field segment that showed the problem and a lab reproduction that explained it.
4. A guard exists for each problem, so that it can't return without someone noticing.

Before reading on, write down which segments you would look at first, and what you would expect the LCP breakdown and the INP breakdown to show for each of the changes above.

### Sample After

The example simulates the field with 40 visits to each version. Half are on a phone with the CPU slowed four times, two thirds of those on Lighthouse's slow 4G profile and a third on a slower 3G-class link. The other half are on an unthrottled desktop. Half the visits use an English browser and half a German one, and every fifth visit opens a product with more than 500 reviews. Each visitor taps the size picker soon after the page first paints, taps again a little later, and leaves once the page has loaded. The app's own reporting code collects everything below.

**Detect and segment.** The team replaces its single number per metric with a Client Component that imports the `web-vitals/attribution` build and reports each metric with the route, the release, the locale, a device class, and the LCP and INP breakdowns. The overall values stay in the good range, which is why the dashboard looked healthy, but the segments separate four problems that the overall numbers hid.

- **LCP on mobile:** the median resource load delay is 632 ms, nearly as large as the download itself. The photo is being discovered late on every load
- **INP:** the slowest segment, desktop readers with a German browser, sits at 248 ms, above the 200 ms threshold. Of the 39 visits that reported INP, 19 had an interaction slower than 100 ms. In those, the median input delay was 183 ms against 4 ms of processing, and the long animation frames attached to all 19 name `chat-widget.js`
- **Errors:** every German visit produced one `Minified React error #418` report, 1,000 per 1,000 visits. The group had been in the error reports since the price tag shipped, and nobody had looked at it
- **What isn't there:** the reviews fallback appeared on 8 visits, and error reporting has no record of any of them

**Reproduce and explain.** Each segment becomes a lab session. A throttled trace of the product page shows the hero image request starting only after the pricing boundary streams in. Loading the page with the browser set to German reproduces the price mismatch, and the second render of the boundary that follows it. A performance trace of an early tap shows the chat widget's task running when the tap arrives, so the size picker's handler waits for it. The missing review errors need no reproduction: section 9 explains them. The data comes from a Server Component, and the app reports neither server errors nor errors its own boundaries catch.

**Fix.** The hero photo and the product name move back into the static shell, and only the price stays inside a boundary, with a skeleton the same size as the price it replaces:

```tsx
// app/(after)/after/product/[id]/page.tsx (excerpt)
<ProductHero product={product} />
<section>
  <h1>{product.name}</h1>
  <Suspense fallback={<PriceSkeleton />}>
    <RegionalPrice product={product} />
  </Suspense>
```

[[CODE 6-case-study-product-page/app/(after)/after/product/[id]/page.tsx]]

The server resolves the locale from the reader's `Accept-Language` header and passes it to the price tag, which formats with it explicitly, so the server and the browser produce the same string. The chat widget's script now loads when a reader presses the chat button, which keeps its work out of the first seconds entirely. The reviews boundary reports what it catches, with the `digest`, and `instrumentation.ts` gains an `onRequestError` function, which records the timeout with its route on the server.

**Guard.** A CI budget runs the throttled mobile lab measurement from example 1 against the product page and fails above an LCP of 2.5 seconds. A test renders the price tag under two locales and compares the server and client output. An alert fires when the product page's 75th percentile INP in any device and locale segment crosses 200 ms for a day, or when its error rate crosses 1% for ten minutes.

Table 7.4 shows the result, from the same simulated field run against both versions of this chapter's `6-case-study-product-page/` example:

| Measurement | Before | After |
|---|---|---|
| LCP, 75th percentile, mobile | 1,380 ms | 1,160 ms |
| Median LCP resource load delay, mobile | 632 ms | 189 ms |
| INP, 75th percentile, mobile | 96 ms | 24 ms |
| INP, 75th percentile, slowest segment | 248 ms | 24 ms |
| CLS, 75th percentile, desktop | 0.052 | 0 |
| Hydration mismatches per 1,000 German visits | 1,000 | 0 |
| Reviews failures shown to readers, and reported | 8 shown, 0 reported | 8 shown, 8 reported |

The shift on desktop came from the hero's boundary. Its fallback was one line of text, and the hero that replaced it moved the size picker and the reviews. At 0.052 it stayed in the good range, so no threshold would have flagged it, but it's what readers described as the page jumping. One caveat about the mobile LCP rows. On the slowest mobile visits, the first tap came before the reporting code had loaded, and the web-vitals library reported no LCP for those visits, so those rows cover the 13 of 20 mobile visits per version that did. Field data tends to under-represent the slowest visits, and this is one of the reasons.

None of the fixes was large, and none needed a new library. The data made them possible. Each problem was in the field data for weeks, in segments nobody had split out or in reports nobody collected, and each one took a single lab session to explain once someone started from the right segment.

## Conclusion

This chapter started from the gap between the laptop and the reader. Lab data, the kind every earlier chapter used, is precise and explainable but describes one device on one network. Field data describes the readers we have but arrives noisy and without causes attached. The resolution was to give each its job: field finds, lab explains.

Sections 2 to 4 followed a page load from the first byte to the reader's slowest interaction. TTFB measures the server's first response, FCP the first paint, LCP the content the reader came for, CLS stability, and INP responsiveness. TTI's old role is now split between TBT in the lab and INP in the field. Section 5 collected those metrics from real readers, segmented them, and reported soft navigations separately. Section 6 reproduced field conditions in the lab and read traces with the same breakdowns the field data provides. Section 7 measured hydration and showed how a mismatch re-renders part of the page for some readers without anyone on the team seeing it. Section 8 followed a request across services with OpenTelemetry, and section 9 made sure every error a reader can see reaches the team with enough context to reproduce it. Section 10 combined all of it into monitoring and a five-step workflow.

With this chapter, the product page has an answer to each question this book has asked about it. Chapter 3 decided where its code runs, Chapter 4 when its data arrives, Chapter 5 what must be true before that data changes, Chapter 6 how much client work each change causes, and this chapter how we know, for real readers on real devices, that all of it still holds.

So far, one team has built and measured one product page. Chapter 8, Production Architecture, Security, and Resilience, scales that up to many teams shipping thousands of features into the same system. It covers testing an application made of Server Components, Client Components, and Server Actions, keeping the frontend and backend in one monorepo, and drawing service and team boundaries that let teams grow without blocking each other. It also covers the security model of code that runs on both sides of the network and how to analyze its threats. Finally, it covers failure recovery, graceful degradation, and reliability engineering, the guardrails that keep a large system safe to deploy and easy to run. The monitoring and error reporting from this chapter are where that work starts, because a team can only make a system reliable once it can see when the system isn't.
