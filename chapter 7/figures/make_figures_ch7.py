"""Generate the three Chapter 7 diagrams:

- Figure 7.1: the life of a page load on a streamed product page, with
  each metric (TTFB, FCP, LCP, CLS, INP) placed on the timeline, and
  hydration overlapping the reader's first interactions.
- Figure 7.2: one product page request as a trace waterfall, drawn from
  the spans example 4-tracing actually exported (../4-tracing/trace.json).
- Figure 7.3: the observability workflow from section 10.

Captions live in the chapter document, not in the images. Same plain,
monochrome box-and-arrow style as the Chapter 5 and 6 figure scripts.
Run: python3 make_figures_ch7.py (writes PNGs next to this file).
"""
import matplotlib
matplotlib.use("Agg")
matplotlib.rcParams["text.parse_math"] = False
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle
import os

OUT = os.path.dirname(os.path.abspath(__file__))

INK = "#1a1a1a"
BOX_FACE = "#f4f4f4"
BOX_EDGE = "#1a1a1a"
ACCENT = "#555555"
CLIENT_FACE = "#e2e2e2"
DARK_FACE = "#bdbdbd"


def box(ax, x, y, w, h, text, fontsize=9.5, face=BOX_FACE, mono=False,
        dashed=False, edge=BOX_EDGE, linewidth=1.3, weight="normal"):
    b = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.03",
                       linewidth=linewidth, edgecolor=edge, facecolor=face,
                       linestyle="dashed" if dashed else "solid")
    ax.add_patch(b)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center",
            fontsize=fontsize, color=INK, weight=weight,
            family="monospace" if mono else "sans-serif")


def arrow(ax, x1, y1, x2, y2, text=None, style="-|>", curve=0.0, fontsize=8.3,
          dx=0.0, dy=0.0, ha="center", dashed=False):
    a = FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style, mutation_scale=14,
                        linewidth=1.2, color=ACCENT,
                        linestyle="dashed" if dashed else "solid",
                        connectionstyle=f"arc3,rad={curve}")
    ax.add_patch(a)
    if text:
        ax.text((x1 + x2) / 2 + dx, (y1 + y2) / 2 + dy, text, ha=ha, va="center",
                fontsize=fontsize, color=ACCENT)


def save(fig, name):
    fig.savefig(os.path.join(OUT, name), dpi=200, bbox_inches="tight",
                facecolor="white")
    plt.close(fig)



import json

# ---------------------------------------------------------------------
# Figure 7.1: the page load timeline
# ---------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(11.5, 5.8))
ax.set_xlim(0, 12.6)
ax.set_ylim(0, 6.9)
ax.axis("off")

lanes = [("Network", 5.55, 0.95), ("Server", 4.35, 0.5), ("Main thread", 3.35, 0.5),
         ("Screen", 2.35, 0.5), ("Reader", 1.35, 0.5)]
for name, y, h in lanes:
    ax.text(0.1, y + (0.45 if h > 0.6 else 0.25), name, fontsize=9.5, weight="bold", color=INK, va="center")
    ax.plot([1.6, 12.4], [y - 0.1, y - 0.1], color="#dddddd", lw=0.8, zorder=0)

# network: request, shell, streamed chunks; the hero image in parallel
box(ax, 1.7, 5.95, 1.0, 0.45, "request", fontsize=8.5)
box(ax, 2.75, 5.95, 1.6, 0.45, "static shell", fontsize=8.5, face=CLIENT_FACE)
box(ax, 4.4, 5.95, 2.4, 0.45, "streamed sections", fontsize=8.5, face=CLIENT_FACE)
box(ax, 4.0, 5.4, 2.2, 0.42, "hero image", fontsize=8.3)
# server
box(ax, 1.7, 4.35, 1.0, 0.5, "shell", fontsize=8.5)
box(ax, 2.75, 4.35, 3.9, 0.5, "request-time data in <Suspense>", fontsize=8.5)
# main thread
box(ax, 3.3, 3.35, 1.5, 0.5, "JS download\n+ parse", fontsize=8)
box(ax, 4.85, 3.35, 3.1, 0.5, "hydration, island by island", fontsize=8.5, face=DARK_FACE)
box(ax, 8.6, 3.35, 1.6, 0.5, "handlers +\nrender", fontsize=8)
# screen
box(ax, 3.0, 2.35, 1.2, 0.5, "first paint", fontsize=8.5)
box(ax, 6.2, 2.35, 1.4, 0.5, "hero painted", fontsize=8.5)
box(ax, 7.7, 2.35, 1.2, 0.5, "shift (CLS)", fontsize=8.3, dashed=True)
box(ax, 10.25, 2.35, 1.3, 0.5, "next frame", fontsize=8.5)
# reader
box(ax, 8.0, 1.35, 0.9, 0.5, "tap", fontsize=8.5)

def marker(x, label, y0=0.6, y1=6.5, dx=0):
    ax.plot([x, x], [y0, y1], color=INK, lw=1.0, ls=(0, (4, 3)))
    ax.text(x + dx, 0.3, label, ha="center", fontsize=9.5, weight="bold", color=INK)

marker(2.75, "TTFB", dx=-0.25)
marker(3.0, "FCP", y1=2.35, dx=0.3)
marker(7.6, "LCP")
ax.annotate("", xy=(11.55, 1.0), xytext=(8.0, 1.0),
            arrowprops=dict(arrowstyle="<->", color=ACCENT, lw=1.2))
ax.text(9.8, 0.3, "INP: input delay, processing, presentation", ha="center",
        fontsize=9, color=INK, weight="bold")
ax.text(6.3, 6.7, "Hydration overlaps the first taps: a tap during hydration waits (input delay).",
        ha="center", fontsize=9, color=ACCENT)
save(fig, "fig_7_1_page_load_timeline.png")

# ---------------------------------------------------------------------
# Figure 7.2: trace waterfall from example 4
# ---------------------------------------------------------------------
spans = json.load(open(os.path.join(OUT, "..", "4-tracing", "trace.json")))
by_id = {s["spanId"]: s for s in spans}
def depth(s):
    d = 0
    while s.get("parentSpanId") in by_id:
        s = by_id[s["parentSpanId"]]; d += 1
    return d
keep = ["GET", "middleware GET", "GET /product/[id]", "render route (app) /product/[id]",
        "start response", "getReviews", "fetch GET http://localhost:4001/reviews/trail-sock",
        "GET /reviews/:id", "SELECT reviews", "getRecommendations"]
rows = []
for name in keep:
    m = [s for s in spans if s["name"] == name]
    if m: rows.append(m[0])
label = {"fetch GET http://localhost:4001/reviews/trail-sock": "fetch GET reviews service",
         "GET": "GET (request)", "middleware GET": "proxy (middleware GET)"}
end = max(s["startMs"] + s["durationMs"] for s in rows)
fig, ax = plt.subplots(figsize=(11.5, 0.48 * len(rows) + 1.3))
ax.set_xlim(-4.6, end * 1.08 / 100)
ax.set_ylim(-0.8, len(rows) + 0.2)
ax.axis("off")
scale = 1 / 100.0
for i, s in enumerate(rows):
    y = len(rows) - 1 - i
    d = depth(s)
    other = s["service"] != "storefront"
    ax.text(-4.5 + 0.18 * d, y + 0.35, ("reviews: " if other else "") + label.get(s["name"], s["name"]),
            fontsize=8.5, color=INK, va="center", family="sans-serif")
    w = max(s["durationMs"] * scale, 0.03)
    ax.add_patch(Rectangle((s["startMs"] * scale, y + 0.12), w, 0.46,
                 facecolor=DARK_FACE if other else CLIENT_FACE, edgecolor=INK, lw=0.9))
    ax.text(s["startMs"] * scale + w + 0.08, y + 0.35, f'{s["durationMs"]} ms',
            fontsize=8, color=ACCENT, va="center")
flush = next((s["startMs"] for s in rows if s["name"] == "start response"), None)
if flush is not None:
    ax.plot([flush * scale] * 2, [-0.2, len(rows)], color=INK, lw=1, ls=(0, (4, 3)))
    ax.text(flush * scale + 0.1, -0.5, f"shell sent at {flush} ms; the slow sections stream after it",
            fontsize=8.5, color=INK)
for t in range(0, int(end) + 1, 100):
    ax.text(t * scale, len(rows) + 0.05, f"{t}", fontsize=7.5, color=ACCENT, ha="center")
ax.text(end * scale, len(rows) + 0.05, "ms", fontsize=7.5, color=ACCENT, ha="left")
save(fig, "fig_7_2_trace_waterfall.png")

# ---------------------------------------------------------------------
# Figure 7.3: the observability workflow
# ---------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(11.5, 4.2))
ax.set_xlim(0, 13.4)
ax.set_ylim(-0.5, 4.4)
ax.axis("off")
steps = [
    ("1. Detect", "a field signal:\np75 vital, alert,\nnew error group", True),
    ("2. Segment", "route, device,\nlocale, navigation\ntype, release", True),
    ("3. Reproduce", "production build,\nthrottled to the\nsegment, same locale", False),
    ("4. Explain", "LCP/INP breakdown,\nperformance trace,\nserver trace, error report", False),
    ("5. Fix and guard", "confirm in the field;\nbudget, alert,\nor test", True),
]
x = 0.2
for i, (t, d, field) in enumerate(steps):
    box(ax, x, 1.2, 2.3, 1.9, "", face=CLIENT_FACE if field else BOX_FACE)
    ax.text(x + 1.15, 2.75, t, ha="center", fontsize=10, weight="bold", color=INK)
    ax.text(x + 1.15, 1.85, d, ha="center", va="center", fontsize=8.6, color=INK)
    if i < len(steps) - 1:
        arrow(ax, x + 2.32, 2.15, x + 2.62, 2.15)
    x += 2.62
ax.text(6.6, 3.75, "Shaded steps use field data. The others use the lab and server traces.",
        ha="center", fontsize=9.2, color=ACCENT)
arrow(ax, 12.1, 1.15, 1.35, 1.15, curve=-0.18, dashed=True)
ax.text(6.7, -0.3, "the guard watches the same field signal next time", ha="center",
        fontsize=8.6, color=ACCENT)
save(fig, "fig_7_3_observability_workflow.png")
