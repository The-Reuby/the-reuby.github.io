#!/usr/bin/env python3
"""Split A3 two-up spreads in reuby4.pdf into single A4 pages.

Page layout:
  - Page 1     : single A4 (front cover)      -> kept as-is
  - Pages 2-28 : A3 landscape spreads (2-up)  -> split into left + right
  - Page 29    : single A4 (back cover)       -> kept as-is

A spread is split by cropping its mediabox into a left half and a right half.
"""
from pypdf import PdfReader, PdfWriter

SRC = "tools/reuby4.pdf"
DST = "tools/reuby4_single.pdf"

# A landscape page (width > height) is treated as a 2-up spread.
LANDSCAPE_IS_SPREAD = True

reader = PdfReader(SRC)
writer = PdfWriter()

out_count = 0
for i, page in enumerate(reader.pages, start=1):
    box = page.mediabox
    width = float(box.width)
    height = float(box.height)

    if LANDSCAPE_IS_SPREAD and width > height:
        mid = (float(box.left) + float(box.right)) / 2.0

        # Left half
        left = writer.add_page(page)
        left.mediabox.right = mid
        left.cropbox.left = box.left
        left.cropbox.right = mid
        left.cropbox.top = box.top
        left.cropbox.bottom = box.bottom

        # Right half (re-add the original page, then crop)
        right = writer.add_page(reader.pages[i - 1])
        right.mediabox.left = mid
        right.cropbox.left = mid
        right.cropbox.right = box.right
        right.cropbox.top = box.top
        right.cropbox.bottom = box.bottom

        out_count += 2
    else:
        writer.add_page(page)
        out_count += 1

with open(DST, "wb") as f:
    writer.write(f)

print(f"Input pages : {len(reader.pages)}")
print(f"Output pages: {out_count}")
print(f"Written to  : {DST}")
