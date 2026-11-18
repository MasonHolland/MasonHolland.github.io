# Portfolio

A landing page with two doors:

- **Read the short version** opens `resume.html`, a plain page with your experience, projects, awards and recent reads.
- **Walk into the room** opens `room.html`, a round hall with three arched doors. Each door has a sign and leads to a room with its own look:
  - **10 o'clock, About me:** a bright, modern living room with a Perth skyline window, large photo frames, and smaller frames for photos and info cards.
  - **12 o'clock, Work:** a bright modern office with your awards, a resume monitor and a projects monitor.
  - **2 o'clock, Hobbies:** a stone castle library with a stained glass window (a multicoloured lattice with a single sword), bookcases for the books you've read (with a shelf for what you're reading now) and want to read, and three game shelves: PlayStation, Nintendo Switch and Steam, each with its console in the middle.

## Make it yours

All content lives in three data files. Both the simple page and the room read from them.

- `data/profile.json`: name, headline, summary, links, experience, projects, awards, and the framed items in the About me room.
- `data/books.json`: the bookcase. Filled by the Goodreads sync, or edit by hand.
- `data/games.json`: the game cabinet. Filled by the games sync, or edit by hand.

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

Goodreads closed its developer API in 2020, so this reads the RSS feed every shelf still publishes.

1. Your user ID is the digits after `/user/show/` in your Goodreads profile address.
2. Make your profile and "read" shelf public. For a private shelf, copy the RSS key from the bottom of the shelf page and set `GOODREADS_RSS_KEY`.
3. Run `GOODREADS_USER_ID=12345678 node scripts/sync-goodreads.mjs` (Node 18 or newer).

Goodreads returns roughly the 100 most recent books per shelf. Your own books appear in brighter colours among plain filler books, so the case always looks full.

## Games from Steam and PlayStation

Run `node scripts/sync-games.mjs` after setting the variables below. Each platform is optional. If one fails, its games from the last good run are kept. Cover art is downloaded into `assets/covers/`. Each platform's shelf holds up to 36 games, most recently played first (`MAX_GAMES` changes the limit). On each shelf the 4 newest sit beside the console.

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

Nintendo has no API, so add Switch games yourself to the `games` list in `data/games.json`. The sync never touches them:

    { "platform": "switch", "id": "zelda-totk", "title": "The Legend of Zelda: Tears of the Kingdom", "hours": 120, "lastPlayed": "2026-09-14", "cover": "assets/covers/zelda.jpg" }

`cover` is optional. Without it the game shows a plain red box with its title.

## Keep it fresh automatically

Push this folder to GitHub. Under Settings, Secrets and variables, Actions, add whichever of these you use: `GOODREADS_USER_ID`, `GOODREADS_RSS_KEY`, `STEAM_API_KEY`, `STEAM_ID`, `PSN_NPSSO`. The workflow in `.github/workflows/sync-data.yml` then refreshes books and games every day and commits the result. You can also run it by hand from the Actions tab.

## Work in GitHub Codespaces

The `.devcontainer/` folder sets this up for you. Create a Codespace from the repository and it will:

1. run `scripts/setup.sh`, which installs dependencies and downloads `assets/vendor/three.module.js` if it is missing;
2. start a live-reload server on port 8000 and open the preview. Edits show up in the browser as you save.

If the preview doesn't open, use the Ports tab and open port 8000. On an iPad this runs entirely in the browser, so there is nothing to install. To restart the server by hand: `npx live-server --port=8000 --no-browser .`

## Run it locally

The room loads data files, so serve the folder rather than double-clicking the file:

    python3 -m http.server 8000

then visit http://localhost:8000.

## Publish it

It is a static site with no build step. Upload the folder to GitHub Pages, Netlify, Cloudflare Pages or Vercel. three.js is included in `assets/vendor`.

## Controls in the room

- Desktop: W A S D or the arrow keys to walk, mouse to look, click or press E to inspect, Esc to close a card or open the options menu.
- Touch: drag on the left to walk, drag on the right to look, tap things to inspect. The "Options and map" button at the top opens the menu.
- The options menu has a floor-plan map (choose a room to jump to its doorway), "Read the simple version" and "Leave the room".
- The exit door is behind you when you arrive.

## Contact form (the mailbox)

The mailbox in the hall opens a contact form. A static site can't send email by itself, so set `contact` in `data/profile.json` one of two ways:

- **Form service (recommended):** create a free form at a service such as [Formspree](https://formspree.io), then put its address in `contact.endpoint`, e.g. `"https://formspree.io/f/abcdwxyz"`. Messages arrive in your inbox and visitors stay on the page.
- **Email app:** leave `endpoint` empty and set `contact.email`. Sending opens the visitor's own email app with the message filled in. Without `contact.email`, the `mailto:` link in `links` is used.

With the email-app option your address is in the site's public files. With a form service only the form's address is public.

## How the room is built

There are no 3D model files. Everything is built from simple shapes, lighting and textures drawn on canvases at load time, and text comes from the data files.

- `assets/room.js`: entry point (input, picking, render loop).
- `assets/rooms/core.js`: renderer, helpers, doorway and sign builder, shared props.
- `assets/rooms/shared.js`: textures and picture frames used by several rooms.
- `assets/rooms/hub.js`: the round hall, its dome and the mailbox.
- `assets/rooms/map.js`: the floor-plan map in the options menu.
- `assets/rooms/contact.js`: the contact form behind the mailbox.
- `assets/rooms/about.js`, `work.js`, `hobbies.js`: one file per room. Colours, light levels, furniture and layout live there.
- `assets/world/`: unused leftovers, safe to delete.
