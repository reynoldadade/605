# How chapter_07.docx was built

- `build_chapter_07.py` reads `chapter-07-draft-sections.md` (a copy of
  the prose kept in the claude.ai project) and `ch7_pedagogy.py`
  (Introduction, Structure, Points to Remember, Solved Exercises, MCQs,
  Assignments, figure and table captions), and writes `../chapter_07.docx`
  with the `rsc-chapter-writer` skill's `ChapterBuilder`. It is Chapter 6's
  build script with the chapter number, paths, and captions changed, and
  without the Questions and Key Terms sections, which the book drops from
  Chapter 7 on. The last H1 is therefore "Exercises".
- `chapter_builder.py` is the skill's builder with the 2026-09-15
  publisher correction applied (captions in Consolas 9pt italic, keywords
  in Consolas 10pt bold), copied from `chapter 6/docx-build/`.
- `fonts_finalize.py` runs at the end of the build and embeds Lora from
  `fonts/` (static instances generated from the Google Fonts variable font,
  SIL Open Font License). See `chapter 5/docx-build/README.md` for details.

```bash
pip install python-docx fonttools
python3 build_chapter_07.py            # writes ../chapter_07.docx
```

Rendered with LibreOffice 2026-11-09: 45 pages. Consolas isn't available
in LibreOffice on Linux, so code is set in a wider substitute there; code
lines are kept to 72 characters so they don't wrap in either font.
