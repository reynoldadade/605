# Chapter 7 figures

Per the publisher caption format (`Figure N.M: <Caption>`):

Figure 7.1: The life of a page load on a streamed product page, with each
metric placed on the timeline

Figure 7.2: One product page request as a trace: the Next.js server, the
reviews service, and the point where the static shell was sent

Figure 7.3: The observability workflow: field finds, lab explains

Placement:
- Figure 7.1 belongs in section 2, **The Life of a Page Load**, after the
  paragraph introducing CLS.
- Figure 7.2 belongs in section 8, **Reading a Request Waterfall**, after
  its first sentence.
- Figure 7.3 belongs in section 10, **The Workflow**, after the five-step
  list.

All three are original diagrams generated with matplotlib
(`make_figures_ch7.py`, kept alongside these PNGs), in the same plain,
monochrome style as the Chapter 5 and 6 figures. Figure 7.2 is drawn from
the spans example `4-tracing` exported (`4-tracing/trace.json`), not an
illustration.
