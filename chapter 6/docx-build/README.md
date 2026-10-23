# How chapter_06.docx was built

- `build_chapter_06.py` reads `chapter-06-draft-sections.md` (a copy of
  the prose kept in the claude.ai project) and `ch6_pedagogy.py`
  (Introduction, Structure, Points to Remember, Solved Exercises, MCQs,
  Questions, Assignments, Key Terms, figure and table captions), and writes
  `../chapter_06.docx` with the `rsc-chapter-writer` skill's
  `ChapterBuilder`. It is Chapter 5's build script with the chapter number,
  paths, and captions changed.
- `chapter_builder.py` is the skill's builder with the 2026-09-15
  publisher correction applied (captions in Consolas 9pt italic, keywords
  in Consolas 10pt bold), copied from `chapter 5/docx-build/`.
- `fonts_finalize.py` runs at the end of the build and embeds Lora from
  `fonts/` (static instances generated from the Google Fonts variable font,
  SIL Open Font License). See `chapter 5/docx-build/README.md` for details.

```bash
pip install python-docx fonttools
python3 build_chapter_06.py            # writes ../chapter_06.docx
```

Rendered with LibreOffice 2026-10-23: 43 pages. Consolas isn't available
in LibreOffice on Linux, so code is set in a wider substitute there; code
lines are kept to 72 characters so they don't wrap in either font.
