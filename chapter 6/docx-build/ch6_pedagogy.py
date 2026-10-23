"""Chapter 6 front matter and end-of-chapter pedagogy (inline `code` and
**keywords** are parsed by build_chapter_06.py)."""

CHAPTER_NUMBER = 6
CHAPTER_NAME = "React Compiler and Modern Optimization"

INTRODUCTION = [
    "Chapters 3 to 5 moved rendering, data fetching, and every rule about changing data to the server. What is left in the browser is a set of small Client Components, and this chapter is about keeping their work small as a product grows. We will see what a render costs, what the React Compiler does to our components at build time, which code it can and can't optimize, and which decisions about state, lists, and slow updates no compiler can make for us.",
    "By the end of this chapter, we will be able to read the compiler's output and explain what it caches, write components that follow the Rules of React so the compiler can optimize them safely, find the components it skipped, and use a five-step workflow to make a slow interaction fast: measure, locate, move, memoize, and guard. We will also be able to explain why the compiler applies only to client code in a Next.js application.",
    "Every example in this chapter is in the book's repository, https://github.com/reynoldadade/605, under the `chapter 6/` folder. Most are Next.js 16 applications that build themselves twice, with the compiler on and off, and measure the difference in a headless browser with `npm run measure`. The listings in the text keep to the lines under discussion, and the line below each one names the file that holds the complete version, with a link to it. Each example's README lists the commands and the results we measured. Where an API differs from material written for Next.js 15 or React 18, a Note box says what changed.",
]

STRUCTURE = [
    "Why Performance Comes Back",
    "What a Render Costs",
    "Compiler Fundamentals",
    "Automatic Memoization",
    "Compiler-Friendly Coding",
    "State Architecture",
    "Render Efficiency",
    "Avoiding Performance Traps",
    "An Optimization Workflow",
    "Case Study: Untangling the Product Explorer",
    "Conclusion",
    "Questions and Exercises",
]

POINTS_TO_REMEMBER = [
    "A Client Component renders again when its own state changes, when a context it reads changes, or when its parent renders",
    "Server Components never re-render in response to browser state; only a new request runs them again",
    "Measure production builds on a throttled CPU; development builds and fast laptops hide or inflate the cost",
    "The React Compiler runs at build time and gives each component instance a cache of guarded blocks keyed on the values they read",
    "Next.js applies the compiler to the client bundle only, so its benefit lands in Leaf Client Components",
    "Cached JSX elements let React skip unchanged children, which replaces most uses of `React.memo`",
    "The compiler skips a component it can prove breaks the Rules of React, without reporting it in the build output",
    "Impure renders and mutations through method calls compile anyway and can freeze or go stale",
    "The `recommended-latest` preset of `eslint-plugin-react-hooks` 7 enforces the rules the compiler relies on",
    "Calculate derived values during render instead of copying them into state with an effect",
    "Split a context by how often each part changes, and keep its values stable",
    "Bound the DOM with pagination or virtualization; memoization never speeds up the first render",
    "`useDeferredValue` and transitions change when work happens, not how much work there is",
    "Structure first, memoize last: fix where state lives before relying on the compiler",
]

SOLVED_EXERCISES = [
    {
        "problem": "A page-level Client Component holds a search query in state and renders a header, a gallery, a list of 40 reviews, and the search box. Without the compiler, typing five characters runs 210 component functions. With the compiler on, the count drops to 15. Which components most likely still ran, and why did the others stop?",
        "solution": "The page component ran on every keystroke because it owns the state, and so did the search box and anything else whose props depend on the query, which accounts for three components per keystroke. The header, the gallery, and the 40 reviews stopped running because the compiler caches the elements the page returns. When the inputs to those elements are unchanged, the page returns the same element objects, and React skips any child whose element is the same object as last time.",
    },
    {
        "problem": "A component computes `const shownAt = Date.now();` and renders `Updated at {format(shownAt)}`. After enabling the compiler, the time stops changing. Explain why, and fix it so that it is correct with or without the compiler.",
        "solution": "`Date.now()` depends on nothing reactive, so the compiler computes it once and stores the result in a block that only runs on the first render. Reading the clock during render breaks the purity rule, so the compiler's assumption is valid and the code is wrong. Keep the time in state, set it from an effect or an event handler, and update it with an interval if it should tick. The `purity` lint rule flags the original line.",
    },
    {
        "problem": "A cart uses one context whose value is `{ items, addItem, isOpen, setOpen }`. Opening the drawer re-renders 24 Add to cart buttons. A teammate splits it into three contexts, but without the compiler the buttons still re-render. Explain why and give two fixes.",
        "solution": "The actions object is created in the provider's body, so without memoization it is a new object on every provider render, and every button reads it. Splitting the context only helps if the actions value keeps the same identity. One fix is to turn on the compiler, which creates the object once because it only uses stable state setters. The other is to create it with `useMemo` or a `useState` initializer. In `4-state-architecture/`, the split version ran 27 components without the compiler and 3 with it.",
    },
    {
        "problem": "A search over 5,000 products uses `useDeferredValue`, and the compiler is on, but the worst keystroke still takes 168 ms on a throttled CPU. What remains slow, and what change brings it under 50 ms?",
        "solution": "React can interrupt the deferred render, but not the commit. The first keystrokes change thousands of result elements, and committing those DOM changes blocks the main thread. Showing at most a bounded number of results, here 48, or paginating on the server, keeps each commit small. In `5-render-efficiency/` that brought the worst keystroke to 24 ms.",
    },
]

MCQS = [
    {
        "question": "Which of these does not cause a Client Component's function to run again?",
        "options": [
            "Its own state changes",
            "A context it reads receives a new value",
            "Its parent renders",
            "A Server Component above it is re-fetched with the same output",
        ],
        "answer": "D",
    },
    {
        "question": "What does `const $ = _c(16)` in compiled output create?",
        "options": [
            "Sixteen new components",
            "A cache of 16 slots belonging to one component instance",
            "A global cache shared by all instances",
            "A Web Worker with 16 threads",
        ],
        "answer": "B",
    },
    {
        "question": "In a Next.js 16 application with `reactCompiler: true`, which code does the compiler transform?",
        "options": [
            "Server Components and Client Components",
            "Only Server Components",
            "Client code in the browser bundle",
            "Only files with a `\"use memo\"` directive",
        ],
        "answer": "C",
    },
    {
        "question": "How does the compiler usually replace `React.memo`?",
        "options": [
            "It wraps every component in `React.memo`",
            "It makes the parent return the same element object when inputs are unchanged",
            "It removes props from children",
            "It disables re-rendering for leaf components",
        ],
        "answer": "B",
    },
    {
        "question": "A `useMemo` reads `q` but lists only `[items]`. What does the compiler do?",
        "options": [
            "Adds `q` to the dependency list",
            "Removes the `useMemo`",
            "Skips the component because it can't preserve the existing memoization",
            "Throws a build error",
        ],
        "answer": "C",
    },
    {
        "question": "Which mutation did neither the compiler nor the recommended lint rules flag in this chapter's examples?",
        "options": [
            "`user.name = \"x\"` on a prop",
            "`items.sort()` on a prop",
            "`ref.current++` during render",
            "A component defined inside another component",
        ],
        "answer": "B",
    },
    {
        "question": "What does annotation mode (`compilationMode: \"annotation\"`) do?",
        "options": [
            "Compiles only functions that opt in with `\"use memo\"`",
            "Adds comments to the compiled output",
            "Compiles everything except Server Components",
            "Reports skipped components as build errors",
        ],
        "answer": "A",
    },
    {
        "question": "Why does keeping a derived list in state with an effect stay slower than calculating it, even with the compiler on?",
        "options": [
            "The compiler can't cache arrays",
            "The effect adds a second commit and a frame of inconsistent UI",
            "Effects run on the server",
            "State updates are always synchronous",
        ],
        "answer": "B",
    },
    {
        "question": "What does `<Activity mode=\"hidden\">` do to its subtree?",
        "options": [
            "Unmounts it and discards its state",
            "Keeps it mounted with its state, hides its DOM, and cleans up its effects",
            "Keeps everything running, including effects, and hides it with CSS",
            "Moves it to a Web Worker",
        ],
        "answer": "B",
    },
    {
        "question": "In the case study, which change did the most to bring the worst keystroke from 800 ms to 24 ms?",
        "options": [
            "Turning on the React Compiler",
            "Adding `useMemo` to every card",
            "Restructuring: server rendering, filters in the URL, 24 products per page, split state",
            "Switching from webpack to Turbopack",
        ],
        "answer": "C",
    },
]

QUESTIONS = [
    "Explain the difference between the render phase and the commit phase, and say where wasted work usually collects.",
    "Why are Server Components outside the scope of this chapter's re-rendering problems? What is the only way a Server Component renders again?",
    "Describe the three parts of the compiled `ReviewList` that explain how the compiler works: the cache, the guarded blocks, and the hoisted function.",
    "Why does Next.js apply the compiler only to the client bundle, and what does React's server renderer do with a memo cache?",
    "Give two cases where manual memoization still makes sense with the compiler on, and one case where client memoization is the wrong tool altogether.",
    "Compare a violation the compiler can see with one it can't. What happens to each at build time and at runtime?",
    "Why did moving state down make no difference to the render count in example 2 with the compiler on, and which kinds of state still benefit from being moved?",
    "Explain how filter choices stored in the URL reduce client work compared with filter choices stored in a client-side store.",
    "Why can't memoization replace pagination or virtualization for a list of 5,000 items?",
    "List the five steps of this chapter's optimization workflow, and explain why memoization comes last.",
]

ASSIGNMENTS = [
    "Run `npm run measure` in `2-render-counts/`. Then add a recently viewed strip with six thumbnails to `ProductIsland`, written plainly with no manual memoization, and measure again with the compiler on and off. Report how many extra component functions run per keystroke in each case, and explain the difference.",
    "In `3-bailouts/`, fix every problem `npm run lint` and `npm run compile-report` report, without changing what each page shows. Rebuild with the compiler on, run `npm run measure`, and confirm that the timestamp updates and the basket lists every item.",
    "Extend `6-case-study-explorer/`'s after version with a category filter stored in the URL and validated in `parseFilters`. Measure renders while changing the category, and confirm that the compare toggle still re-renders only two components.",
]

KEY_TERMS = {
    "Render phase": "The phase in which React calls component functions and compares the new element tree with the previous one.",
    "Commit phase": "The phase in which React applies the differences found in the render phase to the DOM.",
    "React Compiler": "A build-time tool that rewrites components and hooks to cache their results and reuse them when their inputs are unchanged.",
    "Memo cache": "The array of slots, created with `_c(n)` in compiled output, in which one component instance stores its recorded inputs and cached results.",
    "Guarded block": "A section of compiled code that runs only when one of the inputs it depends on differs from the value recorded last time.",
    "Reactive value": "A value that can differ between renders because it comes from props, state, context, or something computed from them.",
    "Rules of React": "The assumptions React and the compiler rely on: pure rendering, immutable props and state, hooks called unconditionally at the top level, and no ref access during render.",
    "Bail-out": "The compiler's decision to skip a component it can't safely optimize and leave it as written.",
    "`\"use no memo\"`": "A directive that tells the compiler to leave a component or hook uncompiled.",
    "`\"use memo\"`": "A directive that opts a component or hook into compilation when the compiler runs in annotation mode.",
    "Annotation mode": "A compiler setting, `compilationMode: \"annotation\"`, that compiles only functions marked with `\"use memo\"`.",
    "Derived state": "A value that can be calculated from props and state, and so should be calculated during render instead of stored.",
    "Context splitting": "Dividing one context into several by how often each part changes, so a change reaches only the consumers that read it.",
    "Virtualization": "Rendering only the rows of a long list that are in or near the viewport.",
    "`useDeferredValue`": "A React hook that returns a copy of a value that lags behind during busy periods, so urgent updates render first.",
    "`<Activity>`": "A React component that hides a subtree while keeping it mounted with its state, and renders its updates at the lowest priority.",
    "Structure first, memoize last": "This chapter's pattern: reduce how much work a change triggers before relying on memoization to skip the work that repeats.",
}

FIGURES = {
    "6.1": ("fig_6_1_render_and_commit.png", "What starts a render: the three reasons a Client Component's function runs, followed by the render and commit phases"),
    "6.2": ("fig_6_2_memo_cache_slots.png", "What the compiler inserts: ReviewList's 16 memo cache slots, grouped into its six guarded blocks"),
    "6.3": ("fig_6_3_optimization_workflow.png", "The optimization workflow: structure first, memoize last"),
}

TABLE_CAPTIONS = [
    "Worst keystroke-to-paint delay searching 5,000 products, with the CPU throttled four times",
    "The product explorer before and after, measured on the 6-case-study-explorer example",
]

REPO_BLOB = "https://github.com/reynoldadade/605/blob/master/chapter%206/"
REPO_TREE = "https://github.com/reynoldadade/605/tree/master/chapter%206"
