#!/usr/bin/env node
/**
 * Builds data/games.json from your Steam and PlayStation accounts, and saves
 * cover art into assets/covers/ so the room can show it.
 *
 * It runs on your machine or in the GitHub Action, never in a visitor's browser,
 * so your keys stay private. Each platform is optional and independent: if one
 * fails, its games from the last good run are kept.
 *
 * STEAM
 *   STEAM_API_KEY   free key from https://steamcommunity.com/dev/apikey
 *   STEAM_ID        your 17-digit Steam ID (steamcommunity.com/my shows it, or use a lookup site)
 *   Your Steam profile's "Game details" must be set to Public.
 *
 * PLAYSTATION (unofficial, uses the community psn-api library)
 *   PSN_NPSSO       64-character token. Sign in at playstation.com, then open
 *                   https://ca.account.sony.com/api/v1/ssocookie in the same browser.
 *                   Treat it like a password. It expires after a while, so you
 *                   will need to replace it every so often.
 *   Play time comes from your PlayStation play history (PS4 and PS5 games). Older
 *   games that only appear in your trophy list have no play time, so they are left
 *   out by the MIN_HOURS filter.
 *
 * Usage:  node scripts/sync-games.mjs
 * Optional: MIN_HOURS  only keep games played at least this long (default 5)
 *           MAX_GAMES  caps how many games each platform keeps (default: no cap;
 *                      the room grows its game gallery to fit)
 *
 * NINTENDO SWITCH has no API. Add Switch games by hand to data/games.json with
 * "platform": "switch" (see the README). The sync leaves them untouched.
 */
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";
import { addThumbs } from "./thumbs.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data", "games.json");
const COVERS = path.join(ROOT, "assets", "covers");

/* ---------- pure converters (tested without the network) ---------- */

const day = (d) => (Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10));

/** Steam GetOwnedGames response -> game records. Games never played are skipped. */
export function steamToGames(response) {
  const list = (response && response.response && response.response.games) || [];
  return list
    .filter((g) => (g.playtime_forever || 0) > 0)
    .map((g) => ({
      platform: "steam",
      id: String(g.appid),
      title: g.name || `App ${g.appid}`,
      hours: Math.round(((g.playtime_forever || 0) / 60) * 10) / 10,
      // recentHours: Math.round(((g.playtime_2weeks || 0) / 60) * 10) / 10,
      lastPlayed: g.rtime_last_played ? day(new Date(g.rtime_last_played * 1000)) : "",
      cover: "",
      coverUrls: [
        `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/library_600x900.jpg`,
        `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/library_600x900.jpg`,
        `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
      ],
    }));
}

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** "PT228H56M33S" or "P1DT2H" -> hours, to one decimal place. */
export function isoHours(d) {
  const m = String(d || "").match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?)?$/);
  if (!m) return 0;
  const h = (+m[1] || 0) * 24 + (+m[2] || 0) + (+m[3] || 0) / 60 + (+m[4] || 0) / 3600;
  return Math.round(h * 10) / 10;
}

/** PSN played games (with play time) + trophy titles -> game records. */
export function psnToGames(playedGames, trophyTitles) {
  const trophyByName = new Map();
  for (const t of trophyTitles || []) trophyByName.set(norm(t.trophyTitleName), t);
  const trophies = (t) => {
    if (!t) return undefined;
    const sum = (c) => (c ? c.bronze + c.silver + c.gold + c.platinum : 0);
    return { earned: sum(t.earnedTrophies), total: sum(t.definedTrophies), progress: t.progress };
  };

  const out = new Map();
  for (const g of playedGames || []) {
    const key = norm(g.name);
    const t = trophyByName.get(key);
    const prev = out.get(key);   // the same game on PS4 and PS5: add the play time together
    out.set(key, {
      platform: "psn",
      id: g.titleId || key,
      title: g.name,
      hours: Math.round(((prev ? prev.hours : 0) + isoHours(g.playDuration)) * 10) / 10,
      lastPlayed: [prev && prev.lastPlayed, g.lastPlayedDateTime ? day(new Date(g.lastPlayedDateTime)) : ""].filter(Boolean).sort().pop() || "",
      cover: "",
      coverUrls: g.imageUrl ? [g.imageUrl] : prev ? prev.coverUrls : [],
      ...(t ? { trophies: trophies(t) } : {}),
    });
  }
  // games that only appear in the trophy list (PS3, Vita): no play time
  for (const t of trophyTitles || []) {
    const key = norm(t.trophyTitleName);
    if (out.has(key)) continue;
    out.set(key, {
      platform: "psn",
      id: t.npCommunicationId || key,
      title: t.trophyTitleName,
      hours: 0,
      lastPlayed: t.lastUpdatedDateTime ? day(new Date(t.lastUpdatedDateTime)) : "",
      cover: "",
      coverUrls: t.trophyTitleIconUrl ? [t.trophyTitleIconUrl] : [],
      trophies: trophies(t),
    });
  }
  return [...out.values()];
}

/** Most recently played first, then most hours. */
export function sortGames(games) {
  return [...games].sort((a, b) => (b.lastPlayed || "").localeCompare(a.lastPlayed || "") || (b.hours || 0) - (a.hours || 0));
}

/** Replace one platform's games, keeping the other platform's as they were. */
export function mergePlatform(existing, platform, fresh) {
  return [...existing.filter((g) => g.platform !== platform), ...fresh];
}

/* ---------- network ---------- */

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function saveCover(game) {
  const urls = game.coverUrls || [];
  const file = `${game.platform}-${createHash("sha1").update(String(game.id)).digest("hex").slice(0, 10)}.jpg`;
  const rel = `assets/covers/${file}`;
  const abs = path.join(COVERS, file);
  if (await exists(abs)) return rel;
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "portfolio-sync/1.0" } });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 500) continue;
      await mkdir(COVERS, { recursive: true });
      await writeFile(abs, buf);
      return rel;
    } catch { /* try the next address */ }
  }
  return "";
}

async function fetchSteam(key, steamId) {
  const url = new URL("https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/");
  url.searchParams.set("key", key);
  url.searchParams.set("steamid", steamId);
  url.searchParams.set("include_appinfo", "1");
  url.searchParams.set("include_played_free_games", "1");
  url.searchParams.set("format", "json");
  const res = await fetch(url, { headers: { "User-Agent": "portfolio-sync/1.0" } });
  if (!res.ok) throw new Error(`Steam answered ${res.status}. Check STEAM_API_KEY and STEAM_ID.`);
  const json = await res.json();
  if (!json.response || !Array.isArray(json.response.games)) {
    throw new Error("Steam returned no games. Set your profile's Game details to Public, then try again.");
  }
  return steamToGames(json);
}

/** Your achievement progress in one Steam game, or undefined if it has none. */
async function fetchSteamAchievements(key, steamId, appid) {
  const url = new URL("https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/");
  url.searchParams.set("key", key);
  url.searchParams.set("steamid", steamId);
  url.searchParams.set("appid", appid);
  const res = await fetch(url, { headers: { "User-Agent": "portfolio-sync/1.0" } });
  if (!res.ok) return undefined;   // Steam answers 400 for games without achievements
  const list = ((await res.json()).playerstats || {}).achievements || [];
  if (!list.length) return undefined;
  const earned = list.filter((a) => a.achieved).length;
  return { earned, total: list.length, progress: Math.round((earned / list.length) * 100) };
}

/** Add achievement progress to Steam games, a few at a time. */
async function addSteamAchievements(games, key, steamId) {
  const queue = [...games];
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (let g; (g = queue.shift());) {
      try { const a = await fetchSteamAchievements(key, steamId, g.id); if (a) g.achievements = a; } catch { /* leave it out */ }
    }
  }));
}

async function fetchPsn(npsso) {
  let psn;
  try { psn = await import("psn-api"); }
  catch { throw new Error("The psn-api package is missing. Run: npm install"); }

  const accessCode = await psn.exchangeNpssoForAccessCode(npsso);
  const auth = await psn.exchangeAccessCodeForAuthTokens(accessCode);
  const authorization = { accessToken: auth.accessToken };

  // your whole play history, with play time (PS4 and PS5)
  const games = [];
  for (let offset = 0; offset < 2000; offset += 200) {
    const page = await psn.getUserPlayedGames(authorization, "me", { limit: 200, offset });
    games.push(...(page.titles || []));
    if (!page.nextOffset) break;
  }

  const titles = [];
  for (let offset = 0; offset < 800; offset += 100) {
    const page = await psn.getUserTitles(authorization, "me", { limit: 100, offset });
    titles.push(...(page.trophyTitles || []));
    if (!page.nextOffset) break;
  }
  return psnToGames(games, titles);
}

/* ---------- main ---------- */

async function main() {
  const steamKey = process.env.STEAM_API_KEY, steamId = process.env.STEAM_ID, npsso = process.env.PSN_NPSSO;
  const wantSteam = !!(steamKey && steamId), wantPsn = !!npsso;
  if (!wantSteam && !wantPsn) {
    console.error("Nothing to sync. Set STEAM_API_KEY and STEAM_ID, or PSN_NPSSO. See the notes at the top of this file.");
    process.exit(1);
  }
  const max = process.env.MAX_GAMES ? parseInt(process.env.MAX_GAMES, 10) : Infinity;
  const minHours = parseFloat(process.env.MIN_HOURS || "5");

  let current = { games: [] };
  try { current = JSON.parse(await readFile(DATA, "utf8")); } catch { /* first run */ }
  // sample data is replaced as soon as a real platform syncs
  let games = current.source === "sample" ? [] : current.games || [];
  const sources = new Set(current.source === "sample" ? [] : String(current.source || "").split("+").filter(Boolean));
  let ok = 0;

  for (const [want, platform, run] of [
    [wantSteam, "steam", () => fetchSteam(steamKey, steamId)],
    [wantPsn, "psn", () => fetchPsn(npsso)],
  ]) {
    if (!want) continue;
    try {
      const all = await run();
      const fresh = all.filter((g) => (g.hours || 0) >= minHours);
      if (platform === "steam") await addSteamAchievements(fresh, steamKey, steamId);
      games = mergePlatform(games, platform, fresh);
      sources.add(platform);
      ok++;
      console.log(`${platform}: ${fresh.length} of ${all.length} games played ${minHours}+ hours`);
    } catch (e) {
      console.error(`${platform}: sync failed, keeping the previous ${platform} games. ${e.message}`);
    }
  }
  if (ok === 0) { console.error("No platform synced. Leaving data/games.json unchanged."); process.exit(1); }

  // optional cap, per platform so one big library can't push the others out
  const seen = {};
  games = sortGames(games).filter((g) => (seen[g.platform] = (seen[g.platform] || 0) + 1) <= max);
  for (const g of games) {
    if (g.coverUrls && g.coverUrls.length) g.cover = await saveCover(g);
    delete g.coverUrls;
  }
  // 200x300 copies for the room; the full-size covers stay in assets/covers
  await addThumbs(games);
  await mkdir(path.dirname(DATA), { recursive: true });
  await writeFile(DATA, JSON.stringify({ source: [...sources].join("+"), updated: day(new Date()), games }, null, 2) + "\n");
  console.log(`Wrote ${games.length} games to data/games.json`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
