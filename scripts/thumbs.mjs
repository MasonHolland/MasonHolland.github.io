#!/usr/bin/env node
/**
 * Makes small copies of the game covers for the room: 200x300 JPEGs (the whole image, centred,
 * with a blurred copy filling any space around it) in assets/covers/small/. The full-size originals in assets/covers/ are kept, so the
 * size can change later: edit SIZE and run this again with --force.
 *
 * sync-games.mjs calls this after saving covers. To run it on its own:
 *   node scripts/thumbs.mjs          make any that are missing
 *   node scripts/thumbs.mjs --force  remake them all
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SIZE = { w: 200, h: 300 };
export const SMALL_DIR = "assets/covers/small";

async function exists(p) { try { await access(p); return true; } catch { return false; } }

/** "assets/covers/x.jpg" -> "assets/covers/small/x.jpg" */
export const thumbPath = (cover) => `${SMALL_DIR}/${path.basename(cover)}`;

/**
 * Give each game with a cover a `thumb`, making the file if it is missing (or if force).
 * If the image library isn't installed, games keep just their full-size cover.
 */
export async function addThumbs(games, { force = false } = {}) {
  let sharp;
  try { sharp = (await import("sharp")).default; }
  catch { console.error("thumbs: the sharp package is missing (run npm install); using full-size covers."); return 0; }
  await mkdir(path.join(ROOT, SMALL_DIR), { recursive: true });
  let made = 0;
  for (const g of games) {
    if (!g.cover) continue;
    const rel = thumbPath(g.cover), abs = path.join(ROOT, rel);
    if (force || !(await exists(abs))) {
      try {
        const src = await readFile(path.join(ROOT, g.cover));
        // the whole image, centred, over a blurred and darkened copy of itself filling the box,
        // so square PlayStation art and wide Steam banners aren't cut off
        const backdrop = await sharp(src).resize(SIZE.w, SIZE.h, { fit: "cover" })
          .blur(12).modulate({ brightness: 0.6 }).toBuffer();
        const front = await sharp(src).resize(SIZE.w, SIZE.h, { fit: "inside" }).toBuffer();
        const buf = await sharp(backdrop)
          .composite([{ input: front, gravity: "center" }])
          .jpeg({ quality: 78, mozjpeg: true })
          .toBuffer();
        await writeFile(abs, buf);
        made++;
      } catch (e) {
        console.error(`thumbs: couldn't shrink ${g.cover}: ${e.message}`);
        continue;
      }
    }
    g.thumb = rel;
  }
  return made;
}

async function main() {
  const file = path.join(ROOT, "data", "games.json");
  const data = JSON.parse(await readFile(file, "utf8"));
  const force = process.argv.includes("--force");
  let made = await addThumbs(data.games || [], { force });
  await writeFile(file, JSON.stringify(data, null, 2) + "\n");
  // Switch covers too; data/switch-games.json itself is left as you wrote it
  try {
    const sw = JSON.parse(await readFile(path.join(ROOT, "data", "switch-games.json"), "utf8"));
    made += await addThumbs((sw.games || []).map((g) => ({ ...g })), { force });
  } catch { /* no Switch file */ }
  console.log(`Made ${made} small covers in ${SMALL_DIR}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
