"""Build the hosted-page version of fitcheck.html.

The artifact host wraps the page in its own <html>/<head>/<body>, so this keeps the
<title>, <style> and body content of fitcheck.html and drops the document wrapper.
Run from the project folder: python3 tools/make_artifact.py
"""
import re
from pathlib import Path

src = Path("fitcheck.html").read_text()
style = re.search(r"<style>(.*?)</style>", src, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", src, re.S).group(1)
out = (
    "<title>FitCheck</title>\n"
    '<meta name="claude:viewport-fit-sides" content="cover">\n'
    f"<style>{style}</style>\n{body.strip()}\n"
)
Path("dist").mkdir(exist_ok=True)
Path("dist/fitcheck.artifact.html").write_text(out)
print(f"wrote dist/fitcheck.artifact.html ({len(out)} bytes)")
