#!/usr/bin/env node
/**
 * Turns your public Goodreads shelf into data/books.json.
 *
 * Goodreads closed its developer API in 2020, so this reads the RSS feed that
 * every shelf still publishes. It runs on your machine or in the GitHub Action
 * (never in the visitor's browser), which avoids cross-origin blocks and keeps
 * any feed key out of the page.
 *
 * Usage:
 *   GOODREADS_USER_ID=12345678 node scripts/sync-goodreads.mjs
 *
 * Environment:
 *   GOODREADS_USER_ID   required. The digits after /user/show/ in your profile address.
 *   GOODREADS_RSS_KEY   optional. Only needed if your profile is private.
 *   GOODREADS_SHELF     optional. Defaults to "read".
 *   GOODREADS_CURRENT_SHELF optional. Defaults to "currently-reading".
 *   GOODREADS_WANT_SHELF    optional. Defaults to "to-read" (the "Want to Read" shelf).
 *   MAX_PAGES           optional. Defaults to 10.
 *
 * Goodreads limits how much a feed returns (around 100 recent books per shelf),
 * so a very long reading history may be cut short.
 */
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

function decode(s) {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  if (!m) return "";
  let v = m[1].trim();
  const cdata = v.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  v = cdata ? cdata[1].trim() : decode(v);
  return v;
}

function toISODate(s) {
  if (!s) return "";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/** Parse one page of Goodreads RSS into book records. */
export function parseFeed(xml) {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  return items.map((block) => {
    const id = tag(block, "book_id");
    const rating = parseInt(tag(block, "user_rating"), 10) || 0;
    return {
      id,
      title: tag(block, "title"),
      author: tag(block, "author_name"),
      rating,
      dateRead: toISODate(tag(block, "user_read_at")) || toISODate(tag(block, "user_date_added")),
      link: id ? `https://www.goodreads.com/book/show/${id}` : "",
    };
  });
}

/** Read every page of one shelf. Returns null if Goodreads refuses the first page. */
async function fetchShelf(userId, shelf, key, maxPages, sort) {
  const seen = new Map();
  for (let page = 1; page <= maxPages; page++) {
    const url = new URL(`https://www.goodreads.com/review/list_rss/${userId}`);
    url.searchParams.set("shelf", shelf);
    url.searchParams.set("sort", sort);
    url.searchParams.set("order", "d");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    if (key) url.searchParams.set("key", key);

    const res = await fetch(url, { headers: { "User-Agent": "portfolio-sync/1.0" } });
    if (!res.ok) {
      console.error(`Goodreads answered ${res.status} for the "${shelf}" shelf, page ${page}.`);
      if (page === 1) return null;
      break;
    }
    const books = parseFeed(await res.text());
    const before = seen.size;
    for (const b of books) if (b.id && !seen.has(b.id)) seen.set(b.id, b);
    if (books.length === 0 || seen.size === before) break;   // no new books: we have reached the end
  }
  return [...seen.values()];
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
  const key = process.env.GOODREADS_RSS_KEY || "";
  const maxPages = parseInt(process.env.MAX_PAGES || "10", 10);

  const read = await fetchShelf(userId, shelf, key, maxPages, "date_read");
  if (!read) process.exit(1);
  const books = read
    .sort((a, b) => (b.dateRead || "").localeCompare(a.dateRead || ""))
    .map(({ id, ...rest }) => rest);

  if (books.length === 0) {
    console.error("The feed returned no books. Check the user ID, and that the shelf is public or the key is set. Leaving data/books.json unchanged.");
    process.exit(1);
  }

  // currently reading and want to read are optional: if either fails, its shelf in the room is just empty
  const current = (await fetchShelf(userId, currentShelf, key, 1, "date_added")) || [];
  const currentlyReading = current.map(({ id, dateRead, rating, ...rest }) => rest);
  const wanted = (await fetchShelf(userId, wantShelf, key, maxPages, "date_added")) || [];
  const wantToRead = wanted.map(({ id, dateRead, rating, ...rest }) => rest);

  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "books.json");
  await writeFile(out, JSON.stringify({ source: "goodreads", updated: new Date().toISOString().slice(0, 10), currentlyReading, wantToRead, books }, null, 2) + "\n");
  console.log(`Wrote ${books.length} read, ${currentlyReading.length} currently reading and ${wantToRead.length} want to read to data/books.json`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
