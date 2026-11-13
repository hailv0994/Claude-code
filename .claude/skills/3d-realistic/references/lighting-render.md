# Lighting, render and capture

The shell is already set up. Change these numbers, not the structure.

## The setup

| Thing | Value | Why |
|---|---|---|
| tone mapping | `ACESFilmicToneMapping`, exposure 0.92 | an untonemapped render always looks like CG; exposure is the first thing to tune |
| colour space | `outputColorSpace = SRGBColorSpace` | everything else is a linear-workflow bug |
| environment | PMREM from `RoomEnvironment` (studio) or the gradient env + 2 soft panels | **IBL is where realism comes from.** A model lit only by lights is flat |
| key light | DirectionalLight 2.6, VSM shadow, radius 5, 2048 map | one shadow caster, placed away from the camera so the shadow is visible |
| rim | DirectionalLight 0.85 from behind-left | separates the object from the background |
| fill | HemisphereLight 0.25 | fills the undersides; never use it alone |
| AO | `GTAOPass`, screen-space radius 0.14 | the dark line where two parts meet — the cheapest realism there is |
| bloom | strength 0.11, threshold 0.92 | only the specular hits bloom. More than 0.2 looks like a video game |
| MSAA | render target `samples: 4` | jagged edges read as a browser toy |
| ground | circle, roughness 0.5, + a radial contact-shadow blob | **an object that does not sit on anything looks fake, whatever you do to it** |

## The tells of a fake render — check each one before delivering

1. Object floats: no contact shadow, no darkening where it meets the floor.
2. Shadow is hard, or there is no shadow at all.
3. Background is pure white or pure black.
4. Edges are razor sharp (go back to geometry — this is not fixable with light).
5. One roughness value everywhere; no smudge, no wear.
6. Wide-angle distortion: fov 50+ on a product. Use **fov 28–35** and move the camera back.
7. Highlights have no shape — a real highlight is the shape of a softbox or a window, which is why the gradient env has two panels.
8. Blown white areas with no detail: drop exposure to 0.8–0.9 rather than dimming the lights.
9. Everything perfectly aligned and perfectly clean. A 0.3° tilt on a loose cover, a slightly rotated bolt head, and the scene gains ten years of age.

## Framing

`fit(dir, pad)` with `pad` 1.15–1.3. Hero shot: `[1.1, 0.45, 0.75]`, horizon in the upper third, the object filling ~70 % of the frame. Technical views (`front/left/top`) exist for the inspector to measure against the drawing — keep them orthogonal-looking by using the shipped directions.

## Capture

- In the page: **PNG 2×** button.
- Headless: `node scripts/qa.mjs model.html --views iso,front,left,top --sheet` writes the views and a 2×2 contact sheet.
- For PowerPoint: capture at 2× and crop; or record the turntable (`?spin=1`) with a screen recorder.
- Offline copy: `--vendor` writes `<name>.offline.html` plus a `three/` folder next to it. ES modules do not load
  from `file://`, so an offline copy is opened through a local server — ship the folder with one line in the note:

  ```bash
  python3 -m http.server 8000 --directory <folder>
  ```

  The normal `<name>.html` (CDN importmap) opens by double-click on any machine with internet — that is the one to
  send unless the user says the room has no network.

## Performance

Render-on-demand is already wired (`needsRender`). Keep triangles < 1.5 M, shadow map 2048, `setPixelRatio(min(dpr,2))`. If the laptop in the meeting room struggles: drop GTAO first, bloom second, never the environment.
