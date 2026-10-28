# Company pack: put your own products in FitCheck

A company pack is one **.zip file** with your catalog and the pictures (and 3D files, if you have them) of what you make:
furniture, wall panels, wallpaper and doors. FitCheck then shows your products in the plan, the 3D view, Photo
and the quote. Everything else in the room (paint, a plain door, furniture you do not make) stays generic: the rep
picks a colour, it is drawn in the room, and the quote lists it under "Not supplied (layout only)" with no price.

Try it: in the app, open the settings icon on the Furniture screen and tap **Try sample company pack**, or download
`samples/sample-company-pack.zip` to see a complete example. **Use sample** puts the built-in samples back.

## What goes in the zip

| File | Needed | What it is |
|---|---|---|
| `catalog.csv` (any name ending in `.csv`) | Yes | One row per product, or per size of a product (columns below) |
| `company.json` | No | `{"name": "Your company"}`: the name shown over your products. Without it, the zip's file name is used |
| Photos: `.jpg`, `.png`, `.webp` | No | Material photos, named in the `texture` column |
| 3D files: `.glb` | No | One model per product, named in the `model` column. Use `.glb` (one file); a `.gltf` that needs separate files will not load from a pack |

Folders inside the zip are fine; files are matched by their name only, so every file name must be different.

**Where it is kept:** on the phone or tablet that imported it (in the browser's storage), so it is still there next
time, also offline. Each rep imports the same zip once. Nothing is uploaded anywhere.

## The catalog columns

Copy the full template from the app (settings icon → **Copy template**) or use `catalog-template.csv`. Save from
Excel or Google Sheets as **CSV UTF-8**. Sizes are in centimetres. Empty cells are fine where a column does not apply.

| Column | For | What to put |
|---|---|---|
| `kind` | all | `furniture` (the default when empty), `panel`, `wallpaper`, `door` or `set` |
| `sku` | all | Your product code. Each row needs its own |
| `name` | all | The name reps and clients see |
| `width_cm`, `height_cm` | all | Furniture: outer size. Panel: one panel. Wallpaper: roll width and roll length (e.g. 53 and 1005). Door: the door leaf |
| `depth_cm` | furniture (needed), door | Front to back. Panels and wallpaper leave it empty |
| `price` | all | Per piece, per panel, per roll or per door. Empty means 0 |
| `front_clearance_cm` | furniture | Free space needed in front (to sit, open doors). Default 50 |
| `type` | furniture | `bed`, `sofa`, `chair`, `table`, `side`, `storage` (or empty). Decides the 3D shape and where it is placed first |
| `rooms` | furniture | Where it usually goes, e.g. `living\|bedroom`. Only changes the order of the list; any piece can go in any room |
| `group`, `size` | furniture | Rows with the same `group` are sizes of one product (e.g. 2-seat and 3-seat), each with its own `sku` and price. `size` is the size's name |
| `finish` | furniture | Words like `oak`, `white`, `green velvet fabric`. Used for the colour when there is no photo |
| `texture` | all | A photo file in the zip (or a web link): the material that covers the product |
| `model` | furniture | A `.glb`/`.gltf` file in the zip (or a web link). It is scaled to the catalog size |
| `color` | all | A colour like `#b98a5e`, used on the plan and until the photo loads |
| `style` | door | `flat`, `panel`, `fluted`, `glass` or `geometric`: the shape drawn when there is no photo |
| `repeat_cm` | wallpaper | Pattern repeat. It adds waste to the roll count (0 or empty for plain paper) |
| `photo` | furniture, set | A product photo in the zip (or a web link), shown on the product's card in the catalogue |
| `estimated` | furniture | `yes` when the size is not measured yet. The card, the size panel and the quote then say "size to confirm" |
| `pieces` | set | What the set is made of: `sku*count` separated by `\|`, e.g. `SOFA3*2\|ARM*2\|CT*1`. Each piece is its own furniture row |

**Sets** (e.g. a sofa set 3+3+1+1 with a centre table, or a dining table with 6 chairs) are sold as one: give the `set` row
its `name`, `price`, `photo`, `rooms` and `pieces`, and no sizes. Give each piece a furniture row with its real size; a piece
with no `price` is sold only in its set and is not listed on its own. Adding a set places every piece in the room (the bed,
sofa or dining table first, then its bedside drawers, centre table or chairs round the table), and the quote shows one line at
the set price.

When something is wrong, nothing is imported and the app lists the rows to fix (for example "Row 7 (DF-WP-TREL):
texture "trellis.png" is not in the pack").

## How quantities are worked out
- **Panels:** wall area minus door and windows, divided by one panel's area, plus 10% for cuts.
- **Wallpaper:** strips across the wall width; strips per roll from the wall height plus the pattern repeat.
- **Paint (generic):** area minus openings, 2 coats, 12 m² per litre, whole 2.5 L tins.

## Photos that look real
- **Shoot the material, not the product:** a straight-on photo of a flat piece of the wood, fabric, panel face or door
  front, filling the frame, in soft even daylight (no flash, no shadows, no reflections).
- **Panels and wallpaper:** the photo should show exactly one panel, or one pattern repeat of the wallpaper. FitCheck
  repeats it across the wall at its real size (`width_cm` across, `height_cm` or `repeat_cm` up).
- **Doors:** a photo of the whole door front, cropped to its edges. It covers the door leaf.
- **Furniture:** a close photo of the main material. It covers the whole piece, so it suits one-material pieces
  (wood, one fabric). For pieces with several materials, a 3D model is better.
- **Size:** 1000 to 2000 pixels on the long side, `.jpg` around 200–500 KB each. Big files make the pack slow to open on
  phones.

## 3D models from product photos
FitCheck draws a simple stand-in shape for furniture without a model. For the real shape you need a `.glb` per product.
If you have no 3D files, they can be made from photos:
- **AI photo-to-3D tools** (for example Meshy, Tripo, Rodin, Hunyuan3D; prices, terms and quality not checked yet):
  3–4 photos of the product from different sides on a plain background give a `.glb`. Check each model before use.
- **A 3D modeller** (paid), from photos and measurements: best quality.
- Keep each model under about 5 MB. Size does not matter: FitCheck scales it to `width_cm`, `depth_cm` and `height_cm`.

## Not yet
- Tiles (floors and walls) with real cutting.
- Tapping a door or wall in 3D to change it (today it is chosen on the Furniture screen: **Door style** and **Wall finish**).
- Sharing a pack between reps automatically (each device imports the zip; needs the shared backend).
