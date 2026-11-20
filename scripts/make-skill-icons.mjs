// Build assets/rooms/skill-icons.js: brand logos from simple-icons (CC0) and outline icons from
// lucide-static (ISC), as SVG path data on a 24 x 24 grid. To add an icon, add it to brand or
// outline below (and to BRAND_TERMS or OUTLINE_FOR in assets/rooms/work.js), then run from the
// repo root:
//   npm install --no-save simple-icons@13.21.0 lucide-static@0.460.0
//   node scripts/make-skill-icons.mjs
import { readFileSync, writeFileSync } from "node:fs";
import * as si from "simple-icons";

const out = process.argv[2] || "assets/rooms/skill-icons.js";
const brand = {
  javascript: "siJavascript", typescript: "siTypescript", postgresql: "siPostgresql", git: "siGit", github: "siGithub",
  react: "siReact", vue: "siVuedotjs", s3: "siAmazons3", aws: "siAmazonwebservices", circleci: "siCircleci",
  jenkins: "siJenkins", docker: "siDocker",
};
const outline = {
  compass: "compass", layers: "layers", accessibility: "accessibility", users: "users", messages: "messages-square",
  puzzle: "puzzle", handshake: "heart-handshake", database: "database",
};

const brands = {};
for (const [k, name] of Object.entries(brand)) {
  const icon = si[name];
  if (!icon) throw new Error("no simple icon " + name);
  brands[k] = { title: icon.title, hex: "#" + icon.hex, d: icon.path };
}

// lucide SVG elements to path data
const num = (s, a) => +(s.match(new RegExp(`\\b${a}="([^"]+)"`)) || [0, 0])[1];
function toPath(svg) {
  const ds = [];
  for (const m of svg.matchAll(/<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*)\/?>/g)) {
    const [, tag, at] = m;
    if (tag === "path") ds.push(at.match(/\bd="([^"]+)"/)[1]);
    else if (tag === "circle") { const cx = num(at, "cx"), cy = num(at, "cy"), r = num(at, "r"); ds.push(`M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`); }
    else if (tag === "ellipse") { const cx = num(at, "cx"), cy = num(at, "cy"), rx = num(at, "rx"), ry = num(at, "ry"); ds.push(`M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`); }
    else if (tag === "line") ds.push(`M${num(at, "x1")} ${num(at, "y1")}L${num(at, "x2")} ${num(at, "y2")}`);
    else if (tag === "rect") {
      const x = num(at, "x"), y = num(at, "y"), w = num(at, "width"), h = num(at, "height"), r = num(at, "rx");
      ds.push(r ? `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z` : `M${x} ${y}h${w}v${h}h${-w}z`);
    } else {
      const pts = at.match(/\bpoints="([^"]+)"/)[1].trim().split(/[\s,]+/);
      let d = `M${pts[0]} ${pts[1]}`;
      for (let i = 2; i < pts.length; i += 2) d += `L${pts[i]} ${pts[i + 1]}`;
      ds.push(tag === "polygon" ? d + "z" : d);
    }
  }
  // an element's first "m" counts from the origin; joined to the one before, it would count from
  // where that one ended. A move to the origin first keeps it right (and keeps its implicit
  // lines relative, which turning it into "M" would not).
  return ds.map((d) => "M0 0" + d.trim()).join("");
}
const outlines = {};
for (const [k, file] of Object.entries(outline)) {
  outlines[k] = toPath(readFileSync(`node_modules/lucide-static/icons/${file}.svg`, "utf8"));
}

writeFileSync(out, `/*
 * Icons for the Work room's skill tiles, as SVG path data on a 24 x 24 grid (made by scripts/make-skill-icons.mjs).
 * BRAND: official logos from Simple Icons (simpleicons.org, CC0; the logos are their owners'
 * trademarks), filled in each brand's colour. OUTLINE: Lucide icons (lucide.dev, ISC licence),
 * drawn as 2 px strokes.
 */
export const BRAND = ${JSON.stringify(brands, null, 2)};

export const OUTLINE = ${JSON.stringify(outlines, null, 2)};
`);
console.log("brands", Object.keys(brands).length, "outlines", Object.keys(outlines).length);
