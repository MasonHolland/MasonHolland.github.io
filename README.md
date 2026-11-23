# masonholland.github.io

My personal site: **https://masonholland.github.io/**

There are two ways to look around:

- **The short version:** plain pages for my [resume](https://masonholland.github.io/resume.html), [projects](https://masonholland.github.io/projects.html), a bit [about me](https://masonholland.github.io/about.html), and a [contact form](https://masonholland.github.io/contact.html).
- **[Walk into the room](https://masonholland.github.io/room.html):** a 3D space you explore in the browser. A timber great hall has three doors, each opening onto a room:
  - **About me:** a Scandinavian-style living room with a Perth skyline window, photos, and a world map pinned with the places my family has lived and travelled.
  - **Work:** a bright home office. A project board drives a big screen that shows each project's blurb, screenshots and demo video. There's also a career timeline (with a switch to my career before tech), a shelf with one skill per cubby, and my resume and certificate on the walls.
  - **Hobbies:** a stone library. It has every book I've read, coloured by genre, a gallery of the games I've played most on PlayStation, Steam and Switch, a shelf of other hobbies, and a suit of armour.

  A carrier pigeon in the hall takes messages. To start inside a room, add its name to the link: [#about](https://masonholland.github.io/room.html#about), [#work](https://masonholland.github.io/room.html#work), [#hobbies](https://masonholland.github.io/room.html#hobbies).

## How it's built

There's no framework and no build step. It's plain HTML, CSS and JavaScript served as static files by GitHub Pages, with [three.js](https://threejs.org/) for the 3D.

**Everything in the room is made in code.** There are no 3D model files or texture images for the furniture, walls or props. Every object is assembled from simple shapes (boxes, cylinders, lathes, extrusions), and every surface (wood grain, stone, brick, carpet, book spines, signs, screens) is painted on a canvas when the page loads. Text on screens, certificates, labels and cards is drawn from the same data the plain pages use.

**One set of data, two views.** The content lives in JSON files in `data/`. The plain pages and the 3D rooms both read them, so there's a single place to update. Some of it is kept up to date automatically:

| Content | Source | How |
|---|---|---|
| Projects | Each project repo's README | `scripts/sync-projects.mjs` reads the title, pitch, problem, feature table, tech stack, screenshots and demo video, and copies the media into the site. Adding a project means adding one repo link. |
| Books | Goodreads | `scripts/sync-goodreads.mjs` reads the public shelf widget; genres come from Open Library subjects. |
| Games | Steam and PlayStation | `scripts/sync-games.mjs` uses the Steam Web API and the community [psn-api](https://github.com/achievements-app/psn-api) library. |

A [GitHub Actions workflow](.github/workflows/sync-data.yml) runs these syncs daily, and right away when the project list changes, then commits the results.

**Keeping the 3D smooth.**

- Rooms are only drawn while you're inside them or their doors are open; the doors swing open as you approach.
- The books on each bookcase are drawn as a single instanced mesh with one merged spine texture, which takes a wall of several hundred books from thousands of draw calls down to a handful.
- Boxes that only show one detailed face use two materials instead of six.
- Every shader is compiled behind the loading screen, so opening a door doesn't stutter.
- Project data loads only when the Work room first opens, and its screenshots and videos only when you ask for them.
- Game covers load a few per frame.
- The render resolution steps down automatically on slower devices.

**Accessible and privacy-minded.**

- The plain pages work without the 3D, and the room has keyboard, mouse and touch controls.
- The contact form posts to [Formspree](https://formspree.io), so no email address appears in the site's files.
- The framed resume is an image of the PDF with the contact line removed.

## Project layout

```
index.html, resume.html, projects.html,
about.html, contact.html                             plain pages
room.html                                            the 3D room
assets/site.css, assets/site.js                      styles and helpers for the plain pages
assets/contact-form.js                               the contact form, shared by the Contact page and the room
assets/room.js                                       the room's entry point: input, picking, doors, render loop
assets/rooms/core.js                                 renderer, shared helpers, the hall's doorways and doors, data loading
assets/rooms/hub.js, hall-viking.js                  the hall, its timber look and the pigeon
assets/rooms/about.js, work.js, hobbies.js           one file per room
assets/rooms/hobby-props.js, skill-icons.js          props for the Hobbies room; logos for the skill shelf
assets/rooms/map.js, contact.js, shared.js           floor-plan map, contact form, shared textures and frames
assets/vendor/three.module.js                        three.js 0.170.0
data/                                                content (JSON)
scripts/                                             syncs and asset generators (Node)
```

## Run it locally

The pages load data files, so serve the folder rather than opening the HTML directly:

```
npx http-server -p 8000 -c-1
```

Then open http://localhost:8000 (Node 18 or newer). The sync scripts need `npm install` first.

## Controls in the room

- **Desktop:** W A S D or the arrow keys to walk, the mouse to look, click or E to inspect, Esc for the options menu.
- **Touch:** drag on the left side to walk, drag on the right side to look, tap things to inspect.
- **Options menu:** a floor-plan map for jumping between rooms, and links back to the plain pages.

## Credits

- [three.js](https://threejs.org/) (MIT) for the 3D.
- Skill logos from [Simple Icons](https://simpleicons.org/) (CC0). The logos are trademarks of their owners.
- Outline icons from [Lucide](https://lucide.dev/) (ISC).
- The world map is drawn from [Natural Earth](https://www.naturalearthdata.com/) data (public domain), via [world-atlas](https://github.com/topojson/world-atlas).
- Fonts: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) and [Literata](https://fonts.google.com/specimen/Literata) (SIL Open Font License), from Google Fonts.
- The Turing School seal on the certificate belongs to [Turing School of Software and Design](https://www.turing.edu/).
- Book data from Goodreads and [Open Library](https://openlibrary.org/); game data from Steam and PlayStation Network.
