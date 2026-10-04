# How chapter_05.docx was built

- `build_chapter_05.py` reads `chapter-05-draft-sections.md` (the
  approved prose, kept in the claude.ai project) and `ch5_pedagogy.py`
  (Introduction, Structure, Points to Remember, Solved Exercises, MCQs,
  Questions, Assignments, Key Terms, figure and table captions), and
  writes the chapter with the `rsc-chapter-writer` skill's `ChapterBuilder`.
- `chapter_builder.py` is the skill's builder with the 2026-09-15
  publisher correction applied: figure/table captions in Consolas 9pt
  italic, keywords in Consolas 10pt bold. The synced skill copy still has
  the old Lora settings.
- Paths at the top of `build_chapter_05.py` point at the cloud session
  that built it; adjust them to rebuild locally (`pip install python-docx`).
