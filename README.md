# FitCheck

A field tool for furniture sales reps. Measure a room wall by wall, see which furniture fits,
and build a quote per room. It is a single web page with no server: open it in any phone or
computer browser.

**Status:** prototype. The built-in catalog is sample data: 26 real IKEA UK products with their
published sizes and prices (collected 22 Oct 2026, sources in `docs/SAMPLE_CATALOG.md`). It is
there to show how the app works; the furniture house's own catalog replaces it. FitCheck is not
connected to IKEA. Each device keeps its own visits in the browser; nothing is shared between reps yet.

## Use it
- Open `fitcheck.html` (or the hosted link) in a browser. On a phone, use the browser's
  "Add to Home Screen" to keep it like an app.
- Load real products with **More options → Import CSV** (step 4). The format is in `catalog-template.csv`:
  one row per size, and rows with the same `group` are the sizes of one product.
- Automated checks: serve the folder (`python3 -m http.server 8766`), open `http://localhost:8766/fitcheck.html`, and run
  `await (await import('./tests/e2e.js')).run()` in the browser console. The 3D checks need an internet connection.

## Files
| File | What it is |
|---|---|
| `fitcheck.html` | The app (HTML, CSS and JavaScript in one file) |
| `index.html` | Redirects the site's home address to the app |
| `catalog-template.csv` | Catalog format to send to the furniture house |
| `view3d.js` | The 3D view, loaded when the 3D view button is pressed (uses three.js from a CDN) |
| `tests/e2e.js` | End-to-end checks that run inside the page |
| `tools/make_artifact.py` | Builds the claude.ai preview version into `dist/` |
| `docs/HANDOFF.md` | Project state, decisions, limits and next steps |
| `docs/SAMPLE_CATALOG.md` | Where each sample product's size and price comes from |
