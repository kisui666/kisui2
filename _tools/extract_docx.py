"""Extract text (and basic structure) from the source storybook DOCX."""
import sys
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
from docx.oxml.ns import qn


def iter_block_items(parent):
    body = parent.element.body
    for child in body.iterchildren():
        if child.tag == qn('w:p'):
            yield Paragraph(child, parent)
        elif child.tag == qn('w:tbl'):
            yield Table(child, parent)


def main(path, out):
    doc = Document(path)
    lines = []
    for block in iter_block_items(doc):
        if isinstance(block, Paragraph):
            text = block.text.strip()
            style = block.style.name if block.style is not None else ""
            if not text:
                continue
            if style and style.lower() not in ("normal", "body text", "正文"):
                lines.append(f"[{style}] {text}")
            else:
                lines.append(text)
        else:
            lines.append("--- TABLE ---")
            for row in block.rows:
                cells = [c.text.strip().replace("\n", " / ") for c in row.cells]
                lines.append(" | ".join(cells))
            lines.append("--- /TABLE ---")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"paragraphs/tables written: {len(lines)}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])