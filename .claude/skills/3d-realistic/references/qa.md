# QA — how to check, and what to report

## 1 · Numbers (always first — it costs nothing)

```bash
node .claude/skills/3d-realistic/scripts/qa.mjs <model>.html --out qa --sheet
node .claude/skills/3d-realistic/scripts/qa.mjs <model>.html --out qa --time 0,1.5,3,4.5   # machines
```

Reads `window.__model` inside a headless browser and writes `qa/qa.md` (short), `qa/qa.json` (full),
`qa/<view>.png` and `qa/sheet.png`. Exit code 1 = at least one gate failed.

| Gate | Threshold | Usual cause |
|---|---|---|
| console | any error | import path, a typo in `build()` |
| dimensions | > 2 % or 0.3 mm off `spec` | geometry built with the wrong parameter, or bevel creep — use `tube()`/lathe for exact sizes |
| collision | overlap > 12 % of the smaller part | a part positioned by eye; mark true fasteners `fastener:true` |
| floating | touches nothing | forgot to seat a part on its mounting face |
| materials | Lambert/Phong/Basic, no tone mapping, no env, no shadow | someone edited the shell header |

## 2 · Eyes (only after the numbers pass)

Open `qa/sheet.png` next to `ref/*.jpg` and answer, in this order:

1. **Proportions** — is the ratio of the big masses the same as the photo? (measure in the image if unsure)
2. **Part count and placement** — same number of bolts, ports, ribs, lamps, in the same places?
3. **Stance** — does it sit on the ground the same way, same orientation, same visible faces?
4. **Finish** — does the metal look like that metal? Is anything blown out or pure black?
5. **The tells** in `lighting-render.md` § tells — run the list.

## Report format (max 15 lines, failures only)

```
FAIL dimensions  Body  spec 120×80×46 → 120×80×52     model.html:214  height param 52 should be 46
FAIL collision   Rod ∩ Cap @t=1.5  12×12×9 mm         stroke ends 9 mm past the cap — to: 41, not 50
WARN likeness    ref/front.jpg: 4 tie rods, model has none — add Ø6 rods on 46×30
PASS console, floating, materials
```

Never rewrite the model from the inspector unless the fix is a single number. Report, let the modeler fix, re-run.
Two loops maximum; after that, deliver and list what is still off.
