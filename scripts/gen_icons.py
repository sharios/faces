#!/usr/bin/env python3
"""Generate PWA icons: a simple black-stroke face on a warm background."""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS = os.path.join(ROOT, "icons")
os.makedirs(ICONS, exist_ok=True)

BG = (247, 244, 238, 255)
INK = (20, 20, 20, 255)


def draw_face(size, pad_ratio):
    img = Image.new("RGBA", (size, size), BG)
    d = ImageDraw.Draw(img)
    s = size
    lw = max(3, round(s * 0.028))
    pad = round(s * pad_ratio)

    # head
    d.ellipse([pad, pad, s - pad, s - pad], outline=INK, width=lw)

    cx = s / 2
    # eyes
    er = s * 0.055
    ey = s * 0.42
    for ex in (s * 0.38, s * 0.62):
        d.ellipse([ex - er, ey - er, ex + er, ey + er], fill=INK)

    # nose
    d.line([(cx, s * 0.46), (cx - s * 0.03, s * 0.58), (cx + s * 0.04, s * 0.58)],
           fill=INK, width=lw, joint="curve")

    # smile
    d.arc([s * 0.34, s * 0.5, s * 0.66, s * 0.74], start=20, end=160, fill=INK, width=lw)

    # hair tuft
    d.arc([s * 0.30, s * 0.12, s * 0.70, s * 0.42], start=190, end=350, fill=INK, width=lw)
    return img


def main():
    specs = [
        ("icon-192.png", 192, 0.14),
        ("icon-512.png", 512, 0.14),
        ("icon-maskable-512.png", 512, 0.24),  # extra padding for safe zone
        ("favicon-64.png", 64, 0.12),
    ]
    for name, size, pad in specs:
        draw_face(size, pad).save(os.path.join(ICONS, name))
        print("wrote", name)

    # simple SVG favicon
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#f7f4ee"/>
  <g fill="none" stroke="#141414" stroke-width="3" stroke-linecap="round">
    <circle cx="32" cy="34" r="22"/>
    <path d="M14 26 Q32 6 50 26"/>
    <path d="M23 46 Q32 56 41 46"/>
  </g>
  <circle cx="25" cy="32" r="3.2" fill="#141414"/>
  <circle cx="39" cy="32" r="3.2" fill="#141414"/>
</svg>
'''
    with open(os.path.join(ICONS, "favicon.svg"), "w") as fh:
        fh.write(svg)
    print("wrote favicon.svg")


if __name__ == "__main__":
    main()
