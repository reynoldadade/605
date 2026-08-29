"""Generate the two Chapter 3 diagrams noted in the outline:

- Figure 3.7: decision-flow for "which kind of component is this?"
  (Server / Client / Shared). Renumbered from 3.1 to 3.7 to match the
  chapter's current figure sequence.

- Figure 3.2: a full server-shell-plus-islands page.

Same plain, monochrome box-and-arrow style as Chapter 2's
make_figures.py, so the book's figures read as one consistent visual
system.
"""
import matplotlib
matplotlib.use("Agg")
matplotlib.rcParams["text.parse_math"] = False  # literal "$" in labels, not math mode
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import os

OUT = os.path.join(os.path.dirname(__file__), "figures")
os.makedirs(OUT, exist_ok=True)

INK = "#1a1a1a"
BOX_FACE = "#f4f4f4"
BOX_EDGE = "#1a1a1a"
ACCENT = "#555555"
CLIENT_FACE = "#e2e2e2"


def box(ax, x, y, w, h, text, fontsize=10, face=BOX_FACE, mono=False,
        dashed=False, edge=BOX_EDGE, linewidth=1.3):
    b = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.02,rounding_size=0.02",
                        linewidth=linewidth, edgecolor=edge, facecolor=face,
                        linestyle="dashed" if dashed else "solid")
    ax.add_patch(b)
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center",
             fontsize=fontsize, color=INK,
             family="monospace" if mono else "sans-serif", wrap=True)


def arrow(ax, x1, y1, x2, y2, text=None, style="-|>", curve=0.0, fontsize=8.5):
    a = FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style, mutation_scale=14,
                         linewidth=1.2, color=ACCENT,
                         connectionstyle=f"arc3,rad={curve}")
    ax.add_patch(a)
    if text:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        if curve:
            my += 0.35
        elif abs(y2 - y1) > abs(x2 - x1):
            # mostly-vertical arrow: offset the label sideways, off the line
            mx += 0.32
        else:
            # mostly-horizontal arrow: offset the label above the line
            my += 0.22
        ax.text(mx, my, text, ha="center", va="center", fontsize=fontsize, color=ACCENT)


# ---------------------------------------------------------------------
# Figure 3.7 — "which kind of component is this?" decision flow
# ---------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10.4, 5.4))
ax.set_xlim(0, 12.2)
ax.set_ylim(0, 5.8)
ax.axis("off")

y_main = 3.6
w1, h1 = 2.0, 1.15

box(ax, 0.2, y_main, 1.7, h1, "Component\nto classify", fontsize=9.5)

box(ax, 2.6, y_main - 0.1, 3.0, h1 + 0.2,
    "Does it use\nclient-only APIs?\n(useState, useEffect,\nevent handlers, window)",
    fontsize=8.6)

box(ax, 6.5, y_main - 0.1, 3.0, h1 + 0.2,
    "Does it perform\nserver-only I/O?\n(DB query, filesystem,\nsecrets, server env vars)",
    fontsize=8.6)

box(ax, 10.3, y_main, 1.7, h1,
    "Shared\nComponent",
    fontsize=9.5, face=CLIENT_FACE)

# main "no" chain
arrow(ax, 1.9, y_main + h1 / 2, 2.6, y_main + h1 / 2)
arrow(ax, 5.6, y_main + h1 / 2, 6.5, y_main + h1 / 2, text="no", fontsize=8.5)
arrow(ax, 9.5, y_main + h1 / 2, 10.3, y_main + h1 / 2, text="no", fontsize=8.5)

# yes branches down to outcomes
out_y = 0.4
out_h = 1.15
box(ax, 3.1, out_y, 2.0, out_h, "Client\nComponent", fontsize=9.5, face=CLIENT_FACE, dashed=True)
box(ax, 7.0, out_y, 2.0, out_h, "Server\nComponent", fontsize=9.5)

arrow(ax, 4.1, y_main - 0.1, 4.1, out_y + out_h, text="yes", fontsize=8.5)
arrow(ax, 8.0, y_main - 0.1, 8.0, out_y + out_h, text="yes", fontsize=8.5)

ax.text(6.1, 5.45,
        "Figure 3.7 — the push-to-the-leaves heuristic starts by asking this "
        "question of every component",
        fontsize=9, color=ACCENT, style="italic", ha="center")
ax.text(11.15, out_y + out_h + 0.35,
        "no server-only I/O AND\nno client-only APIs —\nsafe to import from either side",
        fontsize=7.6, color=ACCENT, style="italic", ha="center")

plt.tight_layout()
fig.savefig(os.path.join(OUT, "fig_3_7_component_kind_decision.png"), dpi=180, facecolor="white")
plt.close(fig)

# ---------------------------------------------------------------------
# Figure 3.2 — server shell, client islands (a full page)
# ---------------------------------------------------------------------
fig, ax = plt.subplots(figsize=(9.4, 6.2))
ax.set_xlim(0, 9.4)
ax.set_ylim(0, 7.0)
ax.axis("off")

# Outer page / server shell
outer = FancyBboxPatch((0.3, 0.5), 8.8, 5.9, boxstyle="round,pad=0.02,rounding_size=0.03",
                        linewidth=1.6, edgecolor=BOX_EDGE, facecolor="white")
ax.add_patch(outer)
ax.text(4.7, 6.15, "Page (Server Shell)", fontsize=11, weight="bold", ha="center", color=INK)

# Header bar (server) with a client island inside it
box(ax, 0.6, 5.15, 8.2, 0.8, "Header (server)", fontsize=9)
box(ax, 5.9, 5.25, 2.7, 0.6, "SearchBox\n(client island)", fontsize=8, face=CLIENT_FACE, dashed=True)

# Sidebar (server)
box(ax, 0.6, 0.8, 2.0, 4.15, "Sidebar\n(server)", fontsize=9)

# Main content (server) with two client islands inside it
box(ax, 2.8, 0.8, 6.0, 4.15, "", fontsize=9)
ax.text(5.8, 4.6, "Main Content (server)", fontsize=9, ha="center", color=INK)
box(ax, 3.1, 2.9, 2.6, 1.3, "Comments\n(client island)", fontsize=8.4, face=CLIENT_FACE, dashed=True)
box(ax, 6.0, 2.9, 2.5, 0.85, "LikeButton\n(client island)", fontsize=8.2, face=CLIENT_FACE, dashed=True)
box(ax, 3.1, 1.05, 5.4, 1.5,
    "Everything else in Main Content — copy, layout,\ndata already fetched server-side — ships as plain HTML",
    fontsize=8.0, face="white")

ax.text(4.7, 0.25,
        "solid border = Server Component (no client JS)   ·   "
        "dashed border, shaded = Client Component island",
        fontsize=8, color=ACCENT, style="italic", ha="center")

plt.tight_layout()
fig.savefig(os.path.join(OUT, "fig_3_2_server_shell_islands.png"), dpi=180, facecolor="white")
plt.close(fig)

print("wrote figures to", OUT)
