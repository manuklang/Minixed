#!/usr/bin/env python3
"""Builds index.html from template.html by embedding the brand assets (logo + PDF fonts).

Usage: python3 build.py [--artifact OUT]   (--artifact also writes a skeleton-less copy for claude.ai)
"""
import base64, json, pathlib, re, sys

HERE = pathlib.Path(__file__).parent
A = HERE / "assets"
b64 = lambda p: base64.b64encode(p.read_bytes()).decode()
assets = {
    "logoWhite": "data:image/png;base64," + b64(A / "logo-white.png"),
    "logoDark": "data:image/png;base64," + b64(A / "logo-dark.png"),
    "fonts": {f.name: b64(f) for f in sorted(A.glob("*.woff"))},
}
tpl = (HERE / "template.html").read_text(encoding="utf8")
html = tpl.replace("/*__GS_ASSETS__*/", "window.GS_ASSETS = " + json.dumps(assets) + ";")
(HERE / "index.html").write_text(html, encoding="utf8")
print("index.html", len(html) // 1024, "KB")

if "--artifact" in sys.argv:
    out = pathlib.Path(sys.argv[sys.argv.index("--artifact") + 1])
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', "", head)
    body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
    out.write_text(head.strip() + "\n" + body, encoding="utf8")
    print("artifact", out)
