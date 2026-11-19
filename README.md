# Portfolio

A landing page with two doors:

- **Read the short version** opens `resume.html`, a plain page with your experience, projects, awards and recent reads.
- **Walk into the room** opens `room.html`, a round Viking-style great hall (timber walls, posts and a planked roof; set `HALL_STYLE` in `assets/rooms/core.js` to `"classic"` for the cream plaster rotunda instead) with three arched doorways. Each has a sign, a pair of doors that swing open as you walk up (the room behind is only drawn while they're open, which keeps the hall smooth) and a short arched hallway to a room with its own look:
  - **10 o'clock, About me:** a bright, modern living room with a Perth skyline window, large photo frames, and smaller frames for photos and info cards.
  - **12 o'clock, Work:** a bright, minimal home office lit by daylight: a strip of high windows full of sky, a window onto the Perth view from the About room (turned to Matagarup Bridge and Optus Stadium), one black desk with two monitors (resume and projects) over a laptop, a steel-framed shelving wall, your awards and the project board.
  - **2 o'clock, Hobbies:** a stone castle library with a stained glass window (a multicoloured lattice with a single sword), bookcases for the books you've read (with a shelf for what you're reading now, covers facing out) and want to read (the teal case), a game gallery (PlayStation and Steam shelves either side of a hallway, the Nintendo Switch shelf inside it, and across from it a shelf of other hobbies), and a suit of scale and chain armour in the corner.

## Make it yours

All content lives in three data files. Both the simple page and the room read from them.

- `data/profile.json`: name, headline, summary, links, experience, projects, awards, and the framed items in the About me room.
- `data/books.json`: the bookcase. Filled by the Goodreads sync, or edit by hand.
- `data/games.json`: the game cabinet. Filled by the games sync, or edit by hand.
- `data/board-games.json`: board games for the top of the other-hobbies shelf in the Hobbies room. You edit this one by hand: copy `_example` into `games` for each game (only `title` is needed; `size` is `large`, `medium` or `small`). Until it has any, plain books fill those shelves.

The shipped content is sample text. Replace it before you publish.

### About me frames

`about.frames` in `data/profile.json` holds up to 9 frames. Each is one of:

- `{ "type": "photo", "src": "assets/photos/family-1.jpg", "caption": "..." }`
- `{ "type": "info", "title": "...", "text": "..." }`

Put photo files in `assets/photos/`. Until a file exists, the frame shows a "Your photo goes here" placeholder. Use landscape photos for the best fit. Only publish photos you are happy for anyone to see, because everything on a public site is public.

### Large frames

`about.largeFrames` holds up to 3 big frames, each `{ "src": "assets/photos/large-1.jpg", "caption": "...", "text": "..." }`. Until the file exists the frame shows a placeholder that names the file to add. The small frames hold up to 6.

### Awards

`accolades` holds up to 12 items. Each has a `title`, `from`, `year`, `kind` (`award`, `certificate`, `degree` or `press`) and a `summary`. They hang on the wall of the Work room.

## Bookshelf from Goodreads

Goodreads retired its shelf RSS feeds in October 2026, so the sync reads the public shelf widget instead. The widget only returns the 100 most recent books per shelf and no "date read", so your older history comes from a one-time export.

1. Your user ID is the digits after `/user/show/` in your Goodreads profile address. Your profile must be public.
2. Once: in Goodreads, go to My Books, Import and export, and export your library. Then run `node scripts/import-goodreads-export.mjs path/to/goodreads_library_export.csv`. This writes `data/books-archive.json` with only the read shelf's titles, authors, ratings and dates. Don't commit the CSV, because it holds your reviews and private notes (`.gitignore` skips it).
3. Run `GOODREADS_USER_ID=12345678 node scripts/sync-goodreads.mjs` (Node 18 or newer).

The read shelf merges the archive, books found by earlier syncs and the widget, matched by Goodreads book id so nothing appears twice. A book stays once it has been seen, even after it drops out of the widget's 100; to remove one, delete it from `data/books.json` and `data/books-archive.json`. Books read since the export show no "Finished" date. Currently reading and want to read come from the widget alone (up to 100 each). Books you're reading now get their cover saved in `assets/books/covers/`, so they can face out on their shelf. Each spine is coloured by genre, from the book's subjects on Open Library (looked up once per book and kept in `data/genres.json`). To set a genre yourself, or fill in one Open Library doesn't know, edit `data/genre-overrides.json`: it lists the books without a genre and the genre names to choose from. Comedy is only picked automatically when no other genre fits, because so many books are tagged as humour. Other fiction and Other nonfiction catch everything else. Series stay together on the shelf, in series order. Plain filler books fill the rest of each case.

## Games from Steam and PlayStation

Run `node scripts/sync-games.mjs` after setting the variables below. Each platform is optional. If one fails, its games from the last good run are kept. Cover art is downloaded into `assets/covers/` at full size, and a 200x300 copy for the room goes in `assets/covers/small/` (`node scripts/thumbs.mjs --force` remakes them after changing the size). Run `npm install` first. The sync saves every game played for 5 hours or more (`MIN_HOURS` changes that), most recently played first, but the room only shows games played for 30 hours or more. To show more, lower `SHOW_MIN_HOURS` in `assets/rooms/hobbies.js`; the saved games come back without another sync. Each platform has a console shelf: PlayStation to the right of the game gallery's opening, Steam to the left, and the Switch along the gallery's left-hand wall. The 4 games beside the console are the ones with the highest trophy completion (on Steam, the most hours), and 40 more sit around it. Any extra games carry on down the gallery, which grows to fit. While `SWITCH_UNDER_CONSTRUCTION` in `assets/rooms/hobbies.js` is true, the Switch shelf has an "Under construction" sign. Set `MAX_GAMES` to cap each platform. PlayStation play time covers PS4 and PS5 games; older games that only appear in your trophy list have no play time, so they are left out.

**Steam** (reliable, official)

1. Get a free key at https://steamcommunity.com/dev/apikey and set `STEAM_API_KEY`.
2. Set `STEAM_ID` to your 17-digit Steam ID.
3. In Steam, set your profile's "Game details" to Public. Without this Steam returns nothing.

You get total hours, hours in the last two weeks and last played date.

**PlayStation** (unofficial, may break)

Sony has no public API. This uses the community `psn-api` library, so run `npm install` first.

1. Sign in at playstation.com, then open https://ca.account.sony.com/api/v1/ssocookie in the same browser.
2. Copy the 64-character `npsso` value and set `PSN_NPSSO`. It works like a password, so never put it in a file you publish.
3. The token expires after a while, so replace it when the sync starts failing.

PlayStation does not share play time this way, so PS games show last played and trophy progress instead of hours.

**Nintendo Switch** (manual)

Nintendo has no API, so Switch games go in `data/switch-games.json`, a file only you edit. The daily sync never writes to it, so your edits can't clash with its commits. Copy the `_example` entry into `games` for each game:

    { "id": "zelda-totk", "title": "The Legend of Zelda: Tears of the Kingdom", "hours": 120, "lastPlayed": "2026-09-14", "cover": "assets/covers/switch-zelda-totk.jpg", "completion": 75 }

Hours are on the Switch: open your user page from the Home screen, then Play Activity. Save each cover in `assets/covers/`; the sync makes its small copy (or run `node scripts/thumbs.mjs`). `cover` is optional: without it the game shows a plain red box with its title. `completion` (0 to 100) is optional too and picks the 4 games beside the console; otherwise the shelf is newest `lastPlayed` first.

## Keep it fresh automatically

Push this folder to GitHub. Under Settings, Secrets and variables, Actions, add whichever of these you use: `GOODREADS_USER_ID`, `STEAM_API_KEY`, `STEAM_ID`, `PSN_NPSSO`. The workflow in `.github/workflows/sync-data.yml` then refreshes books and games every day and commits the result. You can also run it by hand from the Actions tab.

## Work in GitHub Codespaces

The `.devcontainer/` folder sets this up for you. Create a Codespace from the repository and it will:

1. run `scripts/setup.sh`, which installs dependencies and downloads `assets/vendor/three.module.js` if it is missing;
2. start a live-reload server on port 8000 and open the preview. Edits show up in the browser as you save.

If the preview doesn't open, use the Ports tab and open port 8000. On an iPad this runs entirely in the browser, so there is nothing to install. To restart the server by hand: `npx live-server --port=8000 --no-browser .`

## Run it locally

The room loads data files, so serve the folder rather than double-clicking the file:

    npx http-server -p 8000 -c-1

then visit http://localhost:8000. This needs Node 18 or newer. The first run asks to download `http-server`; `-c-1` turns off caching so edits show on refresh.

## Publish it

It is a static site with no build step. Upload the folder to GitHub Pages, Netlify, Cloudflare Pages or Vercel. three.js is included in `assets/vendor`.

## Controls in the room

- Desktop: W A S D or the arrow keys to walk, mouse to look, click or press E to inspect, Esc to close a card or open the options menu.
- Touch: drag on the left to walk, drag on the right to look, tap things to inspect. The "Options and map" button at the top opens the menu.
- The options menu has a floor-plan map (choose a room to jump to its doorway), "Read the simple version" and "Leave the room".
- The exit door is behind you when you arrive.

## Contact form (the carrier pigeon)

The carrier pigeon on its perch in the hall opens a contact form. A static site can't send email by itself, so set `contact` in `data/profile.json` one of two ways:

- **Form service (recommended):** create a free form at a service such as [Formspree](https://formspree.io), then put its address in `contact.endpoint`, e.g. `"https://formspree.io/f/abcdwxyz"`. Messages arrive in your inbox and visitors stay on the page.
- **Email app:** leave `endpoint` empty and set `contact.email`. Sending opens the visitor's own email app with the message filled in. Without `contact.email`, the `mailto:` link in `links` is used.

With the email-app option your address is in the site's public files. With a form service only the form's address is public.

## How the room is built

There are no 3D model files. Everything is built from simple shapes, lighting and textures drawn on canvases at load time, and text comes from the data files.

- `assets/room.js`: entry point (input, picking, render loop).
- `assets/rooms/core.js`: renderer, helpers, doorway and sign builder, shared props.
- `assets/rooms/shared.js`: textures and picture frames used by several rooms.
- `assets/rooms/hub.js`: the round hall, its dome and the carrier pigeon.
- `assets/rooms/hall-viking.js`: the Viking look for the hall (floor, walls, roof, posts, shields, hearth).
- `assets/rooms/hobby-props.js`: the other-hobbies shelf and the suit of armour.
- `assets/rooms/map.js`: the floor-plan map in the options menu.
- `assets/rooms/contact.js`: the contact form behind the pigeon.
- `assets/rooms/about.js`, `work.js`, `hobbies.js`: one file per room. Colours, light levels, furniture and layout live there.
- `assets/world/`: unused leftovers, safe to delete.
