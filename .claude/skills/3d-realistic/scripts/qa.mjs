#!/usr/bin/env node
/* qa.mjs — numeric QA for a 3d-realistic model. No vision tokens needed.
   node qa.mjs model.html [--out DIR] [--views iso,front,left,top] [--tol 0.02]
                          [--sheet] [--vendor] [--time t0,t1,...]
   Checks: console errors · spec-vs-measured dimensions · part collisions ·
           floating parts (nothing to bolt to) · ground contact · scale sanity.
   Writes: DIR/qa.json, DIR/qa.md, DIR/<view>.png, DIR/sheet.png
   Exit 1 if any gate fails -> the fix loop reads qa.md only (~40 lines). */
import {createRequire} from 'module';
import fs from 'fs'; import path from 'path'; import http from 'http';
import {execSync} from 'child_process'; import os from 'os';
const require = createRequire(process.env.PW_ROOT || '/opt/node-tools/');
const {chromium} = require('playwright');

const A = process.argv.slice(2);
const file = A.find(a => !a.startsWith('--'));
if (!file) { console.error('usage: qa.mjs model.html [--out DIR]'); process.exit(2); }
const opt = (k, d) => { const i = A.indexOf('--' + k); return i < 0 ? d : (A[i+1]?.startsWith('--') ? true : A[i+1]); };
const has = k => A.includes('--' + k);
const OUT = path.resolve(opt('out', path.join(path.dirname(path.resolve(file)), 'qa')));
const VIEWS = String(opt('views', 'iso,front,left,top')).split(',');
const TOL = parseFloat(opt('tol', 0.02));
const TIMES = opt('time', null) ? String(opt('time')).split(',').map(Number) : null;
fs.mkdirSync(OUT, {recursive: true});

/* three.js cached locally so QA runs without the CDN */
const CACHE = path.join(os.homedir(), '.cache', '3d-realistic');
const VER = (fs.readFileSync(path.resolve(file), 'utf8').match(/three@([\d.]+)/) || [, '0.180.0'])[1];
const TDIR = path.join(CACHE, 'three-' + VER);
if (!fs.existsSync(path.join(TDIR, 'build/three.module.js'))) {
  fs.mkdirSync(TDIR, {recursive: true});
  execSync(`npm pack three@${VER} --silent --pack-destination "${CACHE}"`, {stdio: 'inherit'});
  execSync(`tar xzf "${CACHE}/three-${VER}.tgz" -C "${TDIR}" --strip-components=1`);
}
const html = fs.readFileSync(path.resolve(file), 'utf8')
  .replace(new RegExp(`https://unpkg\\.com/three@${VER}/`, 'g'), '/three/')
  .replace(new RegExp(`https://cdn\\.jsdelivr\\.net/npm/three@${VER}/`, 'g'), '/three/');
if (has('vendor')) {                               // offline bundle next to the model
  const dst = path.join(path.dirname(path.resolve(file)), 'three');
  fs.cpSync(path.join(TDIR, 'build'), path.join(dst, 'build'), {recursive: true});
  fs.cpSync(path.join(TDIR, 'examples/jsm'), path.join(dst, 'examples/jsm'), {recursive: true});
  fs.writeFileSync(path.resolve(file).replace(/\.html$/, '.offline.html'), html.replace(/\/three\//g, './three/'));
}
const MIME = {'.js':'text/javascript','.html':'text/html','.json':'application/json','.wasm':'application/wasm'};
const srv = http.createServer((q, s) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  let p = u === '/' || u === '/index.html' ? null : (u.startsWith('/three/') ? path.join(TDIR, u.slice(7)) : null);
  if (p === null && u !== '/index.html' && u !== '/') p = path.join(path.dirname(path.resolve(file)), u);
  if (u === '/' || u === '/index.html') { s.writeHead(200, {'content-type':'text/html'}); return s.end(html); }
  try { s.writeHead(200, {'content-type': MIME[path.extname(p)] || 'application/octet-stream'}); s.end(fs.readFileSync(p)); }
  catch { s.writeHead(404); s.end(); }
});
await new Promise(r => srv.listen(0, r));
const PORT = srv.address().port;

const browser = await chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport:{width:1500,height:1000}, deviceScaleFactor:1});
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message.slice(0, 200)));
await page.goto(`http://127.0.0.1:${PORT}/index.html?hud=0`, {waitUntil:'load'});
const ready = await page.waitForFunction('window.__ready===true', {timeout:60000}).then(() => true).catch(() => false);
if (!ready) errors.push('model never reached window.__ready (build() threw or an import failed)');

/* ---- geometry audit, run inside the page ---- */
const audit = ready ? await page.evaluate(({TOL, TIMES}) => {
  const M = window.__model, T = M.THREE;
  const boxOf = o => new T.Box3().setFromObject(o);
  const snap = () => M.PARTS.map(p => ({p, b: boxOf(p.obj)}));
  const r = {unit: M.unit, overall: M.overall(), nParts: M.PARTS.length,
             dims: [], collide: [], floating: [], notes: []};
  // 1 spec vs measured  (spec = [length X, width Z, height Y] in mm)
  for (const d of M.dims()) {
    if (d.fastener || d.decal) continue;
    if (!d.spec) { r.notes.push(`no spec declared: ${d.name}`); continue; }
    const got = [d.size[0], d.size[2], d.size[1]];
    const bad = d.spec.map((v, i) => Math.abs(got[i] - v) > Math.max(v * TOL, 0.3));
    if (bad.some(Boolean)) r.dims.push({name: d.name, spec: d.spec, got: got.map(v => +v.toFixed(2))});
  }
  // 2 collisions: solid parts must not interpenetrate (static pose + key frames)
  const frames = TIMES && M.info.setTime ? TIMES : [null];
  for (const t of frames) {
    if (t !== null) M.setTime(t);
    const S = snap().filter(x => x.p.collide && x.p.obj.visible && !x.p.fastener && !x.p.decal);
    for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) {
      const a = S[i].b, b = S[j].b;
      const ov = [Math.min(a.max.x,b.max.x)-Math.max(a.min.x,b.min.x),
                  Math.min(a.max.y,b.max.y)-Math.max(a.min.y,b.min.y),
                  Math.min(a.max.z,b.max.z)-Math.max(a.min.z,b.min.z)];
      if (ov.every(v => v > 0.4)) {
        const sa = new T.Vector3(), sb = new T.Vector3(); a.getSize(sa); b.getSize(sb);
        const small = Math.min(sa.x*sa.y*sa.z, sb.x*sb.y*sb.z);
        const vol = ov[0]*ov[1]*ov[2];
        if (vol / small > 0.12)   // a bolt inside a hole is legitimate; half a body inside another is not
          r.collide.push({a: S[i].p.name, b: S[j].p.name, t,
                          overlap_mm: ov.map(v => +v.toFixed(2)), ratio: +(vol/small).toFixed(2)});
      }
    }
  }
  if (TIMES && M.info.setTime) M.setTime(TIMES[0]);
  // 3 floating parts: every part must touch another part or the ground
  const S = snap(); const GAP = Math.max(0.6, Math.cbrt(r.overall[0]*r.overall[1]*r.overall[2]) * 0.004);
  const floorY = Math.min(...S.map(x => x.b.min.y));
  for (const x of S) {
    if (Math.abs(x.b.min.y - floorY) < GAP) continue;
    const touches = S.some(y => y !== x &&
      Math.min(x.b.max.x,y.b.max.x)-Math.max(x.b.min.x,y.b.min.x) > -GAP &&
      Math.min(x.b.max.y,y.b.max.y)-Math.max(x.b.min.y,y.b.min.y) > -GAP &&
      Math.min(x.b.max.z,y.b.max.z)-Math.max(x.b.min.z,y.b.min.z) > -GAP);
    if (!touches) r.floating.push(x.p.name);
  }
  // 4 look gates
  const mats = new Set(); let noRough = 0, pureBlack = 0, lambert = 0, tris = 0;
  M.root.traverse(o => { if (!o.isMesh) return; const m = o.material; mats.add(m.uuid);
    const g = o.geometry; if (g) tris += (g.index ? g.index.count : g.attributes.position.count)/3;
    if (m.isMeshLambertMaterial || m.isMeshPhongMaterial || m.isMeshBasicMaterial) lambert++;
    if (!m.roughnessMap && !m.map && m.roughness !== undefined) noRough++;
    const c = m.color; if (c && c.r + c.g + c.b < 0.02) pureBlack++; });
  r.look = {materials: mats.size, legacyMaterials: lambert, meshesWithoutMaps: noRough, pureBlackMeshes: pureBlack,
            toneMapping: M.renderer.toneMapping, exposure: +M.renderer.toneMappingExposure.toFixed(2),
            shadows: M.renderer.shadowMap.enabled, env: !!M.scene.environment,
            triangles: Math.round(tris)};
  return r;
}, {TOL, TIMES}) : null;

/* ---- interaction cost: dragging must stay smooth on a plain office laptop ---- */
const perf = ready ? await page.evaluate(() => window.__model.perf ? window.__model.perf(10) : null) : null;

/* ---- canonical views + one contact sheet ---- */
const shots = [];
if (ready) for (const v of VIEWS) {
  await page.evaluate(n => { window.__model.setView(n); window.__model.render(); }, v);
  await page.waitForTimeout(140);
  const f = path.join(OUT, v + '.png');
  // clip, not locator.screenshot(): a canvas that keeps drawing never counts as "stable"
  const bb = await page.locator('#stage canvas').boundingBox();
  await page.screenshot({path: f, clip: bb, timeout: 120000}); shots.push(f);
}
if (ready && has('sheet')) {
  const sheet = await page.evaluate(async views => {
    const M = window.__model, c = document.createElement('canvas'), x = c.getContext('2d');
    const W = 760, H = 520, cols = 2; c.width = W*cols; c.height = H*Math.ceil(views.length/cols);
    x.fillStyle = '#fff'; x.fillRect(0,0,c.width,c.height);
    for (let i = 0; i < views.length; i++) {
      M.setView(views[i]); M.render();
      const img = new Image(); img.src = M.renderer.domElement.toDataURL('image/png');
      await img.decode();
      const s = Math.min(W/img.width, H/img.height);
      x.drawImage(img, (i%cols)*W + (W-img.width*s)/2, Math.floor(i/cols)*H + (H-img.height*s)/2,
                  img.width*s, img.height*s);
      x.fillStyle = '#111'; x.font = '600 20px Arial';
      x.fillText(views[i], (i%cols)*W + 14, Math.floor(i/cols)*H + 28);
    }
    return c.toDataURL('image/png');
  }, VIEWS);
  fs.writeFileSync(path.join(OUT, 'sheet.png'), Buffer.from(sheet.split(',')[1], 'base64'));
}
await browser.close(); srv.close();

// ms/frame while the camera moves, measured at 1500x1000 on software GL (swiftshader), which is
// one to two orders of magnitude slower than any real GPU and noisy run to run. 16 ms here still
// means a comfortable margin on an office laptop; past it, something structural is wrong.
const PERF_LIMIT = 16;
/* ---- report ---- */
const L = [], fail = [];
L.push(`# QA — ${path.basename(file)}`);
if (errors.length) { fail.push('console'); L.push('\n## FAIL console\n' + errors.slice(0,8).map(e => '- ' + e).join('\n')); }
if (audit) {
  L.push(`\n- parts: ${audit.nParts} · overall ${audit.overall.join(' × ')} ${audit.unit} · tri ${audit.look.triangles}`);
  L.push(`- render: toneMapping=${audit.look.toneMapping} exposure=${audit.look.exposure} shadows=${audit.look.shadows} env=${audit.look.env} materials=${audit.look.materials}`);
  if (audit.dims.length) { fail.push('dimensions');
    L.push('\n## FAIL dimensions (spec [X,Z,Y] mm vs measured)\n' +
      audit.dims.map(d => `- ${d.name}: spec ${d.spec.join('×')} → got ${d.got.join('×')}`).join('\n')); }
  if (audit.collide.length) { fail.push('collision');
    L.push('\n## FAIL collision (solid parts interpenetrate)\n' +
      audit.collide.slice(0,15).map(c => `- ${c.a} ∩ ${c.b}${c.t!==null?` @t=${c.t}`:''}: ${c.overlap_mm.join('×')} mm (${Math.round(c.ratio*100)}% of the smaller part)`).join('\n')); }
  if (audit.floating.length) { fail.push('floating');
    L.push('\n## FAIL floating parts (touch nothing — not bolted, not seated)\n- ' + audit.floating.join('\n- ')); }
  if (audit.look.legacyMaterials) { fail.push('materials');
    L.push(`\n## FAIL materials\n- ${audit.look.legacyMaterials} meshes use Lambert/Phong/Basic — PBR only (MeshStandard/Physical)`); }
  if (audit.look.pureBlackMeshes) L.push(`\n## WARN\n- ${audit.look.pureBlackMeshes} pure-black materials (nothing real is 0,0,0 — use #1c1e20)`);
  if (audit.look.meshesWithoutMaps > audit.nParts * 1.5) L.push(`- ${audit.look.meshesWithoutMaps} meshes have no roughness/colour map — flat CG look`);
  if (audit.notes.length) L.push('\n## WARN no spec declared\n- ' + audit.notes.slice(0,12).join('\n- '));
}
if (perf) {
  L.push(`- interaction: ${perf.interactive} ms/frame while moving · ${perf.still} ms/frame for the composed still`);
  if (perf.interactive > PERF_LIMIT) { fail.push('performance');
    L.push(`\n## FAIL performance\n- ${perf.interactive} ms/frame while dragging (limit ${PERF_LIMIT}). Usual causes: a material with \`transmission\` (each one re-renders the whole scene — use MAT.glass, not glass_real), post-processing left on during interaction, shadow map over 2048, or > 1.5 M triangles.`); }
}
L.push(`\n## ${fail.length ? 'RESULT: FAIL — ' + fail.join(', ') : 'RESULT: PASS'}`);
if (shots.length) L.push(`\nviews: ${shots.map(s => path.basename(s)).join(', ')}${has('sheet') ? ', sheet.png' : ''} in ${OUT}`);
fs.writeFileSync(path.join(OUT, 'qa.md'), L.join('\n'));
fs.writeFileSync(path.join(OUT, 'qa.json'), JSON.stringify({errors, audit, perf}, null, 1));
console.log(L.join('\n'));
process.exit(fail.length ? 1 : 0);
