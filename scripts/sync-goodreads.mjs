#!/usr/bin/env node
/**
 * Turns your Goodreads shelves into data/books.json.
 *
 * Goodreads retired its shelf RSS feeds in October 2026, so this reads the public
 * "custom widget" every shelf can embed. It runs on your machine or in the GitHub
 * Action, never in the visitor's browser.
 *
 * The widget returns at most 100 books per shelf and no dates, so the shelves are built
 * from three sources, matched on Goodreads book id (or title and author when a book has
 * no id) so nothing appears twice:
 *   1. data/books-archive.json   your full history, made once from a Goodreads export
 *                                by scripts/import-goodreads-export.mjs
 *   2. data/books.json           what earlier syncs found, so a read book stays once seen
 *   3. the widget                your 100 most recent books on each shelf
 * Read: all three. Want to read: the widget, then the archive's older picks, minus
 * anything you have read or are reading. Currently reading: the widget alone.
 *
 * Each book also gets a genre group for its spine colour, from its subjects on Open Library
 * (openlibrary.org, a free public catalogue). Those are looked up once per book and kept in
 * data/genres.json. Set any book's genre by hand in data/genre-overrides.json.
 *
 * Usage:
 *   GOODREADS_USER_ID=12345678 node scripts/sync-goodreads.mjs
 *
 * Environment:
 *   GOODREADS_USER_ID        required. The digits after /user/show/ in your profile address.
 *   GOODREADS_SHELF          optional. Defaults to "read".
 *   GOODREADS_CURRENT_SHELF  optional. Defaults to "currently-reading".
 *   GOODREADS_WANT_SHELF     optional. Defaults to "to-read" (the "Want to Read" shelf).
 *   MAX_GENRE_LOOKUPS        optional. Genre lookups per run. Defaults to 800.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
const UA = "Mozilla/5.0 (compatible; portfolio-sync/2.0)";
const RATINGS = { "did not like it": 1, "it was ok": 2, "liked it": 3, "really liked it": 4, "it was amazing": 5 };

export function decode(s) {
  return String(s || "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .trim();
}

/** "Title (Series, #2)" -> { title: "Title", series: "Series", seriesNo: 2 }. */
export function parseTitle(t) {
  const s = String(t || "").trim();
  const m = s.match(/\s*\(([^()]*?)[,;]?\s*#\s*([\d.]+)(?:\s*-\s*[\d.]+)?\)\s*$/);
  if (!m || !m[1].trim()) return { title: s };
  return { title: s.slice(0, m.index).trim(), series: m[1].trim(), seriesNo: Number(m[2]) };
}
export const shortTitle = (t) => parseTitle(t).title;

/** Fallback match key for books without a Goodreads id: normalised title + author. */
export function titleAuthorKey(b) {
  const norm = (x) => String(x || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "");
  return `${norm(shortTitle(b.title))}|${norm(b.author)}`;
}

/** Finds books by id, or by title + author. */
class BookIndex {
  constructor(books = []) { this.byId = new Map(); this.byTA = new Map(); books.forEach((b) => this.add(b)); }
  add(b) { if (b.id) this.byId.set(b.id, b); this.byTA.set(titleAuthorKey(b), b); }
  get(b) { return (b.id && this.byId.get(b.id)) || this.byTA.get(titleAuthorKey(b)); }
}

/** Parse the widget's JavaScript response into book records, in the widget's order. */
export function parseWidget(js) {
  const html = js.replace(/\\"/g, '"').replace(/\\\//g, "/").replace(/\\n/g, "\n");
  const blocks = html.split(/<div class="gr_custom_each_container[^"]*">/).slice(1);
  return blocks.map((block) => {
    const full = block.match(/<div class="gr_custom_book_container[^"]*">\s*<a title="([^"]*)"/);
    const title = block.match(/<div class="gr_custom_title[^"]*">\s*<a[^>]*>([\s\S]*?)<\/a>/);
    const author = block.match(/<div class="gr_custom_author[^"]*">\s*by\s*<a[^>]*>([\s\S]*?)<\/a>/);
    const img = block.match(/<img[^>]*src="[^"]*\/books\/\d+[a-z]\/(\d+)\./);
    const stars = block.match(/staticStars[^"]*"\s+title="([^"]+)"/);   // only present when you rated it
    const id = img ? img[1] : "";
    const t = parseTitle(decode(full ? full[1] : title ? title[1] : ""));
    return {
      id,
      ...t,
      author: decode(author ? author[1] : ""),
      rating: stars ? RATINGS[stars[1].toLowerCase()] || 0 : 0,
      link: id ? `https://www.goodreads.com/book/show/${id}` : "",
    };
  }).filter((b) => b.title);
}

/** One shelf from the widget. Returns null if Goodreads refuses it. */
async function fetchShelf(userId, shelf, sort) {
  const url = new URL(`https://www.goodreads.com/review/custom_widget/${userId}`);
  url.searchParams.set("shelf", shelf);
  url.searchParams.set("sort", sort);
  url.searchParams.set("order", "d");
  url.searchParams.set("num_books", "100");
  // Goodreads caches the widget per user and widget_id, so each shelf needs its own id
  url.searchParams.set("widget_id", `portfolio-${shelf}-${sort}`);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) {
    console.error(`Goodreads answered ${res.status} for the "${shelf}" shelf widget.`);
    return null;
  }
  return parseWidget(await res.text());
}

/* ---------- genres ---------- */

/**
 * Genre tags -> one shelf colour group. Each tag counts for the first rule it matches, so
 * "Science fiction" counts for Science fiction, not Science & nature.
 */
const GENRE_RULES = [
  ["Fantasy", /fantasy|dragons|magic|grimdark|sword and sorcery|fae|witches/],
  ["Science fiction", /science fiction|sci-fi|dystopia|space opera|cyberpunk|apocalyptic|time travel|aliens|robots|military science/],
  ["Horror", /horror|vampires|zombies|ghost|gothic/],
  ["Mystery & thriller", /mystery|thriller|crime|suspense|detective|noir|espionage/],
  ["Historical fiction", /historical fiction|fiction, historical/],
  ["Classics & literature", /classics|literary fiction|literature|poetry|plays|drama|mythology|short stories|sagas/],
  ["History", /history|military|war/],
  ["Philosophy & religion", /philosophy|religion|christian|spirituality|theology|buddhism|stoicism|faith/],
  ["Society & politics", /politic|social science|sociology|economics|social|anthropology|feminism|race|journalism|true crime|law/],
  ["Science & nature", /science|physics|biology|nature|astronomy|mathematics|medical|medicine|technology|computer|programming|software|environment|evolution|neuroscience|space/],
  ["Biography & memoir", /biography|memoir|autobiography/],
  ["Comics & graphic novels", /comic|graphic novel|manga/],
  ["Self-help & family", /self help|self-help|self-realization|self-actualization|success|motivation|parenting|child rearing|personal development|productivity|business|psychology|leadership|health|relationships|education|how to/],
];
/** Every group name, catch-alls last: the names data/genre-overrides.json may use. */
export const GENRES = [...GENRE_RULES.map(([name]) => name), "Comedy", "Other fiction", "Other nonfiction"];
/** Lots of books carry a humour tag, so Comedy is only used when nothing else matches. */
const COMEDY = /humou?r|comedy|comedians|comic fiction|satire/i;
const GENERIC = /^(fiction|nonfiction|audiobook|adult|novels|book club|adult fiction|young adult|middle grade|childrens|contemporary|adventure|romance|lgbt|unfinished)$/i;
const bucketOf = (tag) => {
  const name = tag.toLowerCase();
  if (GENERIC.test(name) || /^nyt:|bestseller|large type|accessible book|protected daisy|in library/.test(name)) return null;
  for (const [bucket, re] of GENRE_RULES) if (re.test(name)) return bucket;
  return null;
};

/**
 * A cache entry -> genre group.
 *   an array: Goodreads genres in vote order (from earlier runs), so the first match wins
 *   { ol: [...] }: Open Library subjects, in no particular order, so the most-matched group wins
 *                  (ties go to the earlier rule)
 */
export function genreOf(entry) {
  if (Array.isArray(entry)) {
    for (const g of entry) { const b = bucketOf(g); if (b) return b; }
    const all = entry.join(" ").toLowerCase();
    if (COMEDY.test(all)) return "Comedy";
    return /nonfiction/.test(all) ? "Other nonfiction" : all ? "Other fiction" : "";
  }
  const subjects = (entry && entry.ol) || [];
  const score = new Map();
  for (const s of subjects) { const b = bucketOf(s); if (b) score.set(b, (score.get(b) || 0) + 1); }
  let best = "", top = 0;
  for (const [bucket] of GENRE_RULES) if ((score.get(bucket) || 0) > top) { best = bucket; top = score.get(bucket); }
  if (best) return best;
  if (subjects.some((s) => /^fiction/i.test(s))) return "Other fiction";
  if (subjects.some((s) => COMEDY.test(s))) return "Comedy";
  return subjects.some((s) => /^non-?fiction/i.test(s)) ? "Other nonfiction" : "";
}

/**
 * Open Library subjects for a book, by title and author, gathered from the top few matches
 * (the first is often a bare edition with none). If that finds nothing it tries again with
 * just the author's surname. Returns [] when Open Library has no match, or null when the
 * lookup failed (so it is tried again next run).
 */
async function fetchSubjects(book) {
  const ask = async (author) => {
    const url = new URL("https://openlibrary.org/search.json");
    url.searchParams.set("title", book.title.split(":")[0]);
    if (author) url.searchParams.set("author", author);
    url.searchParams.set("fields", "subject");
    url.searchParams.set("limit", "5");
    const res = await fetch(url, { headers: { "User-Agent": "portfolio-sync/2.0 (personal site book shelf)" } });
    if (!res.ok) return null;
    const docs = (await res.json()).docs || [];
    return [...new Set(docs.flatMap((d) => d.subject || []))].slice(0, 60);
  };
  const first = await ask(book.author);
  if (!first || first.length || !book.author) return first;
  const surname = book.author.trim().split(/\s+/).pop();
  return surname === book.author.trim() ? first : ask(surname);
}

const RETRY_DAYS = 30;   // books Open Library didn't know are asked about again after this long

/**
 * Look up genres for books not yet in data/genres.json. Goodreads blocks automated page
 * loads, so lookups go to Open Library's public API; the Goodreads genres saved by earlier
 * runs are kept. Returns the cache.
 */
async function updateGenres(books, max, today) {
  const cache = (await readJson("genres.json")) || {};
  for (const [id, v] of Object.entries(cache)) if (Array.isArray(v) && v.length === 0) delete cache[id];   // old failed lookups
  const stale = (v) => !v || (!Array.isArray(v) && v.ol.length === 0 &&
    (Date.parse(today) - Date.parse(v.checked || "1970-01-01")) / 864e5 > RETRY_DAYS);
  const byId = new Map(books.filter((b) => b.id && b.title).map((b) => [b.id, b]));
  const todo = [...byId.values()].filter((b) => stale(cache[b.id])).slice(0, max);
  const save = () => writeFile(path.join(DATA, "genres.json"), JSON.stringify(cache, null, 1) + "\n");
  let failures = 0;
  for (const [n, b] of todo.entries()) {
    let subjects = null;
    try { subjects = await fetchSubjects(b); } catch { /* counted below */ }
    if (subjects) { cache[b.id] = { ol: subjects, ...(subjects.length ? {} : { checked: today }) }; failures = 0; }
    else if (++failures >= 5) { console.error("  genres: Open Library isn't answering; the rest wait for the next run."); break; }
    if (n % 25 === 24) { console.log(`  genres: ${n + 1} of ${todo.length}`); await save(); }
    await new Promise((r) => setTimeout(r, 1000));   // about one request a second
  }
  await save();
  return cache;
}

/* ---------- merging ---------- */

async function readJson(file) {
  try { return JSON.parse(await readFile(path.join(DATA, file), "utf8")); } catch { return null; }
}

/**
 * Merge the read shelf: archive, then earlier syncs, then the widget. A match fills gaps
 * instead of adding a duplicate; the widget's rating wins because it is the freshest. A book
 * first found in the widget gets `seen` (today) so it sorts with the newest without
 * claiming a "Finished" date it doesn't have.
 */
export function mergeRead(archive, previous, widget, today) {
  const list = [];
  const idx = new BookIndex();
  const add = (b, fresh) => {
    const old = idx.get(b);
    if (!old) {
      const n = { ...b };
      if (fresh) n.seen = today;
      list.push(n);
      idx.add(n);
      return;
    }
    for (const k of ["id", "link", "dateRead", "seen", "series", "seriesNo"]) if (!old[k] && b[k]) old[k] = b[k];
    if (b.rating && (fresh || !old.rating)) old.rating = b.rating;
    idx.add(old);
  };
  for (const b of archive) add(b, false);
  for (const b of previous) add(b, false);
  for (const b of widget) add(b, true);

  const sortKey = (b) => b.dateRead || b.seen || "";
  return list
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)))
    .map((b) => ({
      id: b.id || "", title: b.title, author: b.author,
      ...(b.series ? { series: b.series, seriesNo: b.seriesNo } : {}),
      rating: b.rating || 0, dateRead: b.dateRead || "",
      ...(!b.dateRead && b.seen ? { seen: b.seen } : {}), link: b.link || "",
    }));
}

/**
 * Want to read: the widget (your newest 100, newest first), then older picks from the export,
 * minus anything on the read or currently-reading shelves, with no repeats.
 */
export function mergeWant(widget, archiveWant, read, current) {
  const taken = new BookIndex([...read, ...current]);
  const out = new BookIndex();
  const list = [];
  for (const b of [...widget, ...archiveWant]) {
    if (taken.get(b) || out.get(b)) continue;
    const { rating, dateAdded, ...rest } = b;
    list.push(rest);
    out.add(rest);
  }
  return list;
}

async function main() {
  const userId = process.env.GOODREADS_USER_ID;
  if (!userId) {
    console.error("Set GOODREADS_USER_ID to the digits in your Goodreads profile address.");
    process.exit(1);
  }
  const shelf = process.env.GOODREADS_SHELF || "read";
  const currentShelf = process.env.GOODREADS_CURRENT_SHELF || "currently-reading";
  const wantShelf = process.env.GOODREADS_WANT_SHELF || "to-read";
  const maxLookups = parseInt(process.env.MAX_GENRE_LOOKUPS || "800", 10);
  const today = new Date().toISOString().slice(0, 10);

  const widgetRead = await fetchShelf(userId, shelf, "date_read");
  if (!widgetRead || widgetRead.length === 0) {
    console.error("The read shelf widget returned no books. Check the user ID and that your shelves are public. Leaving data/books.json unchanged.");
    process.exit(1);
  }

  const archiveFile = (await readJson("books-archive.json")) || {};
  const prevFile = await readJson("books.json");
  const previous = prevFile?.source === "goodreads" ? prevFile.books || [] : [];
  const books = mergeRead(archiveFile.books || [], previous, widgetRead, today);

  const current = ((await fetchShelf(userId, currentShelf, "date_added")) || []).map(({ rating, ...rest }) => rest);
  const widgetWant = await fetchShelf(userId, wantShelf, "date_added");
  // if the want widget fails, keep the export's list rather than emptying the case
  const wantToRead = mergeWant(widgetWant || [], archiveFile.wantToRead || [], books, current);

  const all = [...books, ...current, ...wantToRead];
  const genres = await updateGenres(all, maxLookups, today);
  // genres you set by hand in data/genre-overrides.json win over the lookup
  const valid = new Set(GENRES);
  const overrides = ((await readJson("genre-overrides.json")) || {}).books || {};
  for (const [id, o] of Object.entries(overrides)) {
    if (o.genre && !valid.has(o.genre)) console.error(`  genre-overrides.json: "${o.genre}" for ${o.title || id} isn't one of _genres, so it's ignored.`);
  }
  for (const b of all) {
    const mine = overrides[b.id] && valid.has(overrides[b.id].genre) ? overrides[b.id].genre : "";
    const g = mine || genreOf(genres[b.id]);
    if (g) b.genre = g;
  }

  await writeFile(path.join(DATA, "books.json"),
    JSON.stringify({ source: "goodreads", updated: today, currentlyReading: current, wantToRead, books }, null, 2) + "\n");
  console.log(`Wrote ${books.length} read, ${current.length} currently reading and ${wantToRead.length} want to read to data/books.json`);
  console.log(`  ${all.filter((b) => b.genre).length} of ${all.length} have a genre`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
