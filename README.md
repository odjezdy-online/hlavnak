# odjezdy.online (Eleventy)

The odjezdy.online blog without Publii. Two looks taken from [odjezdy-system](https://github.com/odjezdy-online/odjezdy-system), chosen by each visitor with the "Vzhled" switch in the footer (remembered in the browser):

- **BUSE**: the amber LED board. Text is real HTML set in web fonts generated from odjezdy-system's BUSE bitmap font, so links, search and screen readers work. Photos are shown in amber dots; tapping one opens the colour original.
- **PID tablo**: the LCD stop display, with grey header rows and coloured category boxes.

## Commands

```
npm install
npm run dev      # http://localhost:8080 (use --port if 8080 is taken: npx @11ty/eleventy --serve --port 8137)
npm run build    # writes _site/
npm run fonts    # rebuild src/assets/fonts/*.otf from data/buse-font.json
npm run import   # re-import everything from Publii (overwrites src/posts, src/pages, media)
```

`npm run import` reads `C:/Users/plain/Documents/Publii/sites/odjezdyonline-obnova/input` read-only; pass another path as an argument to import a different Publii site.

## Writing a post

Add `src/posts/<slug>.md`. The file name does not set the URL; `permalink` does.

```markdown
---
title: "Výluka linky 508"
date: 2026-12-01
categories: ["Uzavírky", "MHD"]   # first one is the main category shown in lists
lines: ["508", "503"]             # optional: affected lines, shown as line boxes
lead: "Short intro shown under the title."
image:
  src: /media/posts/508/foto.jpg
  alt: "What is in the photo"
  caption: "Caption"
  credits: "https://source.example"
permalink: /bilina-vyluka-linky-508-2/
---

Text in Markdown. A line number inline: {% linka "508" %}
```

Posts in the `Uzavírky` category get the warning triangle from the BUSE font. `hidden: true` keeps a post out of all lists; `homepage: false` keeps it off the homepage only.

Imported posts carry `templateEngineOverride: md`, so `{% linka %}` does not work in them; remove that line from a post to use it.

## Settings

`src/_data/site.json`: menu, footer links, ticker text, donations embed, and third-party code. Google Analytics and AdSense are off (empty) by default; put the IDs there to turn them on.

`src/_data/projects.json`: the /projekty/ page (donate links, crypto address, project groups with status live / beta / vývoj).
