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

## Fonts

`fonts_finalize.py` runs after the build. It writes every run's font into
all four Word font slots (ascii, hAnsi, eastAsia, cs), replaces the
template's theme fonts (Calibri) with Lora in the document defaults and
styles, and embeds Lora (Regular, Bold, Italic, Bold Italic) in the
`.docx`, so the chapter shows Lora on machines that don't have it
installed. Lora is under the SIL Open Font License, which allows
embedding. Consolas is not embedded: it is a Microsoft font that comes
with Office and can't be redistributed.

The four static Lora files are generated from the Google Fonts variable
font before building (not committed here):

```python
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
for style, src, w in [("Regular", "Lora-Variable.ttf", 400), ("Bold", "Lora-Variable.ttf", 700),
                      ("Italic", "Lora-Italic-Variable.ttf", 400), ("BoldItalic", "Lora-Italic-Variable.ttf", 700)]:
    instantiateVariableFont(TTFont(src), {"wght": w}, updateFontNames=True).save(f"fonts/Lora-{style}.ttf")
```
