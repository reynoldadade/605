"""Post-process a built chapter .docx so every run carries the spec fonts
in all four rFonts slots, the document defaults are Lora (no theme
Calibri/Aptos anywhere), and Lora is embedded so the chapter renders
correctly on machines without Lora installed. Consolas is not embedded:
it is a Microsoft font that ships with Office and may not be
redistributed."""
import re, uuid, zipfile, shutil, os

FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
LORA = {"Regular": "Lora-Regular.ttf", "Bold": "Lora-Bold.ttf",
        "Italic": "Lora-Italic.ttf", "BoldItalic": "Lora-BoldItalic.ttf"}
REL_FONT = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/font"


def _obfuscate(data: bytes, guid: str) -> bytes:
    key = bytes.fromhex(guid.strip("{}").replace("-", ""))[::-1]
    head = bytes(b ^ key[i % 16] for i, b in enumerate(data[:32]))
    return head + data[32:]


def _full_rfonts(xml: str, default=None) -> str:
    def fix(m):
        tag = m.group(0)
        name = re.search(r'w:ascii="([^"]+)"', tag)
        if not name and not default:
            return tag
        n = name.group(1) if name else default
        attrs = dict(re.findall(r'(w:\w+)="([^"]*)"', tag))
        for k in ("w:asciiTheme", "w:hAnsiTheme", "w:eastAsiaTheme", "w:cstheme"):
            attrs.pop(k, None)
        for k in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
            attrs[k] = n
        return "<w:rFonts " + " ".join(f'{k}="{v}"' for k, v in attrs.items()) + "/>"
    return re.sub(r"<w:rFonts [^>]*/>", fix, xml)


def finalize(path: str, embed=True) -> None:
    tmp = path + ".tmp"
    with zipfile.ZipFile(path) as zin:
        files = {n: zin.read(n) for n in zin.namelist()}

    doc = files["word/document.xml"].decode("utf8")
    files["word/document.xml"] = _full_rfonts(doc).encode("utf8")

    styles = files["word/styles.xml"].decode("utf8")
    styles = re.sub(r'(<w:rPrDefault><w:rPr>)<w:rFonts [^>]*/>',
                    r'\1<w:rFonts w:ascii="Lora" w:hAnsi="Lora" w:eastAsia="Lora" w:cs="Lora"/>', styles)
    styles = _full_rfonts(styles, default="Lora")
    files["word/styles.xml"] = styles.encode("utf8")

    if embed:
        ft = files["word/fontTable.xml"].decode("utf8")
        rels_name = "word/_rels/fontTable.xml.rels"
        rels = files.get(rels_name, b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
                         b'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>').decode("utf8")
        embeds = []
        for i, (style, fname) in enumerate(LORA.items(), 1):
            guid = "{" + str(uuid.uuid4()).upper() + "}"
            data = open(os.path.join(FONT_DIR, fname), "rb").read()
            part = f"fonts/lora{i}.odttf"
            files["word/" + part] = _obfuscate(data, guid)
            rid = f"rIdLora{i}"
            rels = rels.replace("</Relationships>", f'<Relationship Id="{rid}" Type="{REL_FONT}" Target="{part}"/></Relationships>')
            embeds.append(f'<w:embed{style} r:id="{rid}" w:fontKey="{guid}"/>')
        lora_font = ('<w:font w:name="Lora"><w:panose1 w:val="00000500000000000000"/>'
                     '<w:charset w:val="00"/><w:family w:val="roman"/><w:pitch w:val="variable"/>'
                     + "".join(embeds) + "</w:font>")
        ft = re.sub(r'<w:font w:name="Lora">.*?</w:font>', "", ft, flags=re.S)
        if 'xmlns:r=' not in ft:
            ft = ft.replace("<w:fonts ", '<w:fonts xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ', 1)
        ft = ft.replace("</w:fonts>", lora_font + "</w:fonts>")
        files["word/fontTable.xml"] = ft.encode("utf8")
        files[rels_name] = rels.encode("utf8")

        ct = files["[Content_Types].xml"].decode("utf8")
        if 'Extension="odttf"' not in ct:
            ct = ct.replace("<Types ", "<Types ", 1).replace(
                "</Types>", '<Default Extension="odttf" ContentType="application/vnd.openxmlformats-officedocument.obfuscatedFont"/></Types>')
        files["[Content_Types].xml"] = ct.encode("utf8")

        st = files["word/settings.xml"].decode("utf8")
        if "<w:embedTrueTypeFonts" not in st:
            # schema order: writeProtection, view, zoom, ..., embedTrueTypeFonts
            m = re.search(r"<w:zoom[^>]*/>", st) or re.search(r"<w:view[^>]*/>", st)
            anchor = m.end() if m else re.search(r"<w:settings[^>]*>", st).end()
            st = st[:anchor] + "<w:embedTrueTypeFonts/>" + st[anchor:]
        files["word/settings.xml"] = st.encode("utf8")
    st = files["word/settings.xml"].decode("utf8")
    st = re.sub(r'<w:zoom w:val="bestFit"/>', '<w:zoom w:val="bestFit" w:percent="100"/>', st)
    files["word/settings.xml"] = st.encode("utf8")

    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        order = ["[Content_Types].xml"] + [n for n in files if n != "[Content_Types].xml"]
        for n in order:
            zout.writestr(n, files[n])
    shutil.move(tmp, path)
