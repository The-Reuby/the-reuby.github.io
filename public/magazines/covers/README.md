# Issue cover images

Drop one cover image per issue here, named by the issue's `slug`:

```
reuby1.png
reuby2.png
reuby3.png
reubyte.png
```

These are the thumbnails shown on the Home and Archive issue cards. They used to
be pulled from each issue's `000.png`, but the per-page PNGs were removed when the
reader switched to rendering the optimized PDFs directly.

- Default lookup is `/magazines/covers/<slug>.png`.
- To use a different filename/extension (e.g. `.jpg`), set a `cover` field on the
  issue in `public/data/issues.json`, e.g. `"cover": "/magazines/covers/reuby2.jpg"`.
- Recommended aspect ratio ~3:4 to match the card layout.
