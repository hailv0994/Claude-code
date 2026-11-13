# Materials — PBR values that read as the real finish

All keys exist in the shell's `MAT`. Clone before changing colour: `matClone('paint_gloss', 0x1d4ed8)`.

| Key | Real finish | metalness | roughness | extra |
|---|---|---|---|---|
| `alu_anodized` | anodised aluminium (cylinder body, bracket) | 1 | 0.38 | colour 0x9ba1a7 — anodised is grey-blue, not white |
| `alu_brushed` | brushed / milled plate | 1 | 0.30 | anisotropy 0.45 + direction map |
| `steel_machined` | turned or ground steel (rod, shaft, ring) | 1 | 0.22 | the shiniest thing in most assemblies |
| `steel_cast` | cast iron, raw casting, weldment | 1 | 0.64 | roughness map at repeat 5 |
| `zinc_plated` | plated hardware, bolts, washers | 1 | 0.42 | slightly blue-white |
| `black_oxide` | socket-head screws, hardened parts | 1 | 0.52 | 0x2a2c2f, never 0x000000 |
| `brass` | fittings, bushings | 1 | 0.28 | 0xd3af67 |
| `paint_gloss` | painted machine frame, product shell | 0 | 0.30 | clearcoat 1 / cc-roughness 0.07 |
| `paint_satin` | textured industrial paint | 0 | 0.46 | clearcoat 0.55 |
| `plastic_abs` | moulded cover, housing | 0 | 0.44 | clearcoat 0.18 |
| `nylon_matte` | cable tie, bushing, 3D-printed jig part | 0 | 0.78 | |
| `rubber` | seal, foot, hose, belt | 0 | 0.92 | 0x1c1e20 |
| `glass` | lens, window, sight glass | 0 | 0.035 | transmission 1, ior 1.52, `thickness` = real wall in mm |
| `oil` | hydraulic oil in a cutaway | 0 | 0.12 | transmission 0.86, ior 1.47 |

## Why a render looks fake, in material terms

- **One roughness value over a whole part.** Real surfaces are dirtier in corners and polished where hands touch. The shell multiplies every material by a seamless noise map (`ROUGH`); raise `repeat` for big parts, lower it for small ones.
- **Pure black or pure white.** Nothing real is 0,0,0 or 255,255,255. Floor 0xb9bec4, rubber 0x1c1e20, "white" plastic 0xe8e9eb.
- **Saturated colour on metal.** Metal takes its colour from reflection. Only the base colour of a *coloured* metal (brass, copper, anodised) moves off grey.
- **Metalness 0.5.** Metalness is a switch: 0 or 1. Anything between is a layered-material mistake.
- **Plastic with no clearcoat and glass with no thickness** — both come out looking like painted cardboard.
- **Every part the same material.** A real assembly has 4–8 finishes in frame: machined, anodised, plated, painted, rubber, plastic. If your model has two, it will read as a CAD screenshot.

## Colour conventions worth keeping

- The user's own machined parts in a supplier assembly: `paint_gloss` at 0xc8102e (VNHN red) only when they ask to highlight them; otherwise real finishes.
- Safety yellow 0xf2b705, guard mesh 0x2f3338 at opacity 0.75, hydraulic hose 0x1c1e20, pneumatic tube 0x2f6fd0 (blue) or 0xd8dde3 (clear PU).
