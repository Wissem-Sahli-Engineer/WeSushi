// The box in 3D, built from the real photo: kraft from the bowl wall, the crust from
// between two pieces, each piece's real cut face on top, and the real soy in its cup.
import * as THREE from '../vendor/three.module.min.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function roundedRect(w, d, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export function createBox3D(container, { base = 'assets/img/box-3d/', pieces = 8, onReady } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a5a7c, 1.45));
  const key = new THREE.DirectionalLight(0xfff1df, 2.7);
  key.position.set(2.6, 5.5, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 4;
  key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 20 });
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc4d6ff, 0.9);
  rim.position.set(-3, 2.5, -3.5);
  scene.add(rim);

  let pending = 0;
  const loader = new THREE.TextureLoader();
  const tex = (name, mirror) => {
    pending++;
    // once every photo has arrived, draw one frame so it is sent to the GPU now, not mid-scroll
    const t = loader.load(`${base}${name}.webp`, () => {
      if (--pending) return;
      layout(current);
      renderer.render(scene, camera);
      onReady?.();
    });
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (mirror) t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
    return t;
  };

  const world = new THREE.Group();
  scene.add(world);

  // kraft paper bowl, shaped like the real one: low walls and a rolled rim
  const kraft = tex('kraft');
  kraft.wrapS = kraft.wrapT = THREE.RepeatWrapping;
  const BOT = 0.98, TOP = 1.2, H = 0.64, WALL = 0.018;
  const paper = (tint, ru, rv) => {
    const map = kraft.clone();
    map.repeat.set(ru, rv);
    map.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: 0.8, color: tint, roughness: 1 });
  };
  const outerMat = paper(0xffffff, 6, 0.65);
  const innerMat = paper(0xe8d6c2, 6, 0.65);
  const floorMat = paper(0xe2cfb9, 2, 2);
  const wallGeo = r0 => new THREE.LatheGeometry([new THREE.Vector2(BOT - r0, 0.004), new THREE.Vector2(TOP - r0, H)], 128, 0, Math.PI * 2);
  const outer = new THREE.Mesh(wallGeo(0), outerMat);
  const inner = new THREE.Mesh(wallGeo(WALL), innerMat);
  inner.material.side = THREE.BackSide;
  const floorGeo = new THREE.CircleGeometry(BOT - WALL, 96);
  floorGeo.rotateX(-Math.PI / 2);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = 0.012;
  const underGeo = new THREE.CircleGeometry(BOT, 96);
  underGeo.rotateX(Math.PI / 2);
  const under = new THREE.Mesh(underGeo, outerMat);
  // rolled rim and the pressed foot ring
  const rimMat = paper(0xfff4e6, 24, 1);
  const lipRoll = new THREE.Mesh(new THREE.TorusGeometry(TOP - WALL / 2, 0.026, 14, 160), rimMat);
  lipRoll.rotation.x = Math.PI / 2;
  lipRoll.position.y = H;
  const foot = new THREE.Mesh(new THREE.TorusGeometry(BOT + 0.004, 0.012, 8, 128), paper(0xd8c3ab, 24, 1));
  foot.rotation.x = Math.PI / 2;
  foot.position.y = 0.012;
  const bowlParts = [outer, inner, floor, under, lipRoll, foot];
  bowlParts.forEach(m => { m.castShadow = true; m.receiveShadow = true; });
  const bowlGroup = new THREE.Group();
  bowlGroup.add(...bowlParts);
  const catcher = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), new THREE.ShadowMaterial({ opacity: 0.16 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.y = -0.002;
  catcher.receiveShadow = true;
  bowlGroup.add(catcher);
  world.add(bowlGroup);

  // sauce cup: clear plastic tub around real soy sauce
  const sauceTex = tex('sauce');
  sauceTex.repeat.set(1 / 0.78, 1 / 0.56);
  sauceTex.offset.set(0.5, 0.5);
  const cup = new THREE.Group();
  const liquidGeo = new THREE.ShapeGeometry(roundedRect(0.78, 0.56, 0.16), 12);
  liquidGeo.rotateX(-Math.PI / 2);
  const liquid = new THREE.Mesh(liquidGeo, new THREE.MeshPhysicalMaterial({ map: sauceTex, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }));
  liquid.position.y = 0.2;
  const tubShape = roundedRect(0.86, 0.64, 0.2);
  tubShape.holes.push(roundedRect(0.79, 0.57, 0.165));
  const tubGeo = new THREE.ExtrudeGeometry(tubShape, { depth: 0.28, bevelEnabled: false, curveSegments: 12 });
  tubGeo.rotateX(-Math.PI / 2);
  const tub = new THREE.Mesh(tubGeo, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, roughness: 0.05, clearcoat: 1, depthWrite: false }));
  const lipShape = roundedRect(0.98, 0.76, 0.25);
  lipShape.holes.push(roundedRect(0.86, 0.64, 0.2));
  const lipGeo = new THREE.ExtrudeGeometry(lipShape, { depth: 0.018, bevelEnabled: false, curveSegments: 12 });
  lipGeo.rotateX(-Math.PI / 2);
  const lip = new THREE.Mesh(lipGeo, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.05, clearcoat: 1, depthWrite: false }));
  lip.position.y = 0.28;
  const baseGeo = new THREE.ShapeGeometry(roundedRect(0.86, 0.64, 0.2), 12);
  baseGeo.rotateX(-Math.PI / 2);
  const cupBase = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({ color: 0x1d0d05, roughness: 0.4 }));
  cupBase.position.y = 0.005;
  liquid.castShadow = cupBase.castShadow = true;
  cup.add(cupBase, liquid, tub, lip);
  cup.scale.setScalar(0.82);
  world.add(cup);

  // crispy pieces: an irregular hand-cut round with a rounded fried edge,
  // bumpy real crust on the sides and the real cut face on both ends
  const crust = tex('chapelure');
  crust.wrapS = crust.wrapT = THREE.RepeatWrapping;
  // texels kept square: about 1.6 units around the piece, 0.5 down its side
  crust.repeat.set(4, 2);
  const crustMat = new THREE.MeshStandardMaterial({ map: crust, bumpMap: crust, bumpScale: 3, color: 0xffffff, emissive: 0x5a300e, emissiveIntensity: 0.28, roughness: 0.88 });
  const faceMats = [1, 2, 3, 4].map(n => new THREE.MeshPhysicalMaterial({ map: tex(`face-${n}`), roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.5 }));
  const FACE_R = 232 / 256;
  const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

  function pieceGeometry(seed, r, h) {
    const seg = 72, bevel = 0.045, rings = 6;
    const k1 = 0.07 * hash(seed), k2 = 0.04 * hash(seed + 1), p1 = hash(seed + 2) * 6.28, p2 = hash(seed + 3) * 6.28;
    // a squashed round with a slight dent, like a real piece pressed in the box
    const outline = a => r * (1 + k1 * Math.cos(2 * a + p1) + k2 * Math.cos(3 * a + p2) + 0.012 * Math.sin(9 * a + seed));
    const pos = [], uv = [], grp = [[], [], []], idx = (j, s) => j * (seg + 1) + s;
    // side: profile from top cap edge, over the rounded rim, down, and back in at the bottom
    const prof = [];
    for (let k = 0; k <= rings; k++) { const t = k / rings * Math.PI / 2; prof.push([-bevel + Math.sin(t) * bevel, h / 2 - bevel + Math.cos(t) * bevel]); }
    for (let k = 0; k <= rings; k++) { const t = k / rings * Math.PI / 2; prof.push([-bevel + Math.cos(t) * bevel, -h / 2 + bevel - Math.sin(t) * bevel]); }
    // texture runs by real distance down the side, so the crust is not stretched
    const dist = [0];
    for (let j = 1; j < prof.length; j++) dist.push(dist[j - 1] + Math.hypot(prof[j][0] - prof[j - 1][0], prof[j][1] - prof[j - 1][1]));
    const len = dist[dist.length - 1];
    prof.forEach(([dr, y], j) => {
      for (let s = 0; s <= seg; s++) {
        const a = s / seg * Math.PI * 2, R = outline(a) + dr;
        pos.push(Math.cos(a) * R, y, Math.sin(a) * R);
        uv.push(s / seg, dist[j] / len);
      }
    });
    const sideRows = prof.length;
    for (let j = 0; j < sideRows - 1; j++) for (let s = 0; s < seg; s++) {
      const a = idx(j, s), b = idx(j + 1, s), c = idx(j, s + 1), d = idx(j + 1, s + 1);
      grp[0].push(a, c, b, c, d, b);
    }
    // caps, mapped so the face disc lines up with the outline
    [[h / 2, 1], [-h / 2, -1]].forEach(([y, dir], ci) => {
      const centre = pos.length / 3;
      pos.push(0, y + dir * 0.004, 0); uv.push(0.5, 0.5);
      const start = pos.length / 3;
      for (let s = 0; s <= seg; s++) {
        const a = s / seg * Math.PI * 2, R = outline(a) - bevel;
        pos.push(Math.cos(a) * R, y, Math.sin(a) * R);
        const f = FACE_R * (R / (r - bevel)) * 0.5;
        uv.push(0.5 + Math.cos(a) * f, 0.5 + dir * Math.sin(a) * f);
      }
      for (let s = 0; s < seg; s++) {
        if (dir > 0) grp[1 + ci].push(centre, start + s + 1, start + s);
        else grp[1 + ci].push(centre, start + s, start + s + 1);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const all = [...grp[0], ...grp[1], ...grp[2]];
    geo.setIndex(all);
    geo.addGroup(0, grp[0].length, 0);
    geo.addGroup(grp[0].length, grp[1].length, 1);
    geo.addGroup(grp[0].length + grp[1].length, grp[2].length, 2);
    geo.computeVertexNormals();
    return geo;
  }

  const items = [];
  for (let i = 0; i < pieces; i++) {
    const r = 0.26 * (1 + (hash(i + 10) - 0.5) * 0.08);
    const h = 0.4 + (hash(i + 20) - 0.5) * 0.04;
    const face = faceMats[i % faceMats.length];
    const mesh = new THREE.Mesh(pieceGeometry(i + 1, r, h), [crustMat, face, faceMats[(i + 2) % faceMats.length]]);
    mesh.castShadow = mesh.receiveShadow = true;
    const a = (i / pieces) * Math.PI * 2 + 0.25;
    // close enough to the cup, far enough from the wall that nothing passes through the bowl
    const ring = 0.63;
    const g = new THREE.Group();
    g.add(mesh);
    world.add(g);
    items.push({
      g, a, ring, h,
      spin: ((i * 53) % 360) * Math.PI / 180,
      tiltX: (i % 2 ? 1 : -1) * (0.28 + (i % 3) * 0.08),
      tiltZ: (i % 3 - 1) * 0.3,
      lift: 0.85 + Math.sin(i * 1.7) * 0.14,
    });
  }

  let target = 0, current = 0, visible = true, raf = 0, t0 = performance.now();

  function layout(p) {
    const e = smooth(0.05, 0.6, p);
    bowlGroup.position.y = -1.05 * e;
    cup.position.y = 0.07 + 1.95 * e;
    cup.rotation.x = 0.35 * e;
    items.forEach(it => {
      const R = it.ring * (1 + 0.95 * e);
      it.g.position.set(Math.cos(it.a) * R, 0.07 + it.h / 2 + it.lift * e, Math.sin(it.a) * R);
      it.g.rotation.set(it.tiltX * e, it.spin + 0.6 * e, it.tiltZ * e);
    });
    world.rotation.y = -0.55 + 1.15 * p;
    const dist = lerp(5.2, 6.8, e);
    const elev = lerp(0.72, 0.5, e);
    camera.position.set(0, Math.sin(elev) * dist + lerp(0.35, 0.5, e), Math.cos(elev) * dist);
    camera.lookAt(0, lerp(0.35, 0.55, e), 0);
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function frame(now) {
    raf = 0;
    if (!visible) return;
    current += (target - current) * 0.12;
    layout(current);
    world.rotation.y += Math.sin((now - t0) / 2400) * 0.04;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();
  layout(0);
  renderer.render(scene, camera);
  raf = requestAnimationFrame(frame);

  return {
    setProgress(p) { target = p; },
    setVisible(v) {
      visible = v;
      if (v && !raf) raf = requestAnimationFrame(frame);
    },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); renderer.domElement.remove(); },
  };
}
