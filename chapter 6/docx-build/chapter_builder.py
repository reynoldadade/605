"""
chapter_builder.py — assemble a publisher-formatted book chapter as a .docx.

Encodes the formatting specification from the publisher's Guidelines.docx
(font = Lora for prose/headings, Consolas for code; specific point sizes per
element; bordered callout boxes for Note/Tip/Example; caption style
"Figure/Table N.M: <Caption>"; no end-period on bullets).

Usage pattern — build a chapter by calling methods in the order the chapter
should read, then call .save():

    from chapter_builder import ChapterBuilder

    ch = ChapterBuilder()
    ch.start_chapter(5, "React Server Components And The Request Lifecycle")
    ch.add_introduction("In this chapter we explore ...")
    ch.add_structure([
        "What Is A Server Component",
        "How Server Components Render",
        "Composing Server And Client Components",
        "Conclusion",
        "Questions and Exercises",
    ])
    ch.add_heading("What Is A Server Component", level=1)
    ch.add_body_paragraph("Server Components run only on the server. ...")
    ch.add_note("Server Components never ship their code to the browser.")
    ch.add_code_block('export default async function Page() {\n  return <div />\n}')
    ch.add_figure_caption(5, 1, "The request lifecycle for a Server Component")
    ch.add_case_study("A Streaming Product Page", "Consider a storefront that ...")
    ch.add_conclusion("In the next chapter we build on this to ...")
    ch.add_points_to_remember([
        "Server Components render on the server and send HTML/RSC payload, not JS",
        "Client Components are the escape hatch for interactivity",
    ])
    ch.add_solved_exercises([...])
    ch.add_mcqs([...])
    ch.add_questions([...])
    ch.add_assignments([...])
    ch.add_key_terms({"Server Component": "A component that renders only on the server."})
    ch.save("chapter_05.docx")

Every method appends to the document in place, so call them in reading
order. See demo_build_sample_chapter.py for a fully worked example.
"""

from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


FONT_PROSE = "Lora"
FONT_CODE = "Consolas"

# Point sizes straight from the formatting spec table.
SZ_CHAPTER_NUMBER = 35
SZ_CHAPTER_NAME = 40
SZ_H1 = 20
SZ_H2 = 18
SZ_H3 = 16
SZ_CONTENT = 11
SZ_CAPTION = 9
SZ_CODE_BLOCK = 10
SZ_SCREEN_TEXT = 11
SZ_CODE_IN_TEXT = 10
SZ_KEYBOARD = 11
SZ_KEYWORD = 10  # 2026-09-15 correction: Consolas 10 bold
SZ_EXAMPLE_LABEL = 9


def _set_font(run, name, size_pt, bold=False, italic=False):
    run.font.name = name
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    run.font.italic = italic
    # East-Asian / complex-script fallback so the font name actually sticks
    # in Word (otherwise Word can silently substitute the theme font).
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn('w:rFonts'))
    if rFonts is None:
        rFonts = OxmlElement('w:rFonts')
        rPr.append(rFonts)
    rFonts.set(qn('w:eastAsia'), name)


def _set_cell_border(cell, sz=8, color="000000"):
    """Add a thin box border around a table cell (used for Note/Tip/Example boxes)."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    borders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right'):
        el = OxmlElement(f'w:{edge}')
        el.set(qn('w:val'), 'single')
        el.set(qn('w:sz'), str(sz))
        el.set(qn('w:space'), '4')
        el.set(qn('w:color'), color)
        borders.append(el)
    tcPr.append(borders)


def _set_cell_margins(cell, margin_dxa=120):
    tcPr = cell._tc.get_or_add_tcPr()
    mar = OxmlElement('w:tcMar')
    for edge in ('top', 'left', 'bottom', 'right'):
        el = OxmlElement(f'w:{edge}')
        el.set(qn('w:w'), str(margin_dxa))
        el.set(qn('w:type'), 'dxa')
        mar.append(el)
    tcPr.append(mar)


class ChapterBuilder:
    def __init__(self):
        self.doc = Document()
        # Base "Normal" style: Lora 11pt content, so anything we forget to
        # style explicitly still matches the spec instead of falling back
        # to Word's default Calibri.
        normal = self.doc.styles['Normal']
        normal.font.name = FONT_PROSE
        normal.font.size = Pt(SZ_CONTENT)

    # ---- chapter opening --------------------------------------------

    def start_chapter(self, number, name):
        """Chapter Number line (Lora 35) then Chapter Name (Lora 40, bold).

        Pass `name` already in Title Case — this does not auto-title-case,
        since that mangles code identifiers, framework names, and acronyms
        (e.g. "Server Components" vs "server components API").
        """
        p = self.doc.add_paragraph()
        _set_font(p.add_run(f"Chapter {number}"), FONT_PROSE, SZ_CHAPTER_NUMBER)
        p = self.doc.add_paragraph()
        _set_font(p.add_run(name), FONT_PROSE, SZ_CHAPTER_NAME, bold=True)

    def add_introduction(self, text):
        """Opening content paragraph(s). Should state what the reader will
        learn and why it matters (self-direction: guidance in introduction)
        before diving into Structure."""
        self.add_body_paragraph(text)

    def add_structure(self, topics):
        """Bold 'Structure:' label followed by a bulleted outline of the
        chapter's H1 sections. Keep this in sync with the actual headings —
        conventionally the last two entries are 'Conclusion' and
        'Questions and Exercises'."""
        p = self.doc.add_paragraph()
        _set_font(p.add_run("Structure:"), FONT_PROSE, SZ_H1, bold=True)
        for topic in topics:
            self._add_bullet(topic)

    # ---- headings and body --------------------------------------------

    def add_heading(self, text, level=1):
        """level 1/2/3 -> H1 (20pt)/H2 (18pt)/H3 (16pt), all Lora bold.
        H1 text should be Title Case per spec."""
        sizes = {1: SZ_H1, 2: SZ_H2, 3: SZ_H3}
        if level not in sizes:
            raise ValueError("level must be 1, 2, or 3")
        p = self.doc.add_paragraph()
        _set_font(p.add_run(text), FONT_PROSE, sizes[level], bold=True)
        return p

    def add_body_paragraph(self, text):
        """Plain content paragraph, Lora 11pt."""
        p = self.doc.add_paragraph()
        _set_font(p.add_run(text), FONT_PROSE, SZ_CONTENT)
        return p

    def add_paragraph_with_runs(self, runs):
        """Build one paragraph mixing inline styles.

        `runs` is a list of (text, kind) tuples where kind is one of:
          'normal'       Lora 11
          'keyword'      Lora 11 bold        (a term being introduced)
          'keyboard'     Lora 11 italic      (key names: Enter, Ctrl)
          'code_in_text' Consolas 10 bold    (inline code/command: useEffect)
          'screen_text'  Consolas 11         (on-screen labels: File, Save)

        Avoid quoting reported speech in `normal` text — paraphrase instead
        of writing `she said, "..."`.
        """
        style_map = {
            'normal': (FONT_PROSE, SZ_CONTENT, False, False),
            'keyword': (FONT_CODE, SZ_KEYWORD, True, False),
            'keyboard': (FONT_PROSE, SZ_KEYBOARD, False, True),
            'code_in_text': (FONT_CODE, SZ_CODE_IN_TEXT, True, False),
            'screen_text': (FONT_CODE, SZ_SCREEN_TEXT, False, False),
        }
        p = self.doc.add_paragraph()
        for text, kind in runs:
            font, size, bold, italic = style_map.get(kind, style_map['normal'])
            _set_font(p.add_run(text), font, size, bold=bold, italic=italic)
        return p

    def add_definition(self, term, definition, level=1):
        """Nested term/definition entry (the sample chapter's Data /
        Information / Instruction first/second/third-level indentation).
        level 1/2/3 increases the left indent."""
        p = self.doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25 * level)
        _set_font(p.add_run(f"{term}: "), FONT_PROSE, SZ_CONTENT, bold=True)
        _set_font(p.add_run(definition), FONT_PROSE, SZ_CONTENT)
        return p

    def _add_bullet(self, text):
        """Bulleted list item. Per spec: no end period on bullets — this
        strips one if you accidentally left it on."""
        text = text.rstrip()
        if text.endswith('.'):
            text = text[:-1]
        p = self.doc.add_paragraph(style='List Bullet')
        _set_font(p.add_run(text), FONT_PROSE, SZ_CONTENT)
        return p

    def add_bulleted_list(self, items):
        for item in items:
            self._add_bullet(item)

    # ---- figures, tables, code -----------------------------------------

    def add_figure_caption(self, chapter_num, fig_num, caption):
        """'Figure N.M: <caption>' — Lora 9pt italic, centered. Insert the
        actual image inline with text yourself (via the docx skill's image
        workflow) immediately before this caption; this only writes the
        caption line, matching the spec's 'Figure/Table N.M: <Caption>'
        style."""
        return self._add_caption("Figure", chapter_num, fig_num, caption)

    def add_table_caption(self, chapter_num, table_num, caption):
        return self._add_caption("Table", chapter_num, table_num, caption)

    def add_table(self, headers, rows):
        """A real Word table (not a markdown-style table typed as text) —
        bold Lora 11pt header row, plain Lora 11pt body cells, grid
        borders. Call add_table_caption() immediately after with the same
        table number so the caption sits right below it, in-line with
        the surrounding text."""
        table = self.doc.add_table(rows=1 + len(rows), cols=len(headers))
        table.style = 'Table Grid'
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        for col_idx, header in enumerate(headers):
            cell = table.rows[0].cells[col_idx]
            _set_cell_margins(cell, margin_dxa=80)
            p = cell.paragraphs[0]
            _set_font(p.add_run(header), FONT_PROSE, SZ_CONTENT, bold=True)
        for row_idx, row in enumerate(rows, start=1):
            for col_idx, value in enumerate(row):
                cell = table.rows[row_idx].cells[col_idx]
                _set_cell_margins(cell, margin_dxa=80)
                p = cell.paragraphs[0]
                _set_font(p.add_run(str(value)), FONT_PROSE, SZ_CONTENT)
        self.doc.add_paragraph()  # spacer after the table
        return table

    def add_figure_image(self, path, width_inches=5.5):
        """Insert an actual image in-line with text (centered). Call
        add_figure_caption() immediately after with the same figure
        number so the caption sits directly below the image, per the
        spec's in-line figure positioning rule."""
        p = self.doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(path, width=Inches(width_inches))
        return p

    def _add_caption(self, kind, chapter_num, num, caption):
        p = self.doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        _set_font(
            p.add_run(f"{kind} {chapter_num}.{num}: {caption}"),
            FONT_CODE, SZ_CAPTION, italic=True,  # 2026-09-15 correction: Consolas
        )
        return p

    def add_code_block(self, code):
        """Consolas 10pt, one paragraph per source line so indentation and
        line breaks survive."""
        for line in code.split('\n'):
            p = self.doc.add_paragraph()
            p.paragraph_format.space_after = Pt(0)
            _set_font(p.add_run(line if line else ' '), FONT_CODE, SZ_CODE_BLOCK)
        # trailing spacer so body text after the block doesn't crowd it
        self.doc.add_paragraph()

    # ---- callout boxes: Note / Tip / Example ---------------------------

    def _add_callout(self, label, text, label_size):
        table = self.doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.rows[0].cells[0]
        _set_cell_border(cell)
        _set_cell_margins(cell)
        p = cell.paragraphs[0]
        _set_font(p.add_run(f"{label} "), FONT_PROSE, label_size, bold=True)
        run = p.add_run(text)
        _set_font(run, FONT_PROSE, SZ_CONTENT)
        self.doc.add_paragraph()  # spacer after the box
        return table

    def add_note(self, text):
        """Bordered box labelled 'Note:' — Lora 11 per spec."""
        return self._add_callout("Note:", text, SZ_CONTENT)

    def add_tip(self, text):
        """Bordered box labelled 'Tip:' — Lora 11 per spec."""
        return self._add_callout("Tip:", text, SZ_CONTENT)

    def add_example(self, number, text):
        """Bordered box labelled 'Example N.M' — label is Lora 9pt bold per
        spec, body text inside is normal 11pt content."""
        return self._add_callout(f"Example {number}", text, SZ_EXAMPLE_LABEL)

    # ---- end-of-chapter pedagogy ---------------------------------------

    def add_case_study(self, title, text):
        self.add_heading(title, level=2)
        self.add_body_paragraph(text)

    def add_conclusion(self, text):
        self.add_heading("Conclusion", level=1)
        self.add_body_paragraph(text)

    def add_points_to_remember(self, points):
        self.add_heading("Points to Remember", level=2)
        self.add_bulleted_list(points)

    def add_solved_exercises(self, exercises):
        """exercises: list of {"problem": str, "solution": str}."""
        self.add_heading("Solved Exercises", level=2)
        for i, ex in enumerate(exercises, 1):
            self.add_body_paragraph(f"{i}. {ex['problem']}")
            self.add_body_paragraph(f"Solution: {ex['solution']}")

    def add_mcqs(self, questions):
        """questions: list of
          {"question": str, "options": ["...", "...", "...", "..."], "answer": "C"}
        Options are lettered A/B/C/D in order; the answer key is written
        once at the end as '<question number> <letter>', matching the
        sample chapter's compact answer-key format."""
        self.add_heading("Multiple Choice Questions", level=2)
        letters = "ABCD"
        for i, q in enumerate(questions, 1):
            self.add_body_paragraph(f"{i}. {q['question']}")
            for letter, option in zip(letters, q['options']):
                self.add_body_paragraph(f"{letter}. {option}")
        self.add_heading("Answer", level=3)
        for i, q in enumerate(questions, 1):
            self.add_body_paragraph(f"{i}  {q['answer']}")

    def add_questions(self, questions):
        self.add_heading("Questions", level=2)
        for i, q in enumerate(questions, 1):
            self.add_body_paragraph(f"{i}. {q}")

    def add_assignments(self, assignments):
        self.add_heading("Assignments", level=2)
        for i, a in enumerate(assignments, 1):
            self.add_body_paragraph(f"{i}. {a}")

    def add_question_papers(self, papers):
        """Only for chapters targeting a university course modelled on
        past exams. papers: list of {"year": str, "questions": [str, ...],
        "answers": [str, ...]}."""
        self.add_heading("Solved / Unsolved Question Papers", level=2)
        for paper in papers:
            self.add_heading(f"{paper['year']}", level=3)
            for i, q in enumerate(paper['questions'], 1):
                self.add_body_paragraph(f"{i}. {q}")
            if paper.get('answers'):
                self.add_heading("Answers", level=3)
                for i, a in enumerate(paper['answers'], 1):
                    self.add_body_paragraph(f"{i}. {a}")

    def add_key_terms(self, terms):
        """terms: dict of {term: definition}. These feed the book-level
        Glossary & Index compiled once at the end of the whole book —
        keep a running collection across chapters for that final pass."""
        self.add_heading("Key Terms", level=2)
        for term, definition in terms.items():
            p = self.doc.add_paragraph()
            _set_font(p.add_run(f"{term}: "), FONT_PROSE, SZ_CONTENT, bold=True)
            _set_font(p.add_run(definition), FONT_PROSE, SZ_CONTENT)

    # ---- output ----------------------------------------------------

    def save(self, path):
        self.doc.save(path)
        return path
