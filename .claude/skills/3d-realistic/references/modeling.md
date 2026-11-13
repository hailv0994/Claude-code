# Modeling — geometry that measures right

Scene unit = **1 mm**. Y is up. X = length, Z = width, Y = height. `spec: [L, W, H]` = `[X, Z, Y]`.

## The shell gives you

```js
part(name, obj, {vi, spec:[L,W,H], fastener, decal, collide, moving, parent})
box(w,h,d,r)        // RoundedBoxGeometry — r defaults to 3.5 % of the smallest side
cyl(d,h,seg)        // plain cylinder, Ø d
tube(od,id,h,seg,c) // lathe ring, exact OD/ID/H, c = chamfer (default 0.4)
hexBolt(d,len)      // ISO 4017 proportions: head k = 0.7d, across-flats 1.6d
MAT.<key>           // material library, see materials.md
matClone('key', 0xRRGGBB)   // same finish, different colour — always clone before recolouring
```

`build()` returns `{views, steps, update(dt), setTime(t)}` — all optional:
`views` adds named camera directions, `update(dt)` animates (return `true` when something moved),
`setTime(t)` puts the mechanism at second `t` (the QA script uses it to test collisions over the cycle).

## Rules that decide whether it reads as real

1. **Chamfer everything.** 0.3–1 mm on machined edges, 0.5–2 mm radius on cast and moulded ones. A perfectly sharp edge catches no highlight, and the eye reads it as CG instantly. `box()` and `tube()` do it for you; for a lathe profile put the chamfer in the point list.
2. **Detail where the eye lands.** Holes, counterbores, tapped bosses, ribs, port threads, name plates, cable glands, grease nipples, the parting line of a casting. One extra real feature beats ten invented ones.
3. **Hierarchy = the real BOM.** One `part()` per item the user could point at. Sub-meshes of one item go in a `THREE.Group`. Never merge two real parts into one mesh — the user must be able to hide any of them.
4. **Assembly logic.**
   - Bolted faces touch: gap 0 ± 0.2 mm. Model the bolt in the hole, head above the face, not floating.
   - A shaft in a bore: diameters differ by the real fit (H7/g6 ≈ 0.02 mm — model them equal, the gate ignores < 0.4 mm).
   - A moving part must clear the static ones over the whole stroke; declare `moving:true` and expose `setTime`.
   - Anything resting on the floor has its bottom face at the same Y as the rest of the machine's feet.
5. **Symmetry by code, not by copy-paste.** Loops for bolt circles and hole patterns, so the pattern is exact and the count is right.
6. **Segments:** 48 for a visible cylinder, 64 for a lathe ring, 96 for anything over Ø150 that fills the frame; 16–24 for small hardware. Keep total triangles under ~1.5 M.

## Shape cookbook

| Real feature | Build it as |
|---|---|
| Plate with holes | `ExtrudeGeometry` of a `Shape` with `Path` holes, `bevelEnabled:true, bevelSize:0.3` |
| Ring / spacer / bore face | `tube(od, id, h)` |
| Turned part (piston, shaft with shoulders) | `LatheGeometry` on a point list — every diameter change gets a 0.5 mm chamfer |
| Aluminium profile 20/30/40 | `ExtrudeGeometry` of the real slot cross-section (see standard-parts.md), not a square tube |
| Hex / socket head bolt | `hexBolt(d,len)`; socket head = `cyl(1.5d, d)` + a hex pocket `cyl` subtracted visually by a dark inset disc |
| Hose, cable, chain path | `TubeGeometry` on a `CatmullRomCurve3`, radius = real OD/2, with sag |
| Sheet metal cover | `box(w, t, d, 1.5)` with `t` = the real gauge (1.6 / 2.0 / 3.2 mm), not 10 mm |
| Weld bead | thin `TorusGeometry` or a lathe fillet at the joint, `MAT.steel_cast` |
| Knurl, thread | do not model geometry — use a roughness/normal pattern or a thin ring of flutes only if it is close to the camera |
| Glass / lens / sight glass | `MAT.glass`, thickness = the real wall; put something behind it so refraction shows |

## Pneumatic cylinder (the most-asked part) — what "real" means

Body (extruded or round tube) · two end caps with a chamfer and the tie-rod bosses · 4 tie rods or a screwed cap · rod Ø with a chamfered tip and a thread at the end · rod-end nut · 2 ports with hex bosses and fittings · a magnet band / sensor slot · the mounting face with its real tapped pattern. A guided cylinder adds the two guide rods, the linear bushings and the plate with counterbores. A plain `cyl()` for the body plus a thin `cyl()` for the rod is a **fail**.

## CAD input (STEP / IGES / STL / GLB / 3D PDF)

- GLB/GLTF: `GLTFLoader` directly — keep it, do not rebuild. Re-material it with the library (CAD exports arrive untextured), `castShadow/receiveShadow` on every mesh, then register the sub-meshes as parts.
- STL / OBJ: one mesh, no hierarchy — split by connected component or ask for a per-part export.
- STEP / IGES: no browser loader. Convert first (`cascadio`, FreeCAD/OCCT `--export glb`, or ask the user for a GLB/STL export from the maker's file). Do not trace it by hand if a conversion is possible.
- 3D PDF: extract the U3D/PRC stream, convert to GLB; if that fails, use the drawing views in the PDF as dimensioned references and model it.
- After import: scale to mm (`scene.scale.setScalar(1000)` for a metre-unit GLB), recentre on the datum, and check `__model.overall()` against the catalogue overall size before anything else.

## Animation / machine cycle

```js
const anim = [];                       // {part, axis, from, to, t0, t1, ease}
function setTime(t){ for (const a of anim){
  const u = THREE.MathUtils.clamp((t - a.t0)/(a.t1 - a.t0), 0, 1);
  const e = u*u*(3 - 2*u);             // smoothstep: pneumatics do not start instantly
  a.part.position[a.axis] = a.from + (a.to - a.from)*e; } }
```
Return `{setTime, update:(dt)=>{T=(T+dt)%cycle; setTime(T); return true;}}` from `build()`.
Cycle time comes out of the plan (sum of the station times), never from a typed-in number.
Then run QA with `--time` at the key frames — the collision gate checks the mechanism, not just the parked pose.
