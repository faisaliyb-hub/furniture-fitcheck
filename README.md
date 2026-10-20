# FitCheck

A field tool for furniture sales reps. Measure a room wall by wall, see which furniture fits,
and build a quote per room. It is a single web page with no server: open it in any phone or
computer browser.

**Status:** prototype. The furniture catalog is sample data with typical sizes, not a real
manufacturer's catalog. Each device keeps its own visits in the browser; nothing is shared
between reps yet.

## Use it
- Open `fitcheck.html` (or the hosted link) in a browser. On a phone, use the browser's
  "Add to Home Screen" to keep it like an app.
- Load real products with **Import CSV**. The format is in `catalog-template.csv`.

## Files
| File | What it is |
|---|---|
| `fitcheck.html` | The app (HTML, CSS and JavaScript in one file) |
| `index.html` | Redirects the site's home address to the app |
| `catalog-template.csv` | Catalog format to send to the furniture house |
| `tools/make_artifact.py` | Builds the claude.ai preview version into `dist/` |
| `docs/HANDOFF.md` | Project state, decisions, limits and next steps |
