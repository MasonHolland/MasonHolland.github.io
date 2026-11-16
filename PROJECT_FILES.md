# Portfolio project files

This Project holds a copy of the whole site as text docs, under the `portfolio/` prefix, so the Codespaces chat can read or recreate it.

**To rebuild the repository:** create each file below at the same relative path (drop the `portfolio/` prefix), then open it in a Codespace. `.devcontainer/` and `scripts/setup.sh` do the rest, including downloading three.js (`assets/vendor/three.module.js` is not stored here because it is 1.3 MB; setup fetches version 0.170.0 from npm).

Files: index.html, resume.html, room.html, README.md, package.json, .gitignore, .devcontainer/devcontainer.json, .github/workflows/sync-data.yml, assets/site.css, assets/room.js, assets/rooms/{core,shared,hub,about,work,hobbies}.js, data/{profile,books,games}.json, scripts/{setup.sh,sync-goodreads.mjs,sync-games.mjs}.

Empty folders to create: assets/photos/, assets/covers/, assets/vendor/. Do not copy `assets/world/` (unused).

**Structure:** `room.html` loads `assets/room.js` (entry), which imports `assets/rooms/*.js`. All content comes from `data/*.json`. See README.md for sync setup and the large-frame, Switch and photo conventions.
