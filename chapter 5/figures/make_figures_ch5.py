"""Generate the three Chapter 5 diagrams from the outline:

- Figure 5.1: lifecycle of a Server Action request, including the updated
  RSC payload arriving in the same response.
- Figure 5.2: optimistic UI timeline, success vs. failure/rollback (and
  the stale-cache case), using the timings measured in example
  4-optimistic-rollback.
- Figure 5.3: the guard pipeline from section 10, "Anatomy of a Mutation".

Captions live in the chapter document, not in the images. Same plain,
monochrome box-and-arrow style as the Chapter 2 and Chapter 3
figure scripts, so the book's figures read as one visual system.
Run: python3 make_figures_ch5.py (writes PNGs next to this file).
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


# ---------------------------------------------------------------------
# Figure 5.1: lifecycle of a Server Action request
# ---------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(11.0, 6.0))
ax.set_xlim(0, 13.0)
ax.set_ylim(0, 7.0)
ax.axis("off")

# lanes
for y0, label in ((4.15, "Browser"), (0.35, "Server")):
    ax.add_patch(Rectangle((0.2, y0), 12.6, 2.45, facecolor="white",
                           edgecolor="#9a9a9a", linewidth=1.0, linestyle="dashed"))
    ax.text(0.35, y0 + 2.25, label, fontsize=10, color=ACCENT, weight="bold", va="center")

bw, bh = 2.3, 1.25
# browser steps
box(ax, 0.6, 4.55, bw, bh, "Reader submits\n<form action={...}>", face=CLIENT_FACE)
box(ax, 10.1, 4.55, 2.4, bh, "React applies the new\ntree and the action's\nreturn value", face=CLIENT_FACE)

# server steps
sx = [0.6, 3.4, 6.2, 9.0]
labels = [
    "Look up the action\nby its ID",
    "Run the action:\nchecks, then the write",
    "updateTag(\"reviews\")\nexpires the tagged\ncache entries",
    "Re-render the route\nwith fresh data",
]
for x, t in zip(sx, labels):
    box(ax, x, 0.75, bw, bh + 0.1, t, fontsize=9)
for a, b in zip(sx[:-1], sx[1:]):
    arrow(ax, a + bw, 0.75 + (bh + 0.1) / 2, b, 0.75 + (bh + 0.1) / 2)

# request down
arrow(ax, 1.75, 4.55, 1.75, 2.1,
      text="POST /product/p1\nNext-Action: <action ID>\nbody: bound args + FormData",
      dx=0.15, ha="left", fontsize=8.2)
# response up
arrow(ax, 11.3, 2.1, 11.3, 4.55,
      text="one response:\naction result +\nupdated RSC payload",
      dx=-0.15, ha="right", fontsize=8.2)

ax.text(6.5, 3.45,
        "No second request, no full page reload. Without JavaScript, the same POST is a\n"
        "native form submission and the server answers with a full HTML page instead.",
        fontsize=8.2, color=ACCENT, ha="center", style="italic")

plt.tight_layout()
fig.savefig(os.path.join(OUT, "fig_5_1_server_action_lifecycle.png"), dpi=180, facecolor="white")
plt.close(fig)

# ---------------------------------------------------------------------
# Figure 5.2: optimistic timeline (measured in 4-optimistic-rollback)
# ---------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(11.0, 5.4))
ax.set_xlim(-0.55, 2.25)
ax.set_ylim(-0.75, 4.25)
ax.axis("off")

T_PEND, T_DONE, T_END = 0.05, 1.56, 2.1
rows = [
    (3.0, "Success\n(updateTag)"),
    (1.9, "Failure:\nerror returned"),
    (0.8, "Success, but\nrevalidateTag(\"max\")"),
]
H = 0.62

def bar(x0, x1, y, text, face, dashed=False, fs=8.6):
    ax.add_patch(FancyBboxPatch((x0, y), x1 - x0, H, boxstyle="round,pad=0.0,rounding_size=0.02",
                                facecolor=face, edgecolor=BOX_EDGE, linewidth=1.1,
                                linestyle="dashed" if dashed else "solid"))
    ax.text((x0 + x1) / 2, y + H / 2, text, ha="center", va="center", fontsize=fs, color=INK)

for y, label in rows:
    ax.text(-0.08, y + H / 2, label, ha="right", va="center", fontsize=9, color=INK)
    bar(T_PEND, T_DONE, y, "pending entry on screen, \"Posting...\"", CLIENT_FACE, dashed=True)

bar(T_DONE, T_END, 3.0, "real review in the\nserver-rendered list", BOX_FACE)
bar(T_DONE, T_END, 1.9, "entry gone, message shown,\nreader's text restored", BOX_FACE)
bar(T_DONE, T_END, 0.8, "entry gone, review\nnot on screen (stale)", "white")

# axis
ax.plot([0, T_END], [0.35, 0.35], color=ACCENT, linewidth=1.0)
ax.text(T_PEND + 0.02, 3.8, "entry appears ~50 ms after the click", fontsize=7.8, color=ACCENT, va="center")
for t, lbl in ((0, "0 ms\nclick"), (T_DONE, "~1,560 ms\nresponse"),):
    ax.plot([t, t], [0.3, 3.75], color="#9a9a9a", linewidth=0.8, linestyle=":")
    ax.text(t, 0.05, lbl, ha="center", va="top", fontsize=8.2, color=ACCENT)

ax.text(1.1, -0.62, "Measured: 1,500 ms artificial server delay; zero frames showed both the pending and the real review, or neither.",
        fontsize=7.8, color=ACCENT, ha="center", style="italic")

plt.tight_layout()
fig.savefig(os.path.join(OUT, "fig_5_2_optimistic_timeline.png"), dpi=180, facecolor="white")
plt.close(fig)

# ---------------------------------------------------------------------
# Figure 5.3: the guard pipeline (section 10)
# ---------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(12.0, 5.4))
ax.set_xlim(0, 14.4)
ax.set_ylim(0, 6.3)
ax.axis("off")

steps = [
    "1. Authenticate\nverifySession()",
    "2. Validate shape\nschema.safeParse()",
    "3. Authorize\nthis user, this record",
    "4. Mutate\nin a transaction",
    "5. Invalidate\nupdateTag(), after commit",
    "6. Report back\nshaped result",
]
w, h, y = 2.05, 1.3, 3.55
xs = [0.25 + i * 2.37 for i in range(6)]
box(ax, 0.25, 5.25, 1.6, 0.6, "request", fontsize=8.8, mono=True, face="white")
arrow(ax, 1.05, 5.25, 1.05, y + h)
for i, (x, t) in enumerate(zip(xs, steps)):
    face = DARK_FACE if i == 3 else BOX_FACE
    box(ax, x, y, w, h, t, fontsize=8.8, face=face)
    if i < 5:
        arrow(ax, x + w, y + h / 2, xs[i + 1], y + h / 2)

# early returns
ret_y, ret_h = 0.55, 1.05
box(ax, xs[0], ret_y, xs[3] + w - xs[0], ret_h,
    "returned result: { status: \"error\", message, fieldErrors?, values? }\n"
    "an expected failure, rendered by the form; nothing has changed",
    fontsize=8.6, face="white")
for i, lbl in enumerate(["not signed in", "malformed", "not allowed", "duplicate (P2002)"]):
    cx = xs[i] + w / 2
    arrow(ax, cx, y, cx, ret_y + ret_h, text=lbl, dx=0.08, ha="left", fontsize=7.9)

box(ax, xs[4], ret_y, w + 0.3, ret_h, "anything else thrown\n-> nearest error\nboundary (digest)",
    fontsize=8.4, face="white", dashed=True)
arrow(ax, xs[3] + w, y + 0.25, xs[4] + 0.6, ret_y + ret_h, curve=-0.2, dashed=True)

ax.text(xs[5] + w / 2, 2.6, "{ status: \"success\" }", fontsize=8.6, family="monospace",
        ha="center", color=INK)
arrow(ax, xs[5] + w / 2, y, xs[5] + w / 2, 2.8)


plt.tight_layout()
fig.savefig(os.path.join(OUT, "fig_5_3_guard_pipeline.png"), dpi=180, facecolor="white")
plt.close(fig)
print("wrote", sorted(f for f in os.listdir(OUT) if f.endswith(".png")))
