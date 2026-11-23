// Build data/projects.json from the GitHub repos listed in data/project-repos.json. For each repo it
// reads the README and the repo's details, and pulls out:
//   title       the README's first "# " heading (or the repo name)
//   blurb       the first paragraph under it: what the app does
//   problem     the first paragraph of a "## The problem" section, and problemPoints: its list items
//   features    the rows of the table in "## The solution" (or "## Features"): [{ name, what }]
//   tags        the main tools from the "## Tech stack" table (or the repo's topics and language)
//   url         the live site: the repo's homepage, or the first outside link in the "Try it" line
//   video       a linked .mp4/.webm/.mov (the demo)
//   screenshots the images in a "## Screenshots" section, with their captions
// Screenshots (shrunk) and the demo video are copied into assets/projects/<repo>/ so the site serves
// them itself. Each run fetches everything again, so a changed README (new screenshots, a new video)
// replaces what was saved. If a repo can't be read, or any of its media fails to download, the
// project's last good version (data and media) is kept instead. Run by the daily workflow and whenever project-repos.json changes; or by hand:
//   GITHUB_TOKEN=... node scripts/sync-projects.mjs   (the token is optional; it raises the rate limit)
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, renameSync, readdirSync } from "node:fs";
import sharp from "sharp";

const LIST = "data/project-repos.json", OUT = "data/projects.json", MEDIA = "assets/projects";
const MAX_VIDEO_MB = 20;
const headers = { "User-Agent": "portfolio-sync", Accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const api = async (path) => {
  const r = await fetch(`https://api.github.com/${path}`, { headers });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
};

/* ---------- markdown helpers ---------- */

/** Markdown/HTML to plain text: links and images to their text, emphasis and tags dropped. */
function plain(md) {
  return String(md || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(^|[^\w*])[*_]([^*_\n]+)[*_](?=[^\w*]|$)/g, "$1$2")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/[▶►]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split a README into { intro, sections: [{ title, body }] } at its "## " headings. */
function sections(md) {
  const text = md.replace(/\r\n/g, "\n").replace(/<!--[\s\S]*?-->/g, "");
  const parts = text.split(/^##\s+/m);
  const head = parts.shift();
  const h1 = head.match(/^#\s+(.+)$/m);
  return {
    title: h1 ? plain(h1[1]) : "",
    intro: h1 ? head.slice(head.indexOf(h1[0]) + h1[0].length) : head,
    sections: parts.map((p) => { const nl = p.indexOf("\n"); return { title: plain(p.slice(0, nl < 0 ? undefined : nl)), body: nl < 0 ? "" : p.slice(nl + 1) }; }),
  };
}
const section = (doc, re) => doc.sections.find((s) => re.test(s.title));

/** Prose paragraphs of a block: skipping headings, images, HTML blocks, tables, lists and badges. */
function paragraphs(block) {
  return String(block || "").split(/\n\s*\n/).map((b) => b.trim()).filter((b) =>
    b && !/^(#|<|!\[|\||[-*+] |\d+\. |```|>)/.test(b) && !/shields\.io|badge/i.test(b));
}

/** Rows of the first markdown table in a block, as arrays of raw cells (header and rule skipped). */
function tableRows(block) {
  const lines = String(block || "").split("\n").filter((l) => /^\s*\|/.test(l));
  return lines.slice(2).map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
}

/** Every link target in a block (markdown and HTML), with its text. */
function links(block) {
  const out = [];
  for (const m of String(block || "").matchAll(/\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)) out.push({ text: m[1], href: m[2] });
  for (const m of String(block || "").matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) out.push({ text: plain(m[2]), href: m[1] });
  return out;
}

/** Images in a block with a caption: the <sub> after it in the same cell, else its alt text. */
function images(block) {
  const out = [];
  const cells = String(block || "").split(/<\/td>|\n\s*\n/);
  for (const cell of cells) {
    for (const m of cell.matchAll(/<img\s[^>]*src="([^"]+)"[^>]*>|!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)) {
      const src = m[1] || m[3];
      const alt = m[1] ? (m[0].match(/alt="([^"]*)"/) || [, ""])[1] : m[2];
      const sub = cell.match(/<sub>([\s\S]*?)<\/sub>/);
      if (/shields\.io|badge/i.test(src)) continue;
      out.push({ src, caption: plain(sub ? sub[1] : alt) });
    }
  }
  return out;
}

/** The first sentence-ish chunk of text up to max characters, cut at a sentence end if possible. */
function clip(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max), end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > max * 0.5 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + "…";
}

/** The main tools from a tech stack table: the first named thing in each row, skipping tests and the like. */
function techTags(block) {
  const tags = [];
  for (const [area, choice] of tableRows(block)) {
    if (!choice || /test|media|icon|haptic|lint|format|ci\b|deploy/i.test(area)) continue;
    const link = choice.match(/\[([^\]]+)\]\(/);
    let name = link ? link[1] : plain(choice).split(/[·,(;]| with | and /)[0];
    name = name.replace(/\s+\d[\w.]*$/, "").trim();   // "React 19" -> "React"
    if (name && name.length <= 24 && !tags.includes(name)) tags.push(name);
    if (tags.length >= 5) break;
  }
  return tags;
}

/* ---------- media ---------- */

const raw = (owner, repo, branch, path) => `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path.replace(/^\.?\//, "")}`;
const isLocal = (href) => !/^[a-z]+:\/\//i.test(href) && !href.startsWith("#");

async function download(url) {
  // the token goes along to GitHub's own file server, so media in private repos can be read too
  const h = { "User-Agent": "portfolio-sync" };
  if (process.env.GITHUB_TOKEN && url.startsWith("https://raw.githubusercontent.com/")) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const r = await fetch(url, { headers: h });
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

/* ---------- one repo ---------- */

async function project(entry) {
  const repoUrl = typeof entry === "string" ? entry : entry.repo;
  const m = String(repoUrl || "").match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!m) throw new Error(`not a GitHub repo link: ${repoUrl}`);
  const [owner, name] = [m[1], m[2].replace(/\.git$/, "")];
  const info = await api(`repos/${owner}/${name}`);
  const branch = info.default_branch;
  let md = "";
  try { md = Buffer.from((await api(`repos/${owner}/${name}/readme`)).content, "base64").toString("utf8"); } catch { /* no README */ }
  const doc = sections(md);

  const intro = paragraphs(doc.intro);
  const blurbPara = intro.find((p) => !/try it/i.test(p)) || "";
  const tryLine = intro.find((p) => /try it/i.test(p)) || "";
  const live = info.homepage || (links(tryLine).find((l) => /^https?:/.test(l.href) && !/github\.com\/[^/]+\/[^/]+\/?$/.test(l.href)) || {}).href || "";
  const videoLink = links(md).find((l) => /\.(mp4|webm|mov)(\?|$)/i.test(l.href));
  const problem = section(doc, /problem/i), solution = section(doc, /solution|features/i), shots = section(doc, /screenshot/i), tech = section(doc, /tech/i);

  const p = {
    repo: info.html_url,
    name,
    title: doc.title || name.replace(/[-_]/g, " "),
    blurb: clip(plain(blurbPara) || info.description || "", 320),
    problem: problem ? clip(plain(paragraphs(problem.body)[0] || ""), 500) : "",
    problemPoints: problem ? (problem.body.match(/^s*[-*+] .+$/gm) || []).map((l) => clip(plain(l.replace(/^s*[-*+] /, "")), 220)).slice(0, 6) : [],
    features: solution ? tableRows(solution.body).map(([n, w]) => ({ name: plain(n), what: plain(w) })).filter((f) => f.name && f.what) : [],
    tags: (tech && techTags(tech.body).length ? techTags(tech.body) : [...(info.topics || []), info.language].filter(Boolean)).slice(0, 5),
    url: live,
    year: String(new Date(info.created_at).getFullYear()),
    updated: info.pushed_at,
    screenshots: [],
    captions: [],
    video: "",
  };
  p.summary = p.blurb;

  // copy the media into a fresh folder beside assets/projects/<repo>/; it replaces the old one
  // only once everything has downloaded (see the loop at the bottom)
  const dir = `${MEDIA}/${name}`, tmp = `${MEDIA}/.${name}.new`;
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  let failed = 0;
  const list = (shots ? images(shots.body) : []).slice(0, 8);
  for (const [i, s] of list.entries()) {
    try {
      const url = isLocal(s.src) ? raw(owner, name, branch, s.src) : s.src;
      await sharp(await download(url)).resize({ width: 900, height: 1300, fit: "inside", withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(`${tmp}/shot-${i + 1}.png`);
      p.screenshots.push(`${dir}/shot-${i + 1}.png`);
      p.captions.push(s.caption);
    } catch (e) { failed++; console.warn(`  screenshot failed (${s.src}): ${e.message}`); }
  }
  if (videoLink) {
    try {
      const url = isLocal(videoLink.href) ? raw(owner, name, branch, videoLink.href) : videoLink.href;
      const buf = await download(url);
      if (buf.length <= MAX_VIDEO_MB * 1024 * 1024) {
        const file = `demo.${(videoLink.href.match(/\.(mp4|webm|mov)/i) || [, "mp4"])[1].toLowerCase()}`;
        writeFileSync(`${tmp}/${file}`, buf);
        p.video = `${dir}/${file}`;
      } else {
        p.video = url;   // too big to copy: link to it instead
      }
    } catch (e) { failed++; console.warn(`  video failed: ${e.message}`); }
  }
  // anything set by hand in project-repos.json wins
  if (typeof entry === "object") Object.entries(entry).forEach(([k, v]) => { if (k !== "repo" && v !== "" && v != null) p[k] = v; });
  return { p, tmp, dir, complete: failed === 0 };
}

/* ---------- all of them ---------- */

const listed = existsSync(LIST) ? JSON.parse(readFileSync(LIST, "utf8")).repos || [] : [];
const repoName = (e) => ((String(typeof e === "string" ? e : e && e.repo).match(/github\.com\/[^/]+\/([^/#?]+)/i) || [])[1] || "").replace(/\.git$/, "");
const before = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")).projects || [] : [];
const projects = [];
for (const entry of listed) {
  const previous = before.find((x) => x.name === repoName(entry));
  try {
    const { p, tmp, dir, complete } = await project(entry);
    if (!complete && previous) {
      // something didn't download: keep the last good version rather than lose media
      rmSync(tmp, { recursive: true, force: true });
      projects.push(previous);
      console.warn(`${p.title}: some media failed, kept the last good version`);
      continue;
    }
    rmSync(dir, { recursive: true, force: true });
    renameSync(tmp, dir);
    projects.push(p);
    console.log(`${p.title}: ${p.features.length} features, ${p.screenshots.length} screenshots${p.video ? ", video" : ""}${p.url ? ", live site" : ""}`);
  } catch (e) {
    if (previous) projects.push(previous);
    console.warn(`${typeof entry === "string" ? entry : entry.repo}: ${e.message}${previous ? " (kept the last good version)" : " (skipped)"}`);
  }
}
// clear out media for repos no longer listed, and any half-finished downloads
if (existsSync(MEDIA)) {
  const keep = new Set(listed.map(repoName));
  for (const d of readdirSync(MEDIA)) if (!keep.has(d)) rmSync(`${MEDIA}/${d}`, { recursive: true, force: true });
}
writeFileSync(OUT, JSON.stringify({ projects }, null, 2) + "\n");
console.log(`${projects.length} projects written to ${OUT}`);
