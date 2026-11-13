---
name: 3d-realistic
description: "Build any 3D model as one interactive HTML file that looks and measures like the real object — photoreal PBR rendering plus a verified pipeline: a scout agent finds the real drawings/photos/catalogue dimensions, a modeler builds to those dimensions, a render agent makes it beautiful, an inspector agent checks dimensions, collisions, floating parts and likeness against the real photos. Use for ANY 3D request — mô hình 3D, dựng 3D, three.js, mô phỏng máy, chi tiết máy, xi lanh, jig, cụm lắp ráp, layout, CAD, STEP, exploded view, 3Dモデル — and whenever the user says it must look real / giống thật / giống thực tế."
---

# 3D realistic

One HTML file. The bar: **a photo of the real thing and a screenshot of the model are hard to tell apart, and every dimension in the model is a dimension of the real part.**

Nothing is ever modelled from imagination. Either the user gives the geometry (CAD, drawing, dimensions), or an agent goes and finds it. "Looks about right" is a defect.

## Pipeline (fixed order, agents run in parallel where marked ‖)

```
0 TRIAGE     you, 1 min, no agent     what is it · is geometry given or must it be found · one message
1 SCOUT  ‖   agent 3d-scout           → spec.yaml (+ ref/*.jpg)      skip if the user gave CAD/dims
2 BUILD      agent 3d-modeler         → <name>.html                  reads spec.yaml + assets/shell.html
3 CHECK      agent 3d-inspector       → qa/qa.md                     numbers first, eyes second
4 LOOK       agent 3d-render          → final captures               only after CHECK passes
```

Rules that keep it cheap and fast:

- **spec.yaml is the only contract.** Agents exchange files, never pasted HTML. No agent reads another agent's HTML unless it is the one editing it.
- **You (the main session) never read the model file.** You read `qa/qa.md` (≈40 lines) and the agents' ≤15-line reports.
- **Numbers before pixels.** `scripts/qa.mjs` catches wrong sizes, interpenetration and floating parts for free. Only a model that passes it is worth looking at.
- **Two fix loops maximum.** Third failure → stop, deliver what passes and list the rest in the note.
- **Parallel by part.** For an assembly of N catalogue items, launch N scouts in one message, one per item.
- Launch an agent with the Agent tool, `subagent_type` = `3d-scout` / `3d-modeler` / `3d-inspector` / `3d-render` (definitions in `.claude/agents/`). If a type is not available, use `general-purpose` and paste that agent file's body as the prompt.

## 0 · Triage (do this yourself, out loud, in 4 lines)

| Question | If… | Then |
|---|---|---|
| Geometry source | user gave CAD/STEP/STL/GLB | skip SCOUT, import it (`references/modeling.md` § CAD) |
| | user gave a 2D drawing / photo with dims | skip SCOUT, read the dims off it into spec.yaml yourself |
| | it is a catalogue item (SMC cylinder, THK rail, bearing, motor, profile, machine model) | **SCOUT** — never guess a catalogue part |
| | it is the user's own product, no file | ask for a drawing or photo once; if none, build from their dims and mark `unknown:` |
| Fidelity | always | real dimensions, real finishes, real assembly logic |
| Output | always | `<subject>_3d.html`, scene unit = **1 mm**, opens English + light |

Ask at most **one** question, and only if the answer changes the geometry. Otherwise choose, build, and list the choices in the delivery note.

## 1 · SCOUT — find the real thing

Input: the subject name/model number. Output: `spec.yaml` + up to 6 reference images in `ref/`.
Budget: **≤ 8 fetches, ≤ 5 minutes**, then report with whatever it has and mark the gaps.

`spec.yaml` schema (this is what the modeler builds from — mm, nothing else):

```yaml
subject: SMC MGPM25-50Z  guided cylinder
sources: [https://…catalogue.pdf#p12, https://…]
units: mm
datum: bottom face of the body, bore axis at X0 Z0
overall: [L, W, H]            # X, Z, Y
parts:
  - name: Body                # English; vi: optional Vietnamese
    vi: Thân xi lanh
    material: alu_anodized    # a key from references/materials.md
    dims: [L, W, H]           # X, Z, Y bounding box, mm
    pos:  [x, y, z]           # centre of that box from the datum, mm
    shape: plate|block|tube|shaft|profile|lathe|custom
    features: [4× M6 tapped 12 deep on 46×30, 1 mm chamfer all round, Ø25 bore]
    qty: 1
    fastener: false           # true for bolts/nuts/pins -> exempt from collision + dim gates
motion:                       # optional, for machines and mechanisms
  - part: Rod
    axis: y
    from: 0
    to: 50
    t: [0.0, 0.8]             # seconds inside the cycle
cycle_s: 6.0                  # optional takt
interfaces:                   # what bolts/seats on what — the inspector checks they touch
  - [Plate, Body, 4× M5 on 46×30]
unknown: [seal groove depth, cable gland thread]
```

Accuracy rules for the scout: catalogue PDF > maker web page > distributor listing > blog. Record the source URL per dimension group. **Never invent a number** — anything not found goes in `unknown:` and is estimated by the modeler with a visible note, not silently.

Details: `references/research.md`. Quick dimensions for everyday hardware (bolts, bearings, profiles, DIN rail): `references/standard-parts.md` — check there first, it saves the whole SCOUT step.

## 2 · BUILD — geometry that measures right

The modeler copies `assets/shell.html`, replaces the block between `===== MODEL =====` marks, and changes nothing else without a reason. The shell already carries: ACES tone mapping, IBL, soft shadow, contact shadow, GTAO + bloom, the PBR material library, the part registry, the sidebar, PNG 2× capture and the `window.__model` QA API.

Non-negotiables (full list and recipes in `references/modeling.md`):

- **Every part registered** with `part(name, obj, {vi, spec:[L,W,H], fastener, decal, moving})` — the sidebar and all QA gates read that registry. `spec` is the dimension from spec.yaml; QA fails if the geometry does not match it.
- **No razor edges.** Every machined or moulded edge gets a 0.3–1 mm chamfer or fillet (`box()` is rounded by default, `tube()` is chamfered). Sharp edges are the first tell of CG.
- **No primitive stand-ins.** A cylinder is a body + tie rods + ports + rod + chamfered end caps, not a tube. A motor is a can + flange + shaft + key + terminal box. If you cannot model the detail, say so in the note; do not ship a grey box.
- **Assembly logic**: parts that bolt together touch (gap 0 ± 0.2 mm); fasteners sit in their holes; moving parts clear the static ones over the whole stroke; nothing floats; nothing interpenetrates.
- **Real finishes**, from `references/materials.md`: anodised ≠ machined ≠ zinc-plated ≠ cast. Never pure black, never 100 % saturated, never `MeshLambert/Phong/Basic`.

## 3 · CHECK — the gates

```bash
node .claude/skills/3d-realistic/scripts/qa.mjs <model>.html --out qa --sheet
# add --time 0,1.5,3,4.5 for a machine, so collisions are checked over the cycle
```

| Gate | Fails when |
|---|---|
| console | any error, or `window.__ready` never set |
| dimensions | a part's measured bbox differs from its `spec` by > 2 % (or 0.3 mm) |
| collision | two solid parts interpenetrate by > 12 % of the smaller one (static and at every `--time`) |
| floating | a part touches no other part and does not sit on the floor |
| materials | Lambert/Phong/Basic anywhere, tone mapping off, no environment, shadows off |
| likeness | inspector compares `qa/sheet.png` with `ref/*.jpg` — proportions, part count, stance |

The inspector reports **only failures**, as `file:line → what is wrong → the fix`, max 15 lines, and never rewrites the model itself unless the fix is a one-line number.

## 4 · LOOK — the last 10 %

Only on a model that passes. `references/lighting-render.md` carries the numbers and the list of tells that make a render look fake (uniform roughness, hard shadows, floating object, wide lens, bloom abuse, blown whites). The render agent touches lighting, materials, framing and capture — never geometry; if it wants a geometry change it says so and stops.

## Deliver

`<subject>_3d.html` + `qa/sheet.png` + 5 lines: what it is, where the dimensions came from, what was estimated (`unknown:`), what the QA gates say, how to open it. The plain `.html` opens by double-click wherever there is internet. For a room with no network, `--vendor` writes `.offline.html` + a `three/` folder, served with `python3 -m http.server` (ES modules do not load from `file://`).
