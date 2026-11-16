/* Textures and picture frames used by more than one room. */
import * as THREE from "three";
import { box, canvasTex, esc, fitText, interactables, mat, noise, rand, rooms, safeUrl, showPanel, wrapText } from "./core.js";

/* ---------- textures for the rooms ---------- */

export function plasterTex(color, amount = 0.04) {
  return canvasTex(256, 256, (ctx, w, h) => { ctx.fillStyle = color; ctx.fillRect(0, 0, w, h); noise(ctx, w, h, amount, 900); });
}

export function plankTex(base, variance, plankPx = 42) {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    const n = Math.floor(h / plankPx);
    for (let i = 0; i < n; i++) {
      const a = (rand(i + 5) - 0.5) * variance;
      ctx.fillStyle = a > 0 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${-a})`;
      ctx.fillRect(0, i * plankPx, w, plankPx);
      ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(0, i * plankPx, w, 2);
      const jx = rand(i + 40) * w;
      ctx.fillRect(jx, i * plankPx, 2, plankPx);
    }
    noise(ctx, w, h, 0.06, 1500);
  });
}

/* ================================================================== *
 * ABOUT ME (9 o'clock): a bright modern living room
 * ================================================================== */

export function skyTexture() {
  return canvasTex(512, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#7fb8f0"); g.addColorStop(0.7, "#cfe8fb"); g.addColorStop(1, "#eef7ff");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    [[90, 70, 46], [140, 62, 36], [330, 100, 40], [380, 92, 52], [440, 104, 34]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = "#8fb98a";
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, 190); for (let x = 0; x <= w; x += 16) ctx.lineTo(x, 184 + Math.sin(x * 0.03) * 14); ctx.lineTo(w, h); ctx.fill();
    ctx.fillStyle = "#5f9560";
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, 220); for (let x = 0; x <= w; x += 12) ctx.lineTo(x, 212 + Math.sin(x * 0.05 + 2) * 12); ctx.lineTo(w, h); ctx.fill();
  });
}

export function cardTexture(def, style) {
  return canvasTex(512, 384, (ctx, w, h) => {
    ctx.fillStyle = style.bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = style.edge; ctx.lineWidth = 5; ctx.strokeRect(16, 16, w - 32, h - 32);
    ctx.fillStyle = style.ink; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.font = "800 40px 'Bricolage Grotesque', Arial, sans-serif";
    const y = wrapText(ctx, def.title, 44, 92, w - 88, 46, 2);
    ctx.font = "400 26px 'Literata', Georgia, serif";
    ctx.fillStyle = style.sub;
    wrapText(ctx, def.text, 44, y + 18, w - 88, 36, 6);
  });
}

export function placeholderPhoto(caption) {
  return canvasTex(512, 384, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#d7e3ea"); g.addColorStop(1, "#e9dfd0");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#6b7a86"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "700 34px 'Bricolage Grotesque', Arial, sans-serif";
    ctx.fillText("Your photo goes here", w / 2, h / 2 - 14);
    ctx.font = "400 22px 'Literata', Georgia, serif";
    ctx.fillText(fitText(ctx, caption || "", w - 60), w / 2, h / 2 + 28);
  });
}

export const textureLoader = new THREE.TextureLoader();

/** Load an image into a material, cropping it to fill an area of a given aspect ratio. */
export function loadInto(material, src, aspect, onLoad) {
  if (!src) return;
  textureLoader.load(src, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    const a = t.image.width / t.image.height;
    if (a > aspect) { t.repeat.set(aspect / a, 1); t.offset.set((1 - aspect / a) / 2, 0); }
    else { t.repeat.set(1, a / aspect); t.offset.set(0, (1 - a / aspect) / 2); }
    material.map = t;
    if (material.emissiveMap !== undefined && material.emissive && material.emissiveIntensity > 0) material.emissiveMap = t;
    material.needsUpdate = true;
    if (onLoad) onLoad(t);
  }, undefined, () => {});
}

export function addPicture(parent, def, x, y, z, rotY, w, h, style) {
  const f = new THREE.Group();
  f.position.set(x, y, z);
  f.rotation.y = rotY;
  parent.add(f);
  box(w + 0.12, h + 0.12, 0.05, mat(style.frame, { roughness: 0.6 }), 0, 0, 0, f);
  if (style.mat) box(w + 0.02, h + 0.02, 0.052, mat(style.mat), 0, 0, 0, f);
  const isPhoto = def.type === "photo";
  const tex = isPhoto ? placeholderPhoto(def.caption) : cardTexture(def, style);
  const pm = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: style.glow ?? 0.3, roughness: 0.9 });
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, h - 0.1), pm);
  pic.position.z = 0.03;
  f.add(pic);
  if (isPhoto) loadInto(pm, def.src, (w - 0.1) / (h - 0.1));
  interactables.push({
    mesh: pic,
    hint: isPhoto ? "Look at photo" : "Read: " + def.title,
    mat: pm,
    base: style.glow ?? 0.3,
    open: () => showPanel(isPhoto
      ? {
        title: def.caption || "Photo",
        meta: "",
        html: (safeUrl(def.src) ? `<img src="${esc(safeUrl(def.src))}" alt="${esc(def.caption || "Photo")}" style="width:100%;border-radius:.4rem;display:block;margin:0 0 .75rem" onerror="this.remove()">` : "") + (def.text ? `<p>${esc(def.text)}</p>` : ""),
      }
      : { title: def.title, meta: "", html: `<p>${esc(def.text)}</p>` }),
  });
  return f;
}

