"""Chapter 7 front matter and end-of-chapter pedagogy (inline `code` and
**keywords** are parsed by build_chapter_07.py). From Chapter 7 on, the
book has no Questions section and no Key Terms section (author's decision,
2026-11-01)."""

CHAPTER_NUMBER = 7
CHAPTER_NAME = "Performance Auditing and Observability"

INTRODUCTION = [
    "Every measurement so far in this book came from a production build on one machine. Readers use the application on thousands of other machines, over networks we don't control, and they hit errors we never reproduced. This chapter is about measuring what they experience, consistently, and using those measurements to make the product work well on every device. We will look at the metrics that describe a page load and an interaction, collect them from real readers, reproduce problems in the lab, analyze hydration, follow a request across services with distributed tracing, and report every error a reader can see.",
    "By the end of this chapter, we will be able to explain what TTFB, FCP, LCP, CLS, and INP measure and what happened to TTI, break a poor LCP or INP into the parts that point at its cause, collect segmented field data from a Next.js 16 application, find and fix hydration mismatches, set up OpenTelemetry tracing with custom spans, and make sure errors from the server, from the browser, and from our own error boundaries all reach the team. We will also be able to follow a five-step workflow, from detecting a problem in the field to guarding against its return.",
    "Every example in this chapter is in the book's repository, https://github.com/reynoldadade/605, under the `chapter 7/` folder. Each one is a Next.js 16 application with an `npm run measure` script that builds it, drives it in a headless browser with the same throttling and the same metrics library that field code uses, and records the results. The listings in the text keep to the lines under discussion, and the line below each one names the file that holds the complete version, with a link to it. Each example's README lists the commands and the results we measured. Where an API differs from material written for Next.js 15 or earlier tooling, a Note box says what changed.",
]

STRUCTURE = [
    "Why Measurement Needs a Method",
    "The Life of a Page Load",
    "Loading Metrics: TTFB, FCP, and LCP",
    "Responsiveness: INP, and What Happened to TTI",
    "Collecting Field Data",
    "Profiling in the Lab",
    "Hydration Analysis",
    "Distributed Tracing",
    "Error Analysis",
    "Monitoring and the Observability Workflow",
    "Case Study: The Product Page That Was Only Slow in Production",
    "Conclusion",
    "Exercises",
]

POINTS_TO_REMEMBER = [
    "Lab data is repeatable and explainable but describes one device; field data describes real readers but arrives without causes",
    "Core Web Vitals are LCP, INP, and CLS, judged at the 75th percentile of visits, separately for mobile and desktop",
    "Read percentiles, never averages, and segment before aggregating",
    "LCP breaks into time to first byte, resource load delay, resource load duration, and element render delay, and the largest part points at the fix",
    "Keep the LCP element in the static shell and load it eagerly with high fetch priority",
    "INP breaks into input delay, processing duration, and presentation delay; hydration and third-party scripts show up as input delay",
    "Lighthouse 10 removed TTI; TBT covers its lab role and INP its field role",
    "From Next.js 16.4, `useReportWebVitals` reports soft navigations separately, with `navigationType` set to `soft-navigation`",
    "`useReportWebVitals` reports metrics without attribution; import the `web-vitals/attribution` build to collect the breakdowns",
    "A hydration mismatch makes React render the nearest `<Suspense>` boundary again on the client and report a recoverable error",
    "Format locale-dependent values with an explicit locale chosen on the server",
    "OpenTelemetry custom spans in the data access layer make our own code visible next to Next.js's default spans",
    "Errors caught by our own `error.tsx` never reach the global `error` event; the boundary must report them",
    "Field finds, lab explains: start from a field signal, reproduce and explain it in the lab, then confirm the fix in the field",
]

SOLVED_EXERCISES = [
    {
        "problem": "A product page's field data shows a 75th percentile LCP of 3.6 seconds on mobile. The attribution breakdown's median parts are: time to first byte 300 ms, resource load delay 2,100 ms, resource load duration 900 ms, element render delay 300 ms. The hero image is 180 KB. A teammate proposes compressing it to 90 KB. Will that fix the problem?",
        "solution": "Mostly not. Load duration is 900 ms, and halving the file would save at most a few hundred milliseconds of it. The largest part is resource load delay: the browser starts downloading the image more than two seconds after the first byte, so it discovers the image late. Check whether the hero sits inside a `<Suspense>` boundary that waits for request-time data, whether it is lazy-loaded, or whether it is set as a CSS background. Moving it into the static shell and loading it with `loading=\"eager\"` and `fetchPriority=\"high\"` addresses the largest part. In `1-load-metrics/`, an 800 ms boundary around the hero showed up as 814 ms of load delay.",
    },
    {
        "problem": "A team's dashboard shows INP at the 75th percentile as 140 ms overall, but support reports that the size picker sometimes ignores taps on cheap phones. How should the team investigate with the field data it has, and what would it expect the INP breakdown to show if a third-party script is the cause?",
        "solution": "Segment first. Compute INP per route and per device class, and look at the product page on mobile, where the problem was reported; an overall value hides a poor segment. Then look at the attribution for the slow interactions. A third-party script running during the first seconds shows up as a long input delay, with the script's URL in the long animation frames attached to the interaction. Processing duration would be short, because the size picker's own handler is cheap. In the case study, the long animation frames named the chat widget's script.",
    },
    {
        "problem": "A Client Component renders `new Date(order.placedAt).toLocaleDateString()`. Readers in Germany see the date flicker from 11/3/2026 to 3.11.2026 shortly after the page loads, and the error tracker shows a growing group of minified React error #418 reports. Explain what is happening and fix it.",
        "solution": "The server formats the date with its own locale, and the browser formats it with the reader's during hydration, so the text differs and React reports a hydration mismatch. React then renders the nearest `<Suspense>` boundary again on the client, which causes the flicker and costs main-thread time. The error group is those recoverable errors reaching the global error listener. Choose the locale on the server, for example from the `Accept-Language` header, pass it to the component as a prop, and format with `Intl.DateTimeFormat(locale, options)`, so both sides produce the same string.",
    },
    {
        "problem": "The reviews section of the product page has its own error boundary. The error tracker shows no review errors at all, yet several readers have written to support about a reviews retry button. The app has a `window` `error` listener in `instrumentation-client.ts`. What is missing?",
        "solution": "Two reporting paths. The reviews data comes from a Server Component, so the original error happens on the server, where only an `onRequestError` function in `instrumentation.ts` sees it. In the browser, the section's boundary catches the error, and Next.js only logs caught errors to the console, so the global listener never receives it. Add `onRequestError` for the server side, and report from the boundary in an effect, including the `digest`, which matches the boundary's report to the server's. In `5-error-reporting/`, the global listener received 0 of 5 errors caught by an `error.tsx`.",
    },
]

MCQS = [
    {
        "question": "Which three metrics are the Core Web Vitals?",
        "options": [
            "TTFB, FCP, and LCP",
            "LCP, INP, and CLS",
            "FCP, TTI, and CLS",
            "LCP, TBT, and INP",
        ],
        "answer": "B",
    },
    {
        "question": "A page passes a Core Web Vital when the metric is good at which point of the distribution of visits?",
        "options": [
            "The average",
            "The median",
            "The 75th percentile",
            "The 99th percentile",
        ],
        "answer": "C",
    },
    {
        "question": "An LCP image's largest part is resource load delay. Which change is most likely to help?",
        "options": [
            "Compressing the image further",
            "Moving the image out of a `<Suspense>` boundary that waits for request-time data",
            "Adding `React.memo` to the component that renders it",
            "Switching the image to a CSS background",
        ],
        "answer": "B",
    },
    {
        "question": "Which part of an interaction's latency does hydration usually increase?",
        "options": [
            "Input delay",
            "Processing duration",
            "Presentation delay",
            "Time to first byte",
        ],
        "answer": "A",
    },
    {
        "question": "What replaced Time to Interactive in Lighthouse's performance score?",
        "options": [
            "Interaction to Next Paint",
            "First Input Delay",
            "Total Blocking Time",
            "Speed Index",
        ],
        "answer": "C",
    },
    {
        "question": "From Next.js 16.4, how does `useReportWebVitals` report metrics for a client-side navigation in a browser that supports soft navigations?",
        "options": [
            "It doesn't; only the first page load is measured",
            "As separate LCP, FCP, CLS, and INP values with `navigationType` set to `soft-navigation`",
            "As a new TTFB value for each navigation",
            "Combined with the first page's values",
        ],
        "answer": "B",
    },
    {
        "question": "In a production build, what happens when a Client Component renders different text in the browser from the server's HTML?",
        "options": [
            "The page shows an error overlay",
            "React keeps the server's text and ignores the difference",
            "React renders the nearest `<Suspense>` boundary again on the client and reports a recoverable error",
            "Next.js reloads the page",
        ],
        "answer": "C",
    },
    {
        "question": "Why does `@vercel/otel` need `propagateContextUrls` for an internal reviews service?",
        "options": [
            "Without it, the reviews service can't be called",
            "By default it sends the `traceparent` header only to the application's own deployment URLs",
            "It turns on tracing for `fetch`",
            "It sets the service name",
        ],
        "answer": "B",
    },
    {
        "question": "A product page trace has no span for `getProduct`, a function wrapped in `\"use cache\"` that contains a custom span. What is the most likely reason?",
        "options": [
            "The tracer provider wasn't registered",
            "The span was created inside `register`",
            "The result came from the cache, so the function body didn't run",
            "The span was sampled out by tail sampling",
        ],
        "answer": "C",
    },
    {
        "question": "Which errors does a `window` `error` listener in `instrumentation-client.ts` miss in a production build?",
        "options": [
            "Errors thrown in event handlers",
            "Hydration mismatches React recovered from",
            "Render errors caught by the app's own `error.tsx`",
            "Render errors with no `error.tsx` above them",
        ],
        "answer": "C",
    },
]

ASSIGNMENTS = [
    "Run `npm run measure` in `1-load-metrics/`. Then add a fourth version that keeps the hero in the shell but sets it as a CSS background image instead of using `next/image`, and measure it the same way. Report its LCP at the 75th percentile and its largest LCP part, and explain the difference from the eager version.",
    "Extend `2-rum-collector/` so that every report carries a device class and the LCP and INP breakdowns from the `web-vitals/attribution` build. Add a segment to `scripts/report.mts` for mobile soft navigations, and run the measurement with the CPU throttled four times. Which metric changes most between hard and soft navigations, and why?",
    "In `6-case-study-product-page/`, add a slow recommendations section to the after version, in its own `<Suspense>` boundary, and trace it with a custom span as `4-tracing/` does. Run the simulated field again and confirm, using the traces and the field data, that the new section doesn't change LCP or INP. Then add a CI check that fails if the product page's lab LCP on the throttled mobile profile goes above 2.5 seconds.",
]

FIGURES = {
    "7.1": ("fig_7_1_page_load_timeline.png", "The life of a page load on a streamed product page, with each metric placed on the timeline"),
    "7.2": ("fig_7_2_trace_waterfall.png", "One product page request as a trace: the Next.js server, the reviews service, and the point where the static shell was sent"),
    "7.3": ("fig_7_3_observability_workflow.png", "The observability workflow: field finds, lab explains"),
}

TABLE_CAPTIONS = [
    "Core Web Vitals and supporting metrics, with their thresholds",
    "LCP of the same product page built three ways, on a throttled mobile profile",
    "The product island in two locales, before and after the locale fix",
    "The product page before and after, measured on the 6-case-study-product-page example",
]

REPO_BLOB = "https://github.com/reynoldadade/605/blob/master/chapter%207/"
REPO_TREE = "https://github.com/reynoldadade/605/tree/master/chapter%207"
