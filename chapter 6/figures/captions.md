# Chapter 6 figures

Per the publisher caption format (`Figure N.M: <Caption>`):

Figure 6.1: What starts a render: the three reasons a Client Component's
function runs, followed by the render and commit phases

Figure 6.2: What the compiler inserts: ReviewList's 16 memo cache slots,
grouped into its six guarded blocks

Figure 6.3: The optimization workflow: structure first, memoize last

Placement:
- Figure 6.1 belongs in section 2, **What a Render Costs**, after the
  paragraph explaining that the render phase is where wasted work
  accumulates.
- Figure 6.2 belongs in section 3, **What the Compiler Produces**, after
  the paragraph about intermediate values getting no slots.
- Figure 6.3 belongs in section 9, **An Optimization Workflow**, after the
  five-step list.

All three are original box-and-arrow diagrams generated with matplotlib
(`make_figures_ch6.py`, kept alongside these PNGs), in the same plain,
monochrome style as the Chapter 5 figures. Figure 6.2's slot layout is
the compiler's actual output for `1-compiler-output/src/ReviewList.tsx`,
not an illustration.
