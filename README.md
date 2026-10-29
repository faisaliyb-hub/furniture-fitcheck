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
- Three screens: **Measure** (room type and size), **Furniture** (plan, what fits, 3D) and **Quote**. The settings icon
  (top right) shows the advanced controls.
- **Select:** on the room plan, **Select** then tap pieces (or **All**) and **Remove** them in one go.
- **View before adding:** each catalogue card has a small **View**: the store's own photos of that product full screen (swipe through them, tap to zoom), with its size, price and **Add to room**.
- **Draw it freely:** on Measure, **Draw this room** or **Draw the whole house** opens a drawing board. Draw with a finger
  (lift it and carry on): wobbly lines are straightened, curves become clean arcs, and the grid (one square = 50 cm) gives
  rough sizes. Tap a wall to type its real length; the plan stretches to it, and a wall shared by two rooms is measured
  once. In whole-house mode every enclosed area becomes a room of the visit.
- **Built-in catalogue:** the app opens with **Baffi Home Furniture**'s Noval-and-more test catalogue (`packs/baffi-noval.zip`: 16 sets and 10 pieces with Baffi's photos and naira prices, sizes estimated and marked "size to confirm", and 3D models of the Noval sofa, armchair and centre table made in Blender from their photos). Shown with Baffi's permission (2026-10-28). Settings icon on Furniture: **Use sample** switches to the IKEA samples, **Use built-in catalogue (Baffi)** switches back.
- Load a company's own products with **settings icon → Import company pack (.zip)** (Furniture screen): its catalog,
  material photos and 3D files for its furniture, wall panels, wallpaper and doors. How to make one: `docs/COMPANY_PACK.md`;
  an example is `samples/sample-company-pack.zip` (**Try sample company pack** in the app). Anything the company does not
  make stays generic, in the colour the rep picks, and is not priced. A catalog alone can still be loaded with **Import CSV**
  (format in `catalog-template.csv`).
- Automated checks: serve the folder (`python3 -m http.server 8766`), open `http://localhost:8766/fitcheck.html`, and run
  `await (await import('./tests/e2e.js')).run()` in the browser console. The 3D checks need an internet connection.

## Files
| File | What it is |
|---|---|
| `fitcheck.html` | The app (HTML, CSS and JavaScript in one file) |
| `drawplan.js` | The drawing board (free drawing of one room or a whole house), loaded when it opens |
| `index.html` | Redirects the site's home address to the app |
| `catalog-template.csv` | Catalog format to send to the furniture house |
| `view3d.js` | The 3D view, loaded when the 3D view button is pressed (uses three.js from a CDN) |
| `tests/e2e.js` | End-to-end checks that run inside the page |
| `tools/make_artifact.py` | Builds the claude.ai preview version into `dist/` |
| `docs/HANDOFF.md` | Project state, decisions, limits and next steps |
| `docs/SAMPLE_CATALOG.md` | Where each sample product's size and price comes from |
| `assets/3d/` | Free (CC0) textures and light file used by the 3D view and Photo; see `docs/ASSETS.md` |
| `docs/ASSETS.md` | Where each 3D asset comes from and its licence |
| `docs/COMPANY_PACK.md` | How a company makes its pack: zip contents, catalog columns, photo tips, 3D models |
| `packs/baffi-noval.zip` | The built-in Baffi catalogue the app loads by itself (shown with Baffi's permission) |
| `samples/sample-company-pack.zip` | A complete example pack (made-up company and prices) |
