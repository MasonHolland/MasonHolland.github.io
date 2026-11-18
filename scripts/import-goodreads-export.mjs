#!/usr/bin/env node
/**
 * Turns a Goodreads export (My Books -> Import and export -> Export library) into
 * data/books-archive.json, the full history that sync-goodreads.mjs merges with the
 * widget's 100 most recent books per shelf.
 *
 * Only the "read" and "to-read" shelves are kept, and only title, series, author, your
 * rating, dates and a link. Reviews, private notes and the rest of the export stay on
 * your machine; don't commit the CSV itself.
 *
 * Usage:
 *   node scripts/import-goodreads-export.mjs path/to/goodreads_library_export.csv
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseTitle } from "./sync-goodreads.mjs";

/** RFC 4180 CSV: quoted fields may hold commas, newlines and doubled quotes. */
export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim()));
}

/** Goodreads writes dates as 2024/03/15. */
function isoDate(s) {
  const m = String(s || "").match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  return m ? `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}` : "";
}

export function exportToArchive(csvText) {
  const [header, ...rows] = parseCsv(csvText.replace(/^﻿/, ""));
  const col = (name) => header.findIndex((h) => h.trim().toLowerCase() === name);
  const c = { id: col("book id"), title: col("title"), author: col("author"), rating: col("my rating"),
    read: col("date read"), added: col("date added"), shelf: col("exclusive shelf") };
  const missing = Object.entries(c).filter(([, i]) => i < 0).map(([k]) => k);
  if (missing.length) throw new Error(`This doesn't look like a Goodreads export: no ${missing.join(", ")} column.`);

  const book = (r) => {
    const id = (r[c.id] || "").trim();
    return { id, ...parseTitle(r[c.title]), author: (r[c.author] || "").trim(),
      link: id ? `https://www.goodreads.com/book/show/${id}` : "" };
  };
  const shelf = (name) => rows.filter((r) => (r[c.shelf] || "").trim() === name);
  const newest = (key) => (a, b) => key(b).localeCompare(key(a));

  const books = shelf("read")
    .map((r) => ({
      ...book(r),
      rating: parseInt(r[c.rating], 10) || 0,
      dateRead: isoDate(r[c.read]),
      // no date read: sort by when it was added, but don't show that as a "Finished" date
      ...(isoDate(r[c.read]) ? {} : { seen: isoDate(r[c.added]) }),
    }))
    .sort(newest((b) => b.dateRead || b.seen || ""));
  const wantToRead = shelf("to-read")
    .map((r) => ({ ...book(r), dateAdded: isoDate(r[c.added]) }))
    .sort(newest((b) => b.dateAdded));
  return { books, wantToRead };
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/import-goodreads-export.mjs path/to/goodreads_library_export.csv");
    process.exit(1);
  }
  const { books, wantToRead } = exportToArchive(await readFile(file, "utf8"));
  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "books-archive.json");
  await writeFile(out, JSON.stringify({ source: "goodreads-export", exported: new Date().toISOString().slice(0, 10), books, wantToRead }, null, 2) + "\n");
  console.log(`Wrote ${books.length} read and ${wantToRead.length} want to read to data/books-archive.json`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
