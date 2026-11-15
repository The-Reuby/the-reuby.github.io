"""Export the original PDF artwork, preserving its paths and transparency.

Run: python tools/prepare_submission_art.py
Requires Poppler (pdftocairo), Pillow, and PyGObject with librsvg.
The source PDFs remain untouched; no background estimation or AI is used.
"""

from pathlib import Path
from copy import deepcopy
import subprocess
from tempfile import TemporaryDirectory
from xml.etree import ElementTree as ET

import gi
from PIL import Image, ImageFilter

gi.require_version("Rsvg", "2.0")
from gi.repository import Rsvg  # noqa: E402

ART = Path(__file__).resolve().parents[1] / "public/images/submission/2027"
SOURCE = "Copy of Blue Green Cream Earth Clock Climate Change Poster"
ET.register_namespace("", "http://www.w3.org/2000/svg")
ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")


def render(root, width, height):
    root.set("width", str(width))
    root.set("height", str(height))
    pixbuf = Rsvg.Handle.new_from_data(ET.tostring(root)).get_pixbuf()
    mode = "RGBA" if pixbuf.get_has_alpha() else "RGB"
    return Image.frombytes(
        mode, (pixbuf.get_width(), pixbuf.get_height()), pixbuf.get_pixels(),
        "raw", mode, pixbuf.get_rowstride(),
    ).convert("RGBA")


def export(pdf_name, name, widths, remove_page=False, atmosphere=False):
    with TemporaryDirectory(prefix="reuby-art-") as temp:
        svg = Path(temp) / "art.svg"
        subprocess.run(["pdftocairo", "-svg", str(ART / pdf_name), str(svg)], check=True)
        root = ET.parse(svg).getroot()

    if remove_page:
        # Remove only the explicit white page behind the vector lettering.
        page = list(root)[1]
        assert len(page) == 1 and page[0].get("fill") == "rgb(100%, 100%, 100%)", \
            "PDF structure changed: inspect the page background before exporting"
        assert page[0].get("d", "").startswith("M 0 0.40625 L 1189.5")
        root.remove(page)

    _, _, page_width, page_height = map(float, root.get("viewBox").split())
    preview = render(root, round(page_width), round(page_height))
    bounds = preview.getchannel("A").getbbox()
    if bounds is None:
        raise ValueError(f"No artwork found in {pdf_name}")
    left, top, right, bottom = bounds
    # Crop the SVG viewport before rendering at the final resolution. Retain
    # the PDF's real alpha mask, including its very faint cloud edges.
    x = left * page_width / preview.width - 4
    y = top * page_height / preview.height - 4
    width = (right - left) * page_width / preview.width + 8
    height = (bottom - top) * page_height / preview.height + 8
    root.set("viewBox", f"{x} {y} {width} {height}")

    for output_width in widths:
        output_height = round(output_width * height / width)
        image = render(root, output_width, output_height)
        target = ART / f"{name}-{output_width}.webp"
        image.save(target, "WEBP", lossless=True, method=6)
        print(f"{target.name}: {image.width} x {image.height}, {target.stat().st_size:,} bytes")

        if atmosphere:
            # Only translucent pixels belong to the cloud outside the globe.
            # Reduce their opacity smoothly; every opaque clock pixel stays
            # identical to the original PDF render, including the cloud over it.
            blended = image.copy()
            blended.putalpha(image.getchannel("A").point(
                [round(255 * (a / 255) ** 1.8) for a in range(256)]
            ))
            target = ART / f"{name}-blended-{output_width}.webp"
            blended.save(target, "WEBP", lossless=True, method=6)
            print(f"{target.name}: {target.stat().st_size:,} bytes")

    if atmosphere:
        clouds = deepcopy(root)
        # The PDF's two masked groups are the original watercolor layers.
        # Exclude the vector globe so no blue/green blur leaks into the sky.
        for child in list(clouds):
            if not child.tag.endswith("defs") and not child.get("mask"):
                clouds.remove(child)
        assert len(clouds) == 3, "Inspect PDF cloud groups before exporting"
        cloud_width = 640
        cloud_height = round(cloud_width * height / width)
        cloud = render(clouds, cloud_width, cloud_height)
        pad_x, pad_y = cloud_width // 4, cloud_height // 4
        wash = Image.new("RGBA", (cloud_width + 2 * pad_x, cloud_height + 2 * pad_y))
        wash.alpha_composite(cloud, (pad_x, pad_y))
        # Premultiply before blurring to avoid dark fringes in transparent areas.
        wash = wash.convert("RGBa").filter(ImageFilter.GaussianBlur(36)).convert("RGBA")
        wash.putalpha(wash.getchannel("A").point(lambda a: min(255, round(a * 1.7))))
        target = ART / "earth-atmosphere.webp"
        wash.save(target, "WEBP", quality=90, method=6)
        print(f"{target.name}: {target.stat().st_size:,} bytes")


if __name__ == "__main__":
    export(f"{SOURCE}.pdf", "solastalgia-title", [2400], remove_page=True)
    export(f"{SOURCE} (1).pdf", "earth-clock", [800, 1600], atmosphere=True)
