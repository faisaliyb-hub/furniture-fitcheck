# 3D assets

Files in `assets/3d/`, used by the 3D view (`view3d.js`) for real material textures and lighting. All come from
[Poly Haven](https://polyhaven.com) under the **CC0** licence (public domain: free for any use, no attribution required).
Downloaded on 2026-10-27 at 1k resolution, to keep the download small on phones (4.6 MB in total, loaded only when 3D opens).

| File | Poly Haven asset | Used for |
|---|---|---|
| `laminate_floor_02_diff_1k.jpg`, `_nor_1k.jpg`, `_rough_1k.jpg` | Laminate Floor 02 | The floor (colour, surface relief, shine) |
| `fine_grained_wood_diff_1k.jpg`, `_nor_1k.jpg` | Fine Grained Wood | Wood on furniture (turned grey and tinted per finish) |
| `denim_fabric_nor_1k.jpg`, `_rough_1k.jpg` | Denim Fabric | Fabric weave on sofas, chairs and bedding (tinted per finish) |
| `studio_small_08_1k.hdr` | Studio Small 08 | Light and reflections in the 3D view and in Photo |

If the files cannot load (for example offline), the 3D view falls back to its drawn textures and built-in light.

The sample company pack (`samples/sample-company-pack.zip`) contains `oak.jpg`, made from the same Poly Haven Fine Grained Wood
(CC0) recoloured to a light oak, and `trellis.png`, drawn for the sample. The company, products and prices in it are made up.
