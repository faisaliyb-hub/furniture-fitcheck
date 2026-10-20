# FitCheck: Handoff

Last updated: 2026-10-19. Phase: **idea / early prototype** (Phase 1 prototype built, not yet shown to the client).

## Goal
A furniture house wants a system for its field marketers/sales reps to measure spaces and show which products fit. Wider hopes: architect-friendly files, marketing visibility. The client's name, furniture category, and team size are **not yet known**.

## Decisions so far
- Interpreted "measurement" as **field measuring + fit checking + quoting** (not marketing analytics). Analytics comes later via lead tracking (Phase 3).
- Approach: **web app (PWA-style) first**, works on iPhone and Android. Reps use a mix of both.
- Furniture covers everything (loose, fitted, office/contract), and all pain points matter (wrong measurements, slow quotes, architects not specifying products). Fitted pieces (kitchens, wardrobes) need a stricter "verified measurement" step later, not in v1.
- Client reportedly has **no existing systems** (no room planner, CRM, or quoting tool). Unconfirmed, so ask them.
- Recommendation: build our own lean tool and pilot it with 2-3 reps for 2-4 weeks, instead of buying a white-label planner.

## Phases (plan)
1. **Measure, fit, quote** (prototype built)
2. **Architect kit:** DXF/DWG blocks and BIM/IFC objects, simple download portal
3. **Insight dashboard:** visit, lead, quote and sale linked
4. **Scan and AR:** iPhone LiDAR, true-scale 3D placement

## What exists
- `fitcheck.html`: single-file prototype, no build step. Open in any browser. Saves state in localStorage.
  - Inputs: room width/length, door wall/width/height/offset (all cm)
  - 9 **placeholder** catalog products (sizes, clearances, prices are made up)
  - Top-down scaled plan, drag to move, snap to walls, rotate, remove
  - Checks: out of room, overlap, door-swing blocked, front clearance, clearance zone blocked, door access (rough rule: two smallest dimensions vs door width and height)
  - PDF quote via the browser print dialog
- **CSV catalog import (added 2026-10-19):** `catalog-template.csv` is the template to give the client. Columns: `sku,name,width_cm,depth_cm,height_cm` (required), `front_clearance_cm` (default 50), `price` (default 0). The app has Import CSV, Template (download), and Use sample buttons, plus search by name or SKU. The catalog is saved in localStorage (`fitcheck-catalog`).
  - Validation: all-or-nothing. If any row is bad (missing sku/name, duplicate sku, dimensions not in 0-1000 cm, negative price, clearance outside 0-300) the whole import is rejected with row-numbered messages and nothing changes.
  - Accepts BOM, CRLF, quoted commas and `;` separators. Decimal commas (e.g. `12,5`) are **not** supported: use a dot.
  - Placed items whose SKU is not in a newly imported catalog are removed, and the app says how many.
- **True-scale drawing and remaining space (added 2026-10-19, after user feedback that pieces must show real size and only take their own space):**
  - Each piece is drawn at exactly its catalog footprint (outline kept inside the edge, so a 220 x 95 sofa measures 220 x 95 on the plan; verified by measuring the drawn rectangles). The label shows name and footprint size. A 100 cm scale bar sits under the plan.
  - Clearance zones are no longer drawn as part of the piece: they show as a separate orange zone only for the selected piece, or for all pieces with the "Show all clearance zones" box. The fit checks still use them.
  - Selecting a piece draws the free distance (cm) to the nearest wall or neighbouring piece on all four sides.
  - New "Space" card: room floor m2, furniture footprint m2 and %, free floor m2. For the selected piece it lists the four free gaps and has two inputs (gap from left wall, gap from top wall) to place it at an exact position. Free area is approximate if pieces overlap (the app says so). The quote shows the free floor space too.
  - Print fix: the quote now uses fixed light colours so it prints correctly even in dark mode.
  - **Limit:** the real furniture sizes still come from the catalog. They are placeholders until the furniture house returns real dimensions in `catalog-template.csv`. The drawing is exact only as far as that data is.
  - Gaps are measured along the piece's centre line to the nearest obstacle with overlapping extent. They do not account for door swing or wall features (windows, radiators, columns), which the app does not model yet.
- **Automatic suggestions (added 2026-10-19, user request: every final measurement should suggest what fits):** new "What fits" card. For the current room and the pieces already placed it lists every catalog item that fits, with an **Add** button that places it at the best spot (back to a wall where possible, rotated so its front faces into the room). Hovering a row (desktop) previews the spot on the plan. Items that do not fit are in a collapsed "Does not fit" list with a reason (too big, or fits only without its front clearance). Also shows the largest free rectangle.
  - Rules are the same as the fit checks (inside room, no overlap, door swing clear, front clearance inside the room and clear of other pieces, nobody else's clearance hit). Verified: every suggested spot produced no warnings in `check()` except the door-access note.
  - Ranking: pieces that pass the door rule first, then biggest footprint. Pieces that may not get through the door are tagged "check door access" but still listed.
  - It recalculates 120 ms after any change. Search grid is 5 cm (10 cm for catalogs over 40 items) plus wall and neighbour edges, so exact tight fits are found. **Not yet performance-tested with a large real catalog (hundreds of items).**
  - Limits: it suggests single pieces, not whole room sets (e.g. sofa + coffee table + TV unit), and does not know room style, windows, radiators or columns.
- **Wall placement fix (added 2026-10-19, after user feedback "when I put a wardrobe all the space is gone"):** cause was that catalog items were dropped in the room centre, so a 200 x 60 wardrobe used 7% of the floor but cut the room in two, and the sofa and dining table stopped fitting. Now a piece added from the catalog goes to the best spot (back to a wall, front facing into the room, same rules as the suggestions); it falls back to the centre only if nothing else works. New **Move to wall** button for the selected piece. A tip appears when a piece is away from all walls. Verified: wardrobe at a wall leaves the sofa and dining table fitting; adding sofa, TV unit, armchair and dining table gave zero warnings.
  - The first placement picks the first good spot, not the best layout for the room. Arranging a whole room sensibly (bundles, zones) is not built.
- **Realistic proportions and furniture shapes (added 2026-10-19, user feedback: coffee table was too big next to the sofa, armchair should be smaller):**
  - The drawing scale was already exact, but the sample sizes made pieces look alike (armchair 85 x 90 vs sofa 95 deep, coffee table 120 wide). Sample catalog is now 13 pieces with typical sizes: 3-seat sofa 210 x 92, 2-seat sofa 150 x 90, armchair 76 x 80, coffee table 100 x 55, side table 45 x 45, dining table 180 x 90, dining chair 45 x 50, queen bed 160 x 210, nightstand 45 x 40, wardrobe 200 x 60, TV unit 160 x 40, bookshelf 90 x 35, desk 140 x 70 (cm).
  - **These sizes are my general-knowledge typical values, not sourced from any manufacturer or standard. Treat them as placeholders until the furniture house sends real dimensions.**
  - Front clearances made realistic: sofa 45 cm (so a coffee table about 45 cm away is fine), coffee table 35, side table 0, nightstand 40, wardrobe 80.
  - Each piece now shows a top-down detail by type (sofa: back, arms, seat cushions; armchair; table with inset top; side table round; bed with pillows; storage with door lines). New optional CSV column `type` (sofa, chair, table, side, bed, storage); if empty the type is guessed from the name. An invalid type rejects the import with a row message. `catalog-template.csv` now has this column.
  - Limit: suggestions and auto-placement do not pair pieces (a nightstand is not placed beside the bed, a coffee table not in front of the sofa). That needs set logic, not built.
- **Rooms with names and types (added 2026-10-19, user feedback: "it should be indicated which measurement is for which room, a bedroom or a living room"):** the app held one anonymous room. A visit now has several rooms.
  - "Rooms in this visit" card: one chip per room (name, type, size), **+ Add room**, **Delete room**, room name and room type (living room, bedroom, dining room, home office, kids' room, other). Each room keeps its own size, door and layout. Headings show which room you are measuring ("Measurements for: Master bedroom", "Layout: Master bedroom (Bedroom)", "Master bedroom (Bedroom): what fits").
  - Suggestions and the catalog are room-aware: pieces suited to the room type come first; others are dimmed in the catalog and tucked under "Also fits, but usually for other rooms". Suitability comes from a new optional CSV column `rooms` (values from living, bedroom, dining, office, kids, separated by `|`; empty = suits every room). Room type "other" shows everything. **The room tags in the sample catalog are my placeholder guesses.**
  - Quote: the on-screen quote lists each room with its own table and a visit total. The PDF has a "Room measurements" table (room, type, size, door), then per room: items, plan drawing, fit notes, and the grand total. The PDF is built when you press the button.
  - Old single-room saves migrate into "Room 1". Catalog import removes missing SKUs from every room, not just the active one.
  - Verified in the browser: 2-room visit (living room + bedroom) keeps separate data when switching, totals add up (5,490 = 2,720 + 2,770), room data survives a reload, invalid `rooms` value rejected, deleting a room works.
  - **Not built / limits:** no "essential pieces" checklist per room type (e.g. "a bedroom normally needs a bed and wardrobe"), no pairing (nightstands beside the bed), no room photos, no per-room notes, no copying a room.
  - Not tested: PDF output of a multi-room quote through a real print dialog, and phone layout of the room chips.
- **Room shapes and fixed features (added 2026-10-19; this was item 1-2 of the "outcomes we might not have considered" list):** a new "Room shape and features" card, per room.
  - **Cut-outs** remove rectangles from the overall width x length, giving L, U or T shaped rooms (drawn hatched). **Columns, radiators, built-in units, stairs and other doors (swing area)** block the floor and can be dragged on the plan. **Low ceiling zones** (max height) and **windows** (wall, offset, width, sill height) do not block the floor but limit piece height: a piece taller than a low zone is an error; a piece taller than the sill standing within 20 cm of the window is a warning. New **ceiling height** field per room: a piece taller than the ceiling is an error and is never suggested.
  - Field labels (changed 2026-10-20, the user did not understand X / Y): position fields are **From left side** and **From top side** (distance on the plan to the feature's top-left corner), size fields are **Width (across)** and **Depth (down)**, a window's offset is **From wall corner**. The card explains this and that features can be dragged on the plan instead. Still open: "left/top side" means the plan's sides, which are not real compass directions and depend on where the rep started measuring.
  - Everything follows through: fit checks, free-space gaps (a column or cut-out counts as a neighbour), the largest-free-area figure, the suggestions and auto-placement (back against a wall or fixed block, never in a cut-out, not in front of a window if tall, not under a low zone), and the Space card (room floor without cut-outs, fixed features, furniture, free). Pieces snap to fixed features when dragged. The PDF lists each room's features and ceiling height.
  - Verified in the browser: L-shape area (171,000 - 30,000 = 141,000 cm2), column area, sofa in a cut-out rejected, no invalid suggestions in an L-shaped room, window and low-ceiling and ceiling-height rules, old saves without these fields still load.
  - **Limits:** right angles only (no angled walls, curved walls or bay windows). Windows are checked only for pieces within 20 cm of the wall. Feature positions are typed or dragged by hand; nothing is scanned. The "tall in front of a window" rule is a warning, since a bed under a window is often fine. Heights are numbers only: there is no 3D view and no check against sloped ceilings other than the low-zone rectangle. Not tested on a phone.
- **Measuring wall by wall (added 2026-10-19, user feedback: "when we go to measure we don't know the measurement, so every measurement determines the shape of the house on the app"):** the previous model asked for the room's overall width and length first, which a rep does not know on site. Now the shape comes from the walls.
  - New rooms start in **Wall by wall** mode (empty). The rep measures the first wall (it is drawn left to right), then picks "turn right" or "turn left" for the next corner, and adds walls round the room. The plan draws the path as they go (wall numbers and lengths, start and end markers). Furniture and suggestions are held back until the outline closes ("Finish measuring the walls..."). The old overall width and length boxes become read-only results ("from walls").
  - **Closing:** when the last corner lands within max(8 cm, 1.5% of the perimeter) of the start, the room closes and the outline is adjusted by that error (shown, with a warning above 5 cm). While open, the app says how far the last corner is from the start and, when one straight wall would close it, offers an "Add closing wall (N cm)" button. Errors shown: odd number of walls, a missing length, walls that cross or touch each other.
  - **Under the hood:** the outline is a right-angled polygon. The overall rectangle is its bounding box and the parts outside the outline are turned into cut-out rectangles, so every existing check, gap, suggestion and area figure works for L, U, T and other right-angled shapes without change. Verified: L-shape (450 x 380 minus 200 x 150 = 14.10 m2), U-shape area exact, clockwise and counter-clockwise tracing, crossing walls rejected.
  - **Doors and windows are now placed on numbered walls** ("Wall 3 (200 cm)", offset measured from that wall's start corner), including inner walls. Verified a door on an inner wall opens into the room, not into the cut-out.
  - **Quick rectangle** mode is kept for simple rooms (type width and length). Switching converts door and windows both ways and asks before dropping cut-outs. Old saved visits load as Quick rectangle with their cut-outs and doors unchanged. The PDF lists the walls in measuring order, with floor area.
  - **Limits:** right angles only (no angled walls, bay windows or curves). The plan orientation is arbitrary (first wall runs left to right), so it does not follow compass directions. Changing wall lengths after furniture is placed can move the room's origin, so re-check placements. The closing tolerance is my choice and has not been tested against real measurement errors. Not tested on a phone (the wall rows are narrow), and not yet connected to laser input.
- **Hosted link (added 2026-10-20, user could not open the .html file on a phone):** the app is published as a private claude.ai page: https://claude.ai/artifact/NG6SwtPwag8i4qHRzHqNEY . Only the owner can open it until they share it from the page's Share menu (reps and the furniture house need to be given access).
  - Build: `python3 tools/make_artifact.py` turns `fitcheck.html` (the source, still a normal standalone page) into `dist/fitcheck.artifact.html` (no html/head/body wrapper, which the host adds), then republish that file to the same link.
  - Hosted pages cannot print, show confirm() popups or download files, so the app changed for both versions: "Create PDF quote" became **Show full quote** (rooms, plans, fit notes on the page) and **Copy quote text**; "Template" became **Copy template** (the CSV text, to paste into a spreadsheet); deleting a room, new visit and mode switches use an in-page confirmation. If the clipboard is blocked a text box appears to copy by hand. Dark mode follows the host's theme setting.
  - **There is no PDF any more.** If the furniture house needs a PDF quote, that needs another route (for example a server that renders PDFs, part of the backend step).
  - Data still lives only in each viewer's browser (per device), now on the hosted page's own storage, so visits made in the local file and on the link are separate.
  - Tested 2026-10-20 on the built file (`dist/fitcheck.artifact.html`) in the in-app browser: loads with no console errors; New visit asks in-page and Cancel keeps data, Continue clears it; Show full quote shows rooms, plan and total, then hides; Copy quote text produces the text (the clipboard was refused in the test browser, so the select-and-copy box appeared, as designed).
  - The claude.ai link is now only a preview; reps should use the GitHub Pages address (see Housekeeping).
  - 2026-10-20: user reported "nothing is opening" on the link. The published content was read back and is the full app, and it runs, so the cause is most likely access (not signed in to claude.ai on that device, or opening where the link cannot load). Waiting for the user to say which device and what they see. **Still not tested on a phone.**
- **Units (added 2026-10-20, user request: reps must measure in the unit they use, not only cm):** a **Units** menu in the header: cm, m, mm, ft + in, inches. Saved per device. Everything is still stored in cm; only what people type and read is converted, so switching units never changes a measurement and rooms measured in feet check correctly against furniture listed in cm.
  - Typing: any length box accepts the chosen unit, and a unit written in the text wins over the setting: `450`, `4.5m`, `4500mm`, `14' 9"`, `14 ft 9 in`, `177 1/4"`. In ft + in mode, `14 9` means 14 ft 9 in and `14` means 14 ft. Commas work as decimal points. Text the app cannot read gets a red border and is ignored; on leaving the box it shows the stored value again. Phone keyboards switch to a text keyboard for feet/inches (they need the ' and " keys).
  - Display: feet and inches are written as words, e.g. `2 ft 11 3/8 in` (changed 2026-10-20: the user read the `2' 11"` symbols as a power), rounded to the nearest 1/8 inch; the ' and " symbols are still accepted when typing; areas show ft2 in feet/inches modes and m2 otherwise; the plan's scale bar is 3 ft or 1 m.
  - Covers every length on screen: wall rows, room and door sizes, ceiling, features, gaps, piece sizes, plan labels, suggestions, catalog buttons, fit-check messages, wall status, full quote and copied quote text.
  - **Not converted:** the catalog CSV is always in cm (column names end in `_cm`). Default sizes for new features (e.g. a 120 cm window) come out as odd imperial values until edited.
  - **Laser:** not built yet. Plan: the app converts each laser reading into the chosen unit, whatever unit the laser itself is set to. How a given laser model sends its readings (unit and format) is not verified yet.
  - Verified in the browser: 21 typed inputs across all units parse to the right cm (and bad ones are rejected); display/round-trip in all 5 units; a 14' 9" x 12' 6" room entered through the real wall boxes closes and shows ft/in everywhere; switching to m shows 4.5 / 3.81 with the stored cm unchanged; unit survives reload; no sideways scroll at phone width (375 px). Not tested on a real phone.
- **Simple step-by-step flow (added 2026-10-20, user feedback: "you made everything too complicated, it's supposed to be very simple"):** the page is now five steps, one at a time, with a step bar at the top and big **Back / Next** buttons pinned at the bottom: 1 Room (one-tap room type chips; name, client and rep optional; switch or add rooms), 2 Walls (wall rows and the live plan), 3 Door (which wall, distance from that wall's start corner, width), 4 Furniture (plan, "what fits" with Add, fit check; turn / move to wall / remove), 5 Quote (totals, show full quote, copy text, "+ Measure another room").
  - Next is locked on steps 2 and 3 until the walls close the room, with a one-line reason.
  - **More options** (link under each step, remembered per device) shows the advanced controls in place: wall-by-wall vs quick rectangle, overall width/length, ceiling height, door height, the windows/pillars/features card, the full catalog with CSV import, the Space card with exact gap inputs, clearance zones, and the suggestion explainer. Nothing was removed.
  - One column at every width (max 760 px). "prototype" dropped from the header.
  - Verified in the in-app browser at 375 px: each step shows only its cards; advanced controls hidden until More options; a 420 x 360 room typed through the wall rows unlocks Next; door step lists the 4 walls; Add from suggestions places a wardrobe; quote total 1,190; no sideways scroll; step pills fit. Not tested on a real phone.
  - This branch also contains the plain feature labels (From left side / From top side), which were not published separately.
- **Room shape by picture, door by tap (added 2026-10-20, user feedback: "turn left / turn right" is too complicated; it must be understood just by looking):**
  - Step 2 shows picture tiles: **Rectangle** and **L-shape** in its four directions. The chosen picture is drawn large with a number on each wall; the rep measures the wall with that number and types it in the matching box. A rectangle asks only **Length** and **Width**. Turns are fixed per shape behind the scenes (same outline engine), so the rep never sees left/right.
  - Messages are plain: "Type 2 more measurements", "Room measured: 450 x 380 cm, floor 17.10 m2", or for an L-shape that does not add up: "These measurements don't fit together. Wall 1 should equal wall 3 + wall 5, and wall 6 should equal wall 2 + wall 4. Measure them again." Next stays locked until the room is measured.
  - **Other shape** (the old wall-by-wall list with turns) only appears under More options, or when a room already uses it (old saves with walls migrate to it).
  - Step 3: **tap the plan where the door is**; the door goes on the nearest wall, centred on the tap. The plan comes first on this step; only Door width is shown; wall and offset numbers are under More options.
  - Verified at 375 px: 5 tiles in one row; rectangle 450 x 380 closes; L-shape 450/230/200/150/250/380 closes at 14.10 m2 with the right cut-out; a wrong wall 1 shows the rule and locks Next; a tap on the inner wall placed the door on wall 3; no console errors. Not tested on a real phone. Only right-angled rectangle and L shapes have pictures (no U or T yet).
- Tested in the in-app browser: layout checks (bad and clean layouts), and the import logic (good file with BOM/CRLF/quoted comma, missing columns, bad rows, duplicates, empty file, dropping placed items, search, restore sample).
- **Not tested:** the file-picker button itself with a real file, touch dragging on a real phone, the PDF/print output, Safari behavior.

## Not built yet
- Laser measurer input. Android Chrome can use Web Bluetooth. iPhone Safari cannot, so iPhone needs a small native wrapper. Laser model compatibility (Leica Disto, Bosch GLM) is **unverified**: check each model's Bluetooth and data interface before buying.
- Shared backend, rep logins, lead records, and a way for the client to update the catalog.
- Whole-room set suggestions (bundles by room type), room style filtering, windows/columns/radiators as obstacles.
- Richer catalog fields (category, photo, finish/variants, assembled vs flat-pack, shipping size). Only the 7 columns above exist.
- Excel (.xlsx) import. CSV only for now (Excel can save as CSV).
- Architect file library, dashboard, LiDAR scan.

## Laser notes
The four YouTube Shorts the user shared: a Leica Disto (distance measurer, best fit), two Bosch laser levels (GLL3-300, GCL 2-15G; they project lines and do not measure distance, so not suitable), and a REEKON brand comparison. Only titles were readable, not the footage.

## Research notes (vendor pages, claims self-reported)
- Scanning apps exist (Kaleidoscope AR lists about ±10 cm accuracy and needs a LiDAR iPhone Pro; Room Scanner; Design Scanner).
- White-label planners with catalog and quote exist (Planner 5D for Business, Vividworks). Pricing not checked.
- Architect channel exists (BIMobject, ARCAT, NBS). Roomle and Magicplan were not covered.

## Risks
- Phone LiDAR is fine for layouts but not for built-in joinery. Show confidence and "verify on site".
- **Catalog data quality is the biggest risk.** Needs an owner at the client who keeps dimensions current.
- Offline use matters (basements, new builds). The prototype stores locally but the sync design is undecided.

## Outcomes we might not have considered (brainstorm 2026-10-19, from general experience, not tested)
Most likely to bite:
1. Rooms are not rectangles (L-shapes, alcoves, bay windows, out-of-square walls). App models a rectangle only.
2. Obstacles and heights: windows, radiators, columns, stairs, sockets, sloped ceilings. No height-vs-ceiling or window-sill check.
3. Products that are not fixed rectangles: corner/L sofas, modular sofas, extendable tables, recliners (space behind), sofa beds.
4. A wrong "fits" result that a client trusts. Needs disclaimers, saved photos and measurements per visit, a "verified on site" step for fitted/expensive pieces.
5. **Data loss on iPhone:** Safari can delete a site's stored data after about a week of non-use. App currently saves only in the phone's localStorage, so visits and quotes can vanish. A shared backend with logins is the fix (unverified browser behaviour: confirm before relying on it either way).
6. Delivery path: stairs, lifts, corridors, corners, flat-pack vs assembled. Door rule is crude.
Later: laser hits skirting board or uneven wall (1-2 cm error); stale catalog (discontinued items suggested, prices change); quote tax, discounts, delivery fees, expiry; privacy of home floor plans and client details; rep adoption (speed, one-handed use, sunlight); units and currency; architects wanting other file formats; client worry about CAD files being copied.
Good surprises: clients may want to self-serve (lead generation); reps will ask for mood boards, 3D, online orders (scope creep).
Cheapest test: measure 3-5 real rooms by tape or laser, enter them in the app, compare.
Suggested priority: non-rectangular rooms and obstacles first, then shared backend with logins.

## Open questions for the client
1. Name and furniture category? Which products first?
2. Do they have product dimensions and CAD/3D files, or only PDFs and photos?
3. Who will maintain the catalog?
4. Rep count and phone models? Are they willing to carry a Bluetooth laser?
5. Budget and timeline for the pilot?

## Suggested next steps
1. Give `catalog-template.csv` to the furniture house to fill in with real dimensions. How complete it comes back tells us how ready their data is.
2. Test the prototype on a real iPhone and Android phone (touch drag, PDF).
3. Choose a backend for the shared catalog and visits, and add rep logins.
4. Add laser input (Android first), then decide on an iPhone wrapper.

## Housekeeping
- Project folder: `furniture-fitcheck` in the user's Project folder.
- **Hosting (added 2026-10-20):** public GitHub repository https://github.com/faisaliyb-hub/furniture-fitcheck (account `faisaliyb-hub`, confirmed by the user as theirs). GitHub Pages serves the `main` branch root at **https://faisaliyb-hub.github.io/furniture-fitcheck/** (the home address redirects to `fitcheck.html`). Verified live: the page loads with no console errors. No domain bought: decided to wait until the furniture house adopts it, ideally on their own domain (e.g. a subdomain), pointed at the same hosting.
  - To update the live site: commit to `main` and push; Pages rebuilds in about 30 seconds.
  - Everything in the repo is public, including this file (also served at `/docs/HANDOFF.md`). Never commit client data, real prices the furniture house wants private, or secrets. `.claude/` and `dist/` are ignored.
  - The first commit contained this file with a local folder path (the macOS user name); it was removed from later versions but stays in the git history unless the history is rewritten.
  - Hosting the page does not share data: each phone still keeps its own visits. Shared data needs the backend step.
- Ask before pushing to `main`, since that changes the live site.
- Scaffolding via `ce-new` was not used. Consider it if the project becomes a full webapp.
- Keep this file updated at the end of every working session.
