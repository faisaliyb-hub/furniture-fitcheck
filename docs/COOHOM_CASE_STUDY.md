# Case study: Coohom Floor Planner

Written 2026-10-30, before upgrading FitCheck, using Coohom as inspiration.
Sources are listed at the end. Coohom's own pages are marketing. Review sites and competitor blogs are marked where they may be biased.
The Coohom editor itself was **not** opened: it needs an account. Editor details come from Coohom's help centre.

## 1. Who they are
- **Company:** Coohom (launched 2018) is the international version of Kujiale, made by Manycore Tech (Hangzhou, China). Manycore listed on the stock exchange on 17 April 2026.
- **Scale:**
  - Customers in 200+ countries.
  - Rated 4.4/5 on G2 (about 130 reviews).
  - Claims "600,000+ 3D models and decor options".
- **Who it is for:** interior designers, kitchen and closet specialists, furniture brands and retailers, and developers. Its first North American showing was at the High Point furniture market.
- **Product lines:** Interior Design, Kitchen & Closet, House Design, AIHOM (AI), SnapIt, Photo & Video Studio (product shots without a photographer), 3D viewer and AR for shop websites.

## 2. The floor-planner workflow (what the page shows)
1. **Start:** upload a plan (.jpg/.png/.webp/.pdf/.dwg/.dxf) and let the AI draft the walls, doors and windows; or start blank; or pick a template.
2. **2D editing:**
   - Draw walls. Rooms appear only when the walls form a closed loop. A Rectangle Wall tool gives quick rooms.
   - Set exact sizes, units and wall thickness.
   - Openings:
     - Doors: single, double, sliding.
     - Windows: straight, bay, French.
     - Plain openings.
   - Room name and type are set in a side panel.
   - An eye icon shows or hides measurements, room names, areas and furniture.
3. **Furnish and check in 3D:**
   - Drag, resize and rotate pieces.
   - Switch to 3D to check proportions.
   - Multi-floor: stairs, balconies, site plan.
4. **Save and export:**
   - Projects are kept on a dashboard.
   - Export a 2D plan with room names, scale bar and wall measurements.
   - Export renders up to 4K, 360° panoramas, and a share link for remote presentations.

## 2b. Hands-on (2026-10-30, free Basic account, editor "Design tool V5.0", desktop 1440 x 900)
- **Dashboard:**
  - Three big start cards: **Upload your drawing** (marked Recommended; CAD or image), **Draw from scratch**, **Idea templates**.
  - Below them, AI Studio: AI image from a photo, AI 3D model maker, AI layout.
  - A plan box shows "Project 0/3", "1K render: Unlimited", "AI Studio: Inactive".
- **Hard selling:** five upgrade or sale popups in about 15 minutes, including:
  - a "Join Pro" checkout that opened by itself on the first project click;
  - a Halloween sale;
  - a "Hello new creator, only valid today" offer.

  On top of those came several "Got it" tips. A customer watching a rep would see all of this.
- **Draw from scratch** starts with a ready room (a 5.0 x 6.8 m bedroom with a door and window) rather than an empty page. A 3-step loading card explains the flow: draw the floor plan, drag and drop furniture, render.
- **Layout:**
  - Left: tool groups.
    - Import floor plan.
    - Draw room: straight, rectangle and arc walls, outside area.
    - Doors and windows: door, window, bay window, opening.
    - Structures: column, beam, staircase, flue, floor opening, partition, niche.
  - Middle: the plan.
  - Right: a live mini 3D (or mini 2D when in 3D) plus a settings panel for the selected item.
  - Bottom bar: floor (1F), 2D/3D, eye (display), lock, zoom.
- **A wall:**
  - Tapping it shows a small floating toolbar (split, move, align, hide, lock, delete).
  - The panel has type, location line, **thickness 240 mm**, height 2800 mm, length.
  - Measurements then show the pieces of that wall between the openings.
- **A door:**
  - The menu offers single, double, sliding, unequal double, door frame.
  - While you move it, it **snaps into the wall** and shows **live distances to both corners**; one is a box you can type into.
  - One click places it.
- **Display (eye) menu:** 15 switches: ceiling, structure, furniture, custom product, room name, area, dimension, 2D distance, label, wall dimension, legend, floor reference, modelling, protruding value, wall style. Thorough but heavy.
- **Floors:** "New upper floor" / "New lower floor" in the side panel. Room height and slab thickness are set per floor.
- **Furniture library:**
  - Keyword search, **search by photo** (camera icon).
  - Colour and style filters.
  - Popular / Brands / Recommended.
  - Categories by room (living, bedroom, dining, kitchen, bathroom, kids, office…); 105 pages.
  - After you pick a piece, it follows the pointer with **lines to all four walls showing the gaps**.
- **AI modeler:** upload one product photo and get a 3D model (made by Tripo 3D, a third-party AI service), "1 free trial". This is what we do by hand in Blender.
- **Render studio:**
  - Resolutions: 2K free; 3K (25 left), 4K (3), 8K (3), 12K (1); 16K and 32K locked.
  - Light presets (indoor daytime/nighttime, fast/realistic).
  - Camera height, saved views, "Smart angle".
  - A 360° panorama offer.
- **File menu:** New, Save, Save as, Restore historical versions. Saves are online.
- **Couldn't test:**
  - Dragging real furniture in: the canvas ignored my simulated drag and clicks, so it needs real mouse movement.
  - Uploading a plan: it opens the computer's file picker.
  - AI layout: it would spend the one free trial.
- **Feel:** powerful, but built for a designer at a desk with a mouse. Small icons, dense panels, hover menus (no hover on an iPad) and many popups. Nothing about it suits a rep standing in a customer's living room with a tablet.

### What to copy from the hands-on
1. **Door and window placing:** the opening snaps into the wall, live distances to both corners while moving, tap a distance to type it.
2. **Gap lines from a piece to the walls while moving it.** We show red warnings; showing the gap in cm is better.
3. **Wall panel with thickness and height,** and wall lengths split at openings.
4. **Start with a ready room, not an empty page.** We already do this; keep it.
5. **New upper floor** as one button.
6. **Search the catalogue by photo** (later; useful when a customer shows a picture).
7. **What not to copy:** popups, hover menus, 15 display switches. One simple "Clean plan / Measured plan" switch is enough for a rep.

## 3. Pricing
| Plan | Price | What it adds |
|---|---|---|
| Basic | $0 | Core planner. Limited uploads, **3 projects**. Watermarks and limited exports (per a third-party review). |
| Pro | $29/mo | More model uploads, branded content, high-resolution output. |
| Elite | $69/mo | Small team shares projects and model library. |
| Enterprise | Contact sales | Brands and retailers. |

Annual billing is offered. There are no refunds for partly used months.

## 4. What users say
- **Liked:**
  - Ease of use (most-cited pro on G2).
  - Fast, realistic renders.
  - Everything in one browser tab.
  - Catalogue pieces linked to real products.
- **Disliked:**
  - Too many features for beginners. One estimate is 1 to 3 hours to finish a first full scene.
  - Drafting is weak compared with the renders (Capterra).
  - Slow at times.
  - The model library lacks brands and is often out of date.
  - Online only.
  - Awkward on phones and tablets.
  - Free tier is limited.
  - Billing complaints.
- **Bias note:** the "1 to 3 hours" and "awkward on mobile" points come from GenRoom, a competitor's blog.

## 5. What they do well (worth copying)
1. **Many ways to start:** plan upload, template or blank. Nobody faces an empty screen.
2. **Plan upload with auto-drafting:** the biggest time saver for real homes that already have a plan.
3. **Openings as proper objects:** doors, windows and openings are typed, placed on walls and sized.
4. **One display toggle** for measurements, names, areas and furniture: a clean plan for the customer, a detailed one for the rep.
5. **Whole home, several floors,** in one project.
6. **Outputs a customer keeps:** a measured 2D plan, renders, a panorama and a share link.
7. **A project dashboard:** saved work you can find again.

## 6. Where they are weak (where FitCheck can win)
| Coohom | FitCheck today | Our edge |
|---|---|---|
| Built for designers at a desk; a learning curve | Built for a rep with a customer on an iPad, three steps | Keep it simple: every new feature must work with one finger |
| Generic library; brands complain their models are missing | The store's own catalogue: real sizes, prices, original photos, 3D models built from the photos | The customer sees **this store's** product, not a look-alike |
| No quote | Instant quote and Share | From room to price in one visit |
| Fit is checked by eye | Red warnings: sticks out, overlaps, door swing, too tall; pieces kept inside the room | We tell the rep it doesn't fit |
| Online only, account required | Works in the browser with no account; data stays on the device | Works anywhere on site |
| Paid tiers, watermarks | Free, the store's brand | No limits for reps |

## 7. Gaps in FitCheck that the case study shows
1. **No plan upload.** A rep cannot start from the architect's or estate agent's plan.
2. **Doors and windows** are set per room afterwards, not on the house drawing. Window types are limited, and wall thickness is not drawn.
3. **No whole-house 3D.** 3D is one room at a time. No floors, stairs or balcony.
4. **Exports:** no measured 2D plan (PDF/PNG) to give the customer, and no share link or panorama.
5. **No project dashboard with backup.** Visits live in one browser and can be lost.
6. **No templates** to start from.
7. **No display toggle** (measurements, names, areas).

## 8. Suggested upgrade order (for the user to decide)
1. **Plan upload and tracing,** plus a **measured 2D plan export:** biggest value for reps, works offline. Auto-detecting walls can come later.
2. **Doors and windows on the house drawing,** wall thickness, display toggle.
3. **Whole-house 3D and floors.**
4. **Projects dashboard with backup/restore, and templates.**
5. Later, needs a server: share links and panoramas, team sharing (ties in with the Supabase idea in HANDOFF).

## Sources
- Coohom floor planner page: https://www.coohom.com/case/floor-planner
- Coohom home page: https://www.coohom.com/
- Coohom pricing: https://www.coohom.com/pricing
- Coohom help centre (upload plans from images/PDF): https://www.coohom.com/helpcenter/guide-for-uploading-cad-floor-plan-by-images-pdf
- Coohom help centre (walls, doors, windows): https://www.coohom.com/helpcenter/3FO4K4WBWNAK
- Coohom release notes (display toggle, panorama sharing): https://www.coohom.com/de/helpcenter/2023-august-what-s-new
- Manycore Tech (Wikipedia): https://en.wikipedia.org/wiki/Manycore_Tech
- Furniture Today on Kujiale/Coohom funding: https://www.furnituretoday.com/furniture-retailing/parent-of-tech-company-coohom-raises-funding
- EqualOcean, Coohom at High Point Market: https://equalocean.com/news/201901081243-kujiale-goes-international-coohom-debuted-high-point-market
- G2 reviews: https://g2.com/products/coohom/reviews
- Capterra reviews: https://www.capterra.com/p/192882/Coohom/reviews/
- GenRoom review (competitor's blog, biased): https://genroom.io/blog/coohom-review-best-alternatives
