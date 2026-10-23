"""Generate the three Chapter 6 diagrams from the outline:

- Figure 6.1: the three reasons a Client Component renders, and the render
  and commit phases that follow (Server Components are not on this path).
- Figure 6.2: what the compiler inserts: ReviewList's 16 memo cache slots,
  grouped into its 6 guarded blocks, as produced by example
  1-compiler-output.
- Figure 6.3: the optimization workflow from section 9.

Captions live in the chapter document, not in the images. Same plain,
monochrome box-and-arrow style as the Chapter 5 figure script, so the
book's figures read as one visual system.
Run: python3 make_figures_ch6.py (writes PNGs next to this file).
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


# ---------------------------------------------------------------------
# Figure 6.1: three triggers, then render, commit, and the browser's work
# ---------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(11.0, 5.6))
ax.set_xlim(0, 13.0)
ax.set_ylim(0, 6.6)
ax.axis("off")

ax.text(1.75, 6.25, "What starts a render", ha="center", fontsize=10.5,
        weight="bold", color=INK)
triggers = [
    ("Its own state changed\n(setState, dispatch)", 4.75),
    ("A context it reads changed\n(new provider value)", 3.35),
    ("Its parent rendered\n(the default for every child)", 1.95),
]
for text, y in triggers:
    box(ax, 0.2, y, 3.1, 1.0, text, fontsize=9, face=CLIENT_FACE)
    arrow(ax, 3.35, y + 0.5, 4.45, 3.35 + 0.5)

box(ax, 4.5, 2.75, 2.7, 2.2,
    "Render phase\n\ncall component functions,\nbuild new element trees,\ncompare with the last ones",
    fontsize=9, weight="normal")
arrow(ax, 7.25, 3.85, 8.45, 3.85, "only the\ndifferences", dy=0.5, fontsize=8)
box(ax, 8.5, 2.95, 2.0, 1.8, "Commit phase\n\napply changes\nto the DOM", fontsize=9)
arrow(ax, 10.55, 3.85, 10.95, 3.85)
box(ax, 11.0, 2.95, 1.85, 1.8, "Browser\n\nstyle, layout,\npaint", fontsize=9)

ax.text(5.85, 2.35, "Wasted work collects here: functions that run\nand return what they returned last time",
        ha="center", va="top", fontsize=8.3, color=ACCENT, style="italic")

box(ax, 4.5, 0.2, 8.35, 1.15,
    "Server Components are not on this path. They render on the server, per request\n"
    "or cache entry, and run again only on a new request: a navigation,\n"
    "router.refresh(), or the page a Server Action sends back",
    fontsize=8.5, dashed=True, face="white")

save(fig, "fig_6_1_render_and_commit.png")


# ---------------------------------------------------------------------
# Figure 6.2: ReviewList's memo cache, 16 slots in 6 guarded blocks
# ---------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(12.0, 4.4))
ax.set_xlim(0, 18.4)
ax.set_ylim(0.2, 7.4)
ax.axis("off")

ax.text(0.3, 6.95, "const $ = _c(16)   // one cache per ReviewList instance, kept between renders",
        fontsize=9.5, family="monospace", color=INK, va="center")

SLOT_W, SLOT_H, X0, Y0 = 1.08, 0.9, 0.55, 4.9
# slot index -> (label, kind) where kind is "in" (recorded input) or "out" (cached result)
slots = {
    0: ("expanded", "in"), 1: ("minRating", "in"), 2: ("reviews", "in"), 3: ("items", "out"),
    4: ("minRating", "in"), 5: ("predicate", "out"),
    6: ("items", "in"), 7: ("<ul>", "out"),
    8: ("expanded", "in"), 9: ("onClick", "out"),
    10: ("onClick", "in"), 11: ("label", "in"), 12: ("<button>", "out"),
    13: ("<ul>", "in"), 14: ("<button>", "in"), 15: ("<section>", "out"),
}
for i in range(16):
    label, kind = slots[i]
    x = X0 + i * SLOT_W
    ax.add_patch(Rectangle((x, Y0), SLOT_W, SLOT_H, linewidth=1.1, edgecolor=BOX_EDGE,
                           facecolor=DARK_FACE if kind == "out" else BOX_FACE))
    ax.text(x + SLOT_W / 2, Y0 + SLOT_H + 0.18, f"$[{i}]", ha="center", fontsize=7.5,
            family="monospace", color=ACCENT)
    ax.text(x + SLOT_W / 2, Y0 + SLOT_H / 2, label, ha="center", va="center",
            fontsize=6.1, family="monospace", color=INK, rotation=0)

blocks = [
    ((0, 3), "the list of <ReviewItem> elements\nre-runs when expanded, minRating\nor reviews changes"),
    ((4, 5), "the filter's\npredicate\n(minRating)"),
    ((6, 7), "the <ul>\n(items)"),
    ((8, 9), "the click\nhandler\n(expanded)"),
    ((10, 12), "the <button>\n(onClick, label)"),
    ((13, 15), "the <section>\n(<ul>, <button>)"),
]
for (a, b), text in blocks:
    xa = X0 + a * SLOT_W + 0.06
    xb = X0 + (b + 1) * SLOT_W - 0.06
    ax.plot([xa, xa, xb, xb], [Y0 - 0.12, Y0 - 0.35, Y0 - 0.35, Y0 - 0.12],
            color=ACCENT, linewidth=1.2)
    ax.text((xa + xb) / 2, Y0 - 0.55, text, ha="center", va="top", fontsize=7.8, color=INK)

ax.add_patch(Rectangle((0.55, 1.85), 0.45, 0.32, facecolor=BOX_FACE, edgecolor=BOX_EDGE))
ax.text(1.1, 2.01, "recorded input, compared with !== on the next render",
        fontsize=8.3, va="center", color=INK)
ax.add_patch(Rectangle((0.55, 1.3), 0.45, 0.32, facecolor=DARK_FACE, edgecolor=BOX_EDGE))
ax.text(1.1, 1.46, "cached result, reused when every input in its block is unchanged",
        fontsize=8.3, va="center", color=INK)
ax.text(10.6, 1.73,
        "Same reviews and minRating from the parent:\nevery block hits, the same <section> is returned,\nand nothing below it renders.",
        fontsize=8.3, va="center", color=ACCENT, style="italic")

save(fig, "fig_6_2_memo_cache_slots.png")


# ---------------------------------------------------------------------
# Figure 6.3: the optimization workflow
# ---------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(11.5, 4.6))
ax.set_xlim(0, 15.0)
ax.set_ylim(0.2, 5.6)
ax.axis("off")

steps = [
    ("1  Measure", "production build,\nthrottled CPU,\nrecord the number"),
    ("2  Locate", "React, network,\nbundle, or layout?\nwhich state change?"),
    ("3  Move", "state down, derive,\nURL and server data,\nsplit context, bound lists"),
    ("4  Memoize", "compiler on, badge\nchecked, skips fixed;\nmanual memo last"),
    ("5  Guard", "lint rules in editor\nand CI, measurement\nkept to re-run"),
]
W, H, GAP, Y = 2.55, 2.3, 0.4, 2.2
for i, (title, body) in enumerate(steps):
    x = 0.3 + i * (W + GAP)
    face = DARK_FACE if i in (2, 3) else BOX_FACE
    box(ax, x, Y, W, H, "", face=face, linewidth=1.6 if i in (2, 3) else 1.3)
    ax.text(x + W / 2, Y + H - 0.4, title, ha="center", fontsize=10.5, weight="bold", color=INK)
    ax.text(x + W / 2, Y + H / 2 - 0.25, body, ha="center", va="center", fontsize=8.5, color=INK)
    if i < len(steps) - 1:
        arrow(ax, x + W + 0.03, Y + H / 2, x + W + GAP - 0.03, Y + H / 2)

x3 = 0.3 + 2 * (W + GAP)
ax.plot([x3, x3 + 2 * W + GAP], [Y + H + 0.3] * 2, color=INK, linewidth=1.2)
ax.text(x3 + W + GAP / 2, Y + H + 0.5, "structure first, memoize last", ha="center",
        fontsize=10, weight="bold", color=INK)

xs = 0.3 + 4 * (W + GAP) + W / 2
x1 = 0.3 + W / 2
arrow(ax, xs, Y - 0.05, x1, Y - 0.05, curve=-0.18, dashed=True)
ax.text((xs + x1) / 2, 0.95, "when the feature changes, measure again", ha="center",
        fontsize=8.5, color=ACCENT)

save(fig, "fig_6_3_optimization_workflow.png")
print("wrote", [f for f in os.listdir(OUT) if f.endswith(".png")])
