// Draw assets/about/world-map.png, the map on the About room wall: Natural Earth land and country
// borders (public domain, via the world-atlas package) in an equirectangular projection from
// latitude 84 N to 58 S (the pins in assets/rooms/about.js use the same numbers). Run from the
// repo root:
//   npm install --no-save world-atlas@2.0.2 topojson-client@3.1.0
//   node scripts/make-world-map.mjs
import { readFileSync, mkdirSync } from "node:fs";
import { feature, mesh } from "topojson-client";
import sharp from "sharp";

export const TOP = 84, BOTTOM = -58;
const W = 2400, H = Math.round((W * (TOP - BOTTOM)) / 360);
const x = (lon) => ((lon + 180) / 360) * W;
const y = (lat) => ((TOP - lat) / (TOP - BOTTOM)) * H;

const land = JSON.parse(readFileSync("node_modules/world-atlas/land-50m.json", "utf8"));
const countries = JSON.parse(readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"));

// Shapes that cross the 180th meridian (eastern Russia, Fiji) jump from one edge to the other. Make
// their longitudes run on continuously instead, and where that takes a shape off one edge, draw it
// again 360 degrees over so the rest appears on the other edge.
function unwrap(pts) {
  const out = [];
  let shift = 0;
  pts.forEach(([lo, la], i) => {
    if (i) { const d = lo + shift - out[i - 1][0]; if (d > 180) shift -= 360; else if (d < -180) shift += 360; }
    out.push([lo + shift, la]);
  });
  return out;
}
function draw(pts, close) {
  const u = unwrap(pts), lons = u.map((p) => p[0]);
  const offsets = [0];
  if (Math.min(...lons) < -180) offsets.push(360);
  if (Math.max(...lons) > 180) offsets.push(-360);
  return offsets.map((o) => u.map(([lo, la], i) => `${i ? "L" : "M"}${x(lo + o).toFixed(1)} ${y(la).toFixed(1)}`).join("") + (close ? "Z" : "")).join("");
}
const ring = (pts) => draw(pts, true);
const line = (pts) => draw(pts, false);
const polys = (geom) => (geom.type === "Polygon" ? [geom.coordinates] : geom.type === "MultiPolygon" ? geom.coordinates : []);

let landD = "";
for (const f of feature(land, land.objects.land).features) for (const p of polys(f.geometry)) landD += p.map(ring).join("");
const borders = mesh(countries, countries.objects.countries, (a, b) => a !== b);
const borderD = borders.coordinates.map(line).join("");

let grid = "";
for (let lon = -150; lon < 180; lon += 30) grid += `M${x(lon)} 0V${H}`;
for (let lat = -30; lat <= 60; lat += 30) grid += `M0 ${y(lat)}H${W}`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#dde6e3"/>
  <path d="${grid}" stroke="#c6d3cf" stroke-width="1.5" fill="none"/>
  <path d="M0 ${y(0)}H${W}" stroke="#b9c9c4" stroke-width="2" stroke-dasharray="10 8" fill="none"/>
  <path d="${landD}" fill="#efe3c9" stroke="#a88f68" stroke-width="1.6" stroke-linejoin="round" fill-rule="evenodd"/>
  <path d="${borderD}" stroke="#c9b48e" stroke-width="1" fill="none" stroke-linejoin="round"/>
</svg>`;

mkdirSync("assets/about", { recursive: true });
const info = await sharp(Buffer.from(svg)).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile("assets/about/world-map.png");
console.log(info.width, info.height, info.size);
