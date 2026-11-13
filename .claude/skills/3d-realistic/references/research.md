# Research — how the scout finds the real part

Goal: **spec.yaml with sourced dimensions**, plus up to 6 reference images. Budget ≤ 8 fetches.

## Order of sources

1. `references/standard-parts.md` — if it is in there, stop, you are done.
2. **Maker catalogue PDF** (`smcworld.com`, `festo.com`, `thk.com`, `misumi`, `nsk`, `skf`, `item24`, `bosch-rexroth`): search `"<model number>" catalog pdf dimensions`. Dimension tables in catalogues are the only fully trustworthy source.
3. **Maker product page** — overall size, mass, stroke.
4. **Distributor listing** (MISUMI, RS, Monotaro) — usually carries a dimensioned drawing per model number.
5. Images: `"<model>" drawing`, `"<model>" 図面`, `"<model>" dimensions`, and 2–3 photos from different angles for the likeness check.

Search in the maker's language too: Japanese (`寸法`, `外形図`, `カタログ`) for SMC/THK/NSK/Misumi, German for Festo/item.

## What to extract

- Overall L × W × H, and the datum you measured from.
- Per part: bounding box, position from the datum, finish, and the features that are visible (ports, tapped holes, slots, chamfers).
- The mounting pattern: PCD / hole spacing / thread size — this is what makes an assembly fit.
- Stroke, travel, rotation for anything that moves.
- 3–6 photos into `ref/`, named `ref/<subject>_<view>.jpg`. Front, side and 3/4 are worth more than ten detail shots.

## Rules

- **Never invent a number.** If the catalogue does not give it, put it in `unknown:` with your estimate and the basis (`"≈ 8 mm, scaled off the drawing"`). The delivery note repeats every `unknown:`.
- One model number = one source. Do not mix dimensions of MGPM25 and MGPM32.
- A blog, a marketplace listing or an AI answer is not a source for a dimension. A dimensioned drawing is.
- If a host is blocked in this container, say so in the report and fall back to the next source; do not retry the blocked one.
- Report ≤ 15 lines: subject, overall size, source URLs, what is in `unknown:`, image count. The spec.yaml carries the detail.
