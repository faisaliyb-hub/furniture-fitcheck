# Sample catalog sources

The app's built-in sample catalog (`SAMPLE` in `fitcheck.html`, and `catalog-template.csv`) holds 26 real products from **IKEA UK**, collected on **2026-10-22**. FitCheck is not connected to IKEA. The data only shows how the app works with a real maker's sizes until the furniture house sends its own catalog.

## What comes from IKEA, and what does not
- **From the product pages:** article number (used as the SKU), width, depth and height in cm (the "Weight & measurements" tab), and the sizes a product comes in.
- **From IKEA's own search results on the same day:** the price in GBP (£), without delivery or assembly. Prices change, so treat them as a snapshot.
- **Our own choices, not IKEA data:**
  - the short names, and size labels such as "80 wide, 202 high" (the bed sizes use IKEA's names);
  - which rows count as sizes of one product (the `group` column);
  - front clearance;
  - furniture type;
  - room tags.
  
  Clearances and room tags carry over from the earlier placeholder catalog.
- Footprint rule: for tables and beds, IKEA's "Length" and "Width" become the app's width (across the front) and depth. For everything else, IKEA's Width, Depth and Height are used as they are.
- Colours are mixed: each SKU is one colour (listed below). The LACK TV benches come in two colours (the 90 cm one is white; the 120 and 160 cm ones are black-brown).

## Rows
Sizes in cm (width x depth x height, as the app uses them). Price in GBP. The listing title is shown as IKEA's page gave it.

| SKU | IKEA listing | Size (cm) | £ | Page |
|---|---|---|---|---|
| 694.405.96 | KIVIK 3-seat sofa, Tibbleby beige/grey | 228 x 95 x 83 | 449 | https://www.ikea.com/gb/en/p/kivik-3-seat-sofa-tibbleby-beige-grey-s69440596/ |
| 294.405.98 | KIVIK 2-seat sofa, Tibbleby beige/grey | 190 x 95 x 83 | 349 | https://www.ikea.com/gb/en/p/kivik-2-seat-sofa-tibbleby-beige-grey-s29440598/ |
| 992.407.89 | POÄNG armchair, Knisa light beige, birch veneer | 68 x 82 x 100 | 69 | https://www.ikea.com/gb/en/p/poaeng-armchair-birch-veneer-knisa-light-beige-s99240789/ |
| 401.042.94 | LACK coffee table, black-brown, 90x55 cm | 90 x 55 x 45 | 19 | https://www.ikea.com/gb/en/p/lack-coffee-table-black-brown-40104294/ |
| 001.042.91 | LACK coffee table, black-brown, 118x78 cm | 118 x 78 x 45 | 40 | https://www.ikea.com/gb/en/p/lack-coffee-table-black-brown-00104291/ |
| 304.499.08 | LACK side table, white, 55x55 cm | 55 x 55 x 45 | 10 | https://www.ikea.com/gb/en/p/lack-side-table-white-30449908/ |
| 305.147.91 | LACK side table, white, 35x35 cm | 35 x 35 x 35 | 6 | https://www.ikea.com/gb/en/p/lack-side-table-white-30514791/ |
| 702.943.39 | LISABO ash veneer, dining table | 140 x 78 x 74 | 129 | https://www.ikea.com/gb/en/p/lisabo-table-ash-veneer-70294339/ |
| 405.637.76 | LISABO table, ash veneer, 88x78 cm | 88 x 78 x 74 | 69 | https://www.ikea.com/gb/en/p/lisabo-table-ash-veneer-40563776/ |
| 004.572.35 | LISABO chair, ash | 46 x 51 x 80 | 50 | https://www.ikea.com/gb/en/p/lisabo-chair-ash-00457235/ |
| 290.069.78 | MALM bed frame, high, white/Luröy, Standard Double | 150 x 199 x 100 | 139 | https://www.ikea.com/gb/en/p/malm-bed-frame-high-white-luroey-s29006978/ |
| 490.099.47 | MALM bed frame, high, white/Luröy, Standard Single | 107 x 199 x 100 | 99 | https://www.ikea.com/gb/en/p/malm-bed-frame-high-white-luroey-s49009947/ |
| 690.069.81 | MALM bed frame, high, white/Luröy, Standard King | 166 x 209 x 100 | 179 | https://www.ikea.com/gb/en/p/malm-bed-frame-high-white-luroey-s69006981/ |
| 790.024.35 | MALM bed frame, high, white/Luröy, 180x200 cm | 196 x 209 x 100 | 229 | https://www.ikea.com/gb/en/p/malm-bed-frame-high-white-luroey-s79002435/ |
| 506.107.39 | HEMNES bedside table, grey-green/light brown stained, 46x35 cm | 46 x 35 x 70 | 55 | https://www.ikea.com/gb/en/p/hemnes-bedside-table-grey-green-light-brown-stained-50610739/ |
| 004.417.58 | KLEPPSTAD white, Wardrobe with 3 doors, 117x176 cm | 117 x 55 x 176 | 129 | https://www.ikea.com/gb/en/p/kleppstad-wardrobe-with-3-doors-white-00441758/ |
| 804.372.34 | KLEPPSTAD white, Wardrobe with 2 doors | 79 x 55 x 176 | 89 | https://www.ikea.com/gb/en/p/kleppstad-wardrobe-with-2-doors-white-80437234/ |
| 204.989.04 | LACK TV bench, black-brown, 160x35x36 cm | 160 x 35 x 36 | 50 | https://www.ikea.com/gb/en/p/lack-tv-bench-black-brown-20498904/ |
| 204.989.37 | LACK TV bench, black-brown, 120x35x36 cm | 120 x 35 x 36 | 40 | https://www.ikea.com/gb/en/p/lack-tv-bench-black-brown-20498937/ |
| 004.500.88 | LACK white, TV bench, 90x26x45 cm | 90 x 26 x 45 | 9 | https://www.ikea.com/gb/en/p/lack-tv-bench-white-00450088/ |
| 002.638.50 | BILLY bookcase, white, 80x28x202 cm | 80 x 28 x 202 | 55 | https://www.ikea.com/gb/en/p/billy-bookcase-white-00263850/ |
| 502.638.38 | BILLY bookcase, white, 40x28x202 cm | 40 x 28 x 202 | 35 | https://www.ikea.com/gb/en/p/billy-bookcase-white-50263838/ |
| 302.638.44 | BILLY bookcase, white, 80x28x106 cm | 80 x 28 x 106 | 35 | https://www.ikea.com/gb/en/p/billy-bookcase-white-30263844/ |
| 802.130.74 | MICKE white, Desk, 105x50 cm | 105 x 50 x 75 | 79 | https://www.ikea.com/gb/en/p/micke-desk-white-80213074/ |
| 302.130.76 | MICKE white, Desk, 73x50 cm | 73 x 50 x 75 | 49 | https://www.ikea.com/gb/en/p/micke-desk-white-30213076/ |
| 902.143.08 | MICKE white, Desk, 142x50 cm | 142 x 50 x 75 | 99 | https://www.ikea.com/gb/en/p/micke-desk-white-90214308/ |
