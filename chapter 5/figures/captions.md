# Chapter 5 figures

Per the publisher caption format (`Figure N.M: <Caption>`):

Figure 5.1: The lifecycle of a Server Action request: one round trip
carries the mutation, the cache invalidation, and the updated page

Figure 5.2: An optimistic review over time: success, a returned error,
and the stale-cache case, as measured in `4-optimistic-rollback`

Figure 5.3: The guard pipeline: every action is a front door

Placement:
- Figure 5.1 belongs in section 2, **What Actually Happens on the Wire**,
  after the paragraph about the response carrying the updated RSC payload.
- Figure 5.2 belongs in section 7, **Optimism Without Moving the List to
  the Client**, between the success-path and failure-path paragraphs. Its
  third row illustrates that section's `Note (Next.js 16)`.
- Figure 5.3 belongs in section 10, **Anatomy of a Mutation**, after the
  six-step list (the draft already carries a placeholder line for it).

All three are original box-and-arrow diagrams generated with matplotlib
(`make_figures_ch5.py`, kept alongside these PNGs), in the same plain,
monochrome style as the Chapter 2 and 3 figures. Figure 5.2's timings come
from the example's own measurements, not from any outside source.
