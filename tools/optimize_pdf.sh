#!/usr/bin/env bash
#
# Optimize a PDF for direct in-browser reading with pdf.js.
#
# Two things happen:
#   1. Embedded raster images (photos, graphics) are downsampled to a sane
#      screen resolution and re-compressed. Body text in these issues is vector,
#      so it stays crisp at any setting -- only images are affected.
#   2. The output is linearized ("fast web view" / -dFastWebView=true) so pdf.js
#      can fetch just the bytes for the page in view via HTTP range requests
#      instead of downloading the whole file.
#
# Real result on reuby2.pdf: 151.8 MB -> 22 MB at 300 dpi (6x smaller), with no
# visible quality loss versus the original 300 dpi PNG pipeline it replaces.
#
# Usage:
#   ./optimize_pdf.sh input.pdf [output.pdf] [dpi]
#
# Defaults: output = <input>-web.pdf, dpi = 300 (full quality).
# Use a lower dpi (e.g. 250 or 200) for smaller files if you don't need full
# image fidelity.
#
# Requires: ghostscript (gs). No qpdf needed -- gs linearizes via FastWebView.

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 input.pdf [output.pdf] [dpi]" >&2
  exit 1
fi

input="$1"
if [ ! -f "$input" ]; then
  echo "Error: '$input' not found." >&2
  exit 1
fi

base="$(basename "${input%.*}")"
output="${2:-${base}-web.pdf}"
dpi="${3:-300}"

if ! command -v gs >/dev/null 2>&1; then
  echo "Error: ghostscript (gs) is required but not installed." >&2
  exit 1
fi

echo "Optimizing '$input' at ${dpi} dpi -> '$output' ..."

gs -sDEVICE=pdfwrite -dPDFSETTINGS=/printer \
   -dDownsampleColorImages=true -dColorImageResolution="$dpi" -dColorImageDownsampleType=/Bicubic \
   -dDownsampleGrayImages=true  -dGrayImageResolution="$dpi"  -dGrayImageDownsampleType=/Bicubic \
   -dDownsampleMonoImages=true  -dMonoImageResolution="$((dpi * 2))" \
   -dColorImageDownsampleThreshold=1.0 -dGrayImageDownsampleThreshold=1.0 \
   -dAutoFilterColorImages=false -dColorImageFilter=/DCTEncode \
   -dCompatibilityLevel=1.6 -dFastWebView=true \
   -dNOPAUSE -dBATCH -dQUIET \
   -o "$output" "$input"

orig_mb=$(echo "scale=1; $(stat -c%s "$input")/1048576" | bc)
out_mb=$(echo "scale=1; $(stat -c%s "$output")/1048576" | bc)
echo "Done: ${orig_mb} MB -> ${out_mb} MB"
echo "Linearized for web (verify with: pdfinfo '$output' | grep Optimized)"
