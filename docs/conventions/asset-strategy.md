# Asset Strategy

All assets the page needs to render must be self-hosted. No external CDN calls for
fonts, images, JS, CSS, icons, or any render-critical resource.

## Self-hosted assets

Every resource referenced by `src=`, `href=` (on `<link>` tags), `url()` in CSS,
or `@import` in CSS **must** resolve to a local path under `shared/` or `dist/`.

### What's allowed (external)

| Type | Example | Why allowed |
|------|---------|-------------|
| Navigation links (`<a href>`) | Facebook, LinkedIn, WhatsApp, Calendly | User-initiated navigation, not an asset load |
| Form submission endpoints | `api.example.com/contact` | POST on user action, not page render |
| Analytics (GTM, GA) | `googletagmanager.com/gtm.js` | Loaded async, non-blocking, already per R02 |
| Chat widget | `embed.tawk.to` | Lazy-loaded 5s after page load |
| Embedded form iframe | `api.leadconnectorhq.com/widget/form` | User interaction widget, not render asset |

### What's NOT allowed (external)

- **R16a** — `<link>` to external CSS (Google Fonts CDN, Bootstrap CDN, Font Awesome CDN)
- **R16a** — `<script src>` to external JS (jQuery CDN, any CDN-hosted library)
- **R16a** — `<img src>` pointing to external domains
- **R16b** — `@import url()` in CSS pointing to external fonts
- **R16b** — `url()` in CSS pointing to external images/fonts
- **R16a** — `<link rel="preconnect">` to font CDNs not in use

### Why

- External calls add DNS + TLS round trips (100–300 ms each)
- External CDNs can go down, taking the site with them
- External fonts cause FOIT/FOUT (flash of invisible/unstyled text)
- Cannot control caching headers of external resources
- Privacy — no leaking user visits to third-party servers for asset loading

## Per-page CSS files

- **R17** — Every page folder in `pages/` must have a matching `{slug}.purged.css` and
  `{slug}.critical.css` in `shared/css/pages/`. Without these, the build falls back to
  loading all vendor CSS as blocking stylesheets, violating the head-order convention.
  Generate them with:
  ```bash
  node tools/purgecss-pages.js
  node tools/extract-critical-css-page.js --all
  ```

## Image format

- **R18** — All raster images referenced in HTML `<img src>` must be WebP format.
  No `.png`, `.jpg`, or `.jpeg` in `src=` attributes. Convert using sharp or
  `node tools/convert-all-to-webp.js`. Exceptions: `favicon.png` (browser requirement).

## Hard rules

- **R16a** — No external `src=` in page or component HTML. Self-host everything.
- **R16b** — No external `url()` or `@import` in CSS. Self-host all fonts and images.
- **R17** — Every page must have `.purged.css` + `.critical.css` in `shared/css/pages/`.
- **R18** — WebP only for raster images in HTML. No `.png`/`.jpg`/`.jpeg` in `<img src>`.
