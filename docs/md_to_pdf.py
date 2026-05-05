"""Convert every .md in this folder to a matching styled .pdf."""
from pathlib import Path
import sys
import markdown
from xhtml2pdf import pisa

ROOT = Path(__file__).parent

# Allow `python md_to_pdf.py file1.md file2.md` to convert specific files;
# otherwise convert every .md in the folder.
if len(sys.argv) > 1:
    md_files = [ROOT / a for a in sys.argv[1:]]
else:
    md_files = sorted(ROOT.glob("*.md"))

CSS = """
@page { size: A4; margin: 18mm 16mm; }
body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; color: #222; line-height: 1.45; }
h1 { color: #0b6e4f; border-bottom: 2px solid #0b6e4f; padding-bottom: 6px; font-size: 20pt; }
h2 { color: #0b6e4f; margin-top: 18px; font-size: 14pt; border-bottom: 1px solid #cde; padding-bottom: 3px; }
h3 { color: #1f4e79; font-size: 12pt; margin-top: 12px; }
code { background: #f4f4f4; padding: 1px 4px; border-radius: 3px; font-family: Consolas, monospace; font-size: 9.5pt; color: #b30059; }
pre { background: #f4f4f4; padding: 8px; border-left: 3px solid #0b6e4f; font-family: Consolas, monospace; font-size: 9pt; white-space: pre-wrap; }
pre code { background: transparent; color: #222; padding: 0; }
table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 9.5pt; }
th, td { border: 1px solid #bbb; padding: 5px 8px; text-align: left; vertical-align: top; }
th { background: #e6f4ef; color: #0b6e4f; }
blockquote { border-left: 3px solid #0b6e4f; background: #f0faf6; padding: 6px 12px; margin: 8px 0; color: #333; }
a { color: #1565c0; text-decoration: none; }
ul, ol { margin: 6px 0 6px 18px; }
hr { border: 0; border-top: 1px solid #ccc; margin: 14px 0; }
"""

html_template = """<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>{css}</style></head>
<body>{body}</body></html>"""

for md_path in md_files:
    if not md_path.exists():
        print(f"  ! skipped (not found): {md_path.name}")
        continue
    pdf_path = md_path.with_suffix(".pdf")
    md_text = md_path.read_text(encoding="utf-8")
    html_body = markdown.markdown(md_text, extensions=["tables", "fenced_code", "toc"])
    html = html_template.format(css=CSS, body=html_body)
    with open(pdf_path, "wb") as f:
        result = pisa.CreatePDF(html, dest=f, encoding="utf-8")
    if result.err:
        print(f"  ! FAILED: {md_path.name}")
    else:
        print(f"  + {md_path.name} -> {pdf_path.name}")
