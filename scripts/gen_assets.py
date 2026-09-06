#!/usr/bin/env python3
"""Generate simple black-stroke cartoon SVG assets for the face builder.

All art is hand-tuned line work: black strokes, no fill, transparent background.
Each file uses a tight viewBox so the app can place it into a feature slot with
object-fit: contain.
"""
import os
import textwrap

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")

STROKE = '#141414'


def svg(view_w, view_h, body, sw=8):
    return textwrap.dedent(f'''\
        <svg xmlns="http://www.w3.org/2000/svg" width="{view_w}" height="{view_h}"
             viewBox="0 0 {view_w} {view_h}" fill="none" stroke="{STROKE}"
             stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">
        {body}
        </svg>
    ''')


def write(rel, content):
    path = os.path.join(ASSETS, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        fh.write(content)
    print("wrote", rel)


# --------------------------------------------------------------- face shape ---
# All shapes share a viewBox of 720x860 and keep the face roughly within
# x 70..650, y 26..834 so the eyes/nose/mouth placement boxes stay aligned.
EARS = '''\
  <path d="M{lx} 392 C{lox} 374 {lox} 474 {lx2} 480"/>
  <path d="M{rx} 392 C{rox} 374 {rox} 474 {rx2} 480"/>'''


def ears(inset):
    return EARS.format(
        lx=70 + inset, lox=26 + inset, lx2=74 + inset,
        rx=650 - inset, rox=694 - inset, rx2=646 - inset,
    )


heads = {
    "head-01-oval": svg(720, 860, f'''\
  <path d="M360 26 C180 26 76 214 76 430 C76 650 214 834 360 834
           C506 834 644 650 644 430 C644 214 540 26 360 26 Z"/>
{ears(0)}''', sw=9),

    "head-02-round": svg(720, 860, f'''\
  <ellipse cx="360" cy="438" rx="300" ry="396"/>
{ears(0)}''', sw=9),

    "head-03-square": svg(720, 860, f'''\
  <path d="M120 190 Q120 30 360 30 Q600 30 600 190 L600 560
           Q600 720 470 800 Q360 848 250 800 Q120 720 120 560 Z"/>
{ears(46)}''', sw=9),

    "head-04-heart": svg(720, 860, f'''\
  <path d="M360 44 C168 44 84 210 100 372 C112 500 190 650 300 760
           Q360 802 420 760 C530 650 608 500 620 372 C636 210 552 44 360 44 Z"/>
{ears(6)}''', sw=9),

    "head-05-long": svg(720, 860, f'''\
  <path d="M360 28 C246 28 150 190 146 430 C142 650 232 832 360 832
           C488 832 578 650 574 430 C570 190 474 28 360 28 Z"/>
{ears(70)}''', sw=9),

    "head-06-diamond": svg(720, 860, f'''\
  <path d="M360 58 C298 62 248 112 208 210 C168 300 140 378 116 440
           C140 502 174 590 220 680 C270 782 322 822 360 828
           C398 822 450 782 500 680 C546 590 580 502 604 440
           C580 378 552 300 512 210 C472 112 422 62 360 58 Z"/>
{ears(58)}''', sw=9),
}
for name, content in heads.items():
    write(f"head/{name}.svg", content)


# --------------------------------------------------------------------- hair ---
hair = {
    "hair-01-short": svg(880, 640, '''\
  <path d="M40 470 C30 150 250 44 440 44 C630 44 850 150 840 470
           C840 360 790 320 745 350 C724 288 666 280 636 338
           C614 282 548 274 516 332 C495 280 440 270 440 270
           C440 270 385 280 364 332 C332 274 266 282 244 338
           C214 280 156 288 135 350 C90 320 40 360 40 470 Z"/>''', sw=9),

    "hair-02-curly": svg(880, 640, '''\
  <path d="M110 500
           C70 300 120 150 210 130
           A70 70 0 0 1 330 92
           A70 70 0 0 1 440 74
           A70 70 0 0 1 550 92
           A70 70 0 0 1 670 130
           C760 150 810 300 770 500"/>
  <path d="M235 250 a34 34 0 1 0 2 0 M405 190 a34 34 0 1 0 2 0
           M575 250 a34 34 0 1 0 2 0 M320 360 a30 30 0 1 0 2 0
           M500 370 a30 30 0 1 0 2 0"/>''', sw=9),

    "hair-03-long": svg(880, 640, '''\
  <path d="M96 626 C36 280 168 58 440 48 C712 58 844 280 784 626"/>
  <path d="M440 48 L440 214"/>
  <path d="M204 618 C200 330 268 150 402 150 M676 618 C680 330 612 150 478 150"/>''', sw=9),

    "hair-04-swoop": svg(880, 640, '''\
  <path d="M60 400 C80 120 660 36 820 190
           C700 110 320 118 250 380
           C285 240 570 176 700 260
           C630 208 400 214 330 330"/>''', sw=9),

    "hair-05-bald": svg(880, 640, '''\
  <path d="M120 360 C165 200 300 150 405 190"/>
  <path d="M760 380 C728 220 610 150 485 195"/>
  <path d="M300 156 q80 -50 152 -12 M300 176 q6 34 46 48"/>''', sw=9),

    "hair-06-bun": svg(880, 640, '''\
  <path d="M100 500 Q112 150 440 108 Q768 150 780 500"/>
  <circle cx="440" cy="92" r="82"/>
  <path d="M356 118 q84 48 168 0"/>''', sw=9),

    "hair-07-bob": svg(880, 640, '''\
  <path d="M70 590 C50 200 210 52 440 52 C670 52 830 200 810 590
           C766 566 720 572 694 590 L672 300 Q440 376 208 300 L186 590
           C160 572 114 566 70 590 Z"/>''', sw=9),

    "hair-08-mohawk": svg(880, 640, '''\
  <path d="M300 490 L316 100 L364 330 L406 60 L450 330 L498 100 L516 490"/>
  <path d="M225 450 q38 -96 100 -118 M655 450 q-38 -96 -100 -118"/>''', sw=9),
}
for name, content in hair.items():
    write(f"hair/{name}.svg", content)


# --------------------------------------------------------------------- nose ---
nose = {
    "nose-01-hook": svg(180, 280, '''\
  <path d="M96 40 C92 120 88 168 72 190 C82 214 116 214 128 190"/>''', sw=8),
    "nose-02-button": svg(180, 280, '''\
  <path d="M90 50 C88 120 74 156 96 188 C116 160 104 118 102 54"/>
  <path d="M80 182 q10 12 22 2 M112 180 q-8 12 -20 2"/>''', sw=7),
    "nose-03-triangle": svg(180, 280, '''\
  <path d="M90 54 L56 194 Q90 214 124 194 Z"/>''', sw=8),
    "nose-04-line": svg(180, 280, '''\
  <path d="M94 40 L86 198"/>
  <path d="M74 194 q14 20 32 2"/>''', sw=8),
    "nose-05-wide": svg(180, 280, '''\
  <path d="M90 46 L84 140"/>
  <path d="M40 172 Q90 210 140 172"/>
  <path d="M50 174 q12 20 28 8 M130 174 q-12 20 -28 8"/>''', sw=7),
    "nose-06-upturned": svg(180, 280, '''\
  <path d="M102 46 C98 116 82 146 74 168 C92 196 122 190 124 156"/>
  <path d="M86 166 q10 10 20 2"/>''', sw=7),
}
for name, content in nose.items():
    write(f"nose/{name}.svg", content)


# -------------------------------------------------------------------- mouth ---
mouth = {
    "mouth-01-smile": svg(360, 200, '''\
  <path d="M58 74 Q180 176 302 74"/>''', sw=9),
    "mouth-02-neutral": svg(360, 200, '''\
  <path d="M66 100 L294 100"/>''', sw=9),
    "mouth-03-frown": svg(360, 200, '''\
  <path d="M58 138 Q180 40 302 138"/>''', sw=9),
    "mouth-04-open": svg(360, 200, '''\
  <path d="M70 78 Q180 58 290 78 Q180 190 70 78 Z"/>''', sw=9),
    "mouth-05-o": svg(360, 200, '''\
  <ellipse cx="180" cy="100" rx="46" ry="56"/>''', sw=9),
    "mouth-06-grin": svg(360, 200, '''\
  <path d="M58 66 Q180 150 302 66 Z"/>
  <path d="M92 78 L268 78"/>''', sw=8),
    "mouth-07-tongue": svg(360, 200, '''\
  <path d="M60 68 Q180 168 300 68"/>
  <path d="M150 118 Q180 196 210 118 Z"/>''', sw=9),
    "mouth-08-smirk": svg(360, 200, '''\
  <path d="M66 112 Q158 112 208 82 Q250 58 296 84"/>''', sw=9),
}
for name, content in mouth.items():
    write(f"mouth/{name}.svg", content)

print("done")
