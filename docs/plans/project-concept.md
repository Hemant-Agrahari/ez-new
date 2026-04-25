# Project Concept: CMS → Static HTML Rebuild

## Purpose

Rebuild CMS-powered websites (WordPress, NextJS+Node) as pure static HTML/CSS/JS sites to:
- Pass Core Web Vitals (LCP, CLS, INP) easily
- Maintain full SEO capability (all meta, schema, OG tags, structured data)
- Enable AI-managed content (Claude/Antigravity replaces CMS admin)
- Support lead generation (forms, chat widget)
- Scale across multiple sites (40–1100 pages each)

**Current target:** EZ-Plumbing (Plumbing services site)
**Then replicate:** across all CMS sites using this project as a template.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     3-Tool Pipeline                         │
│                                                             │
│  Tool A: Scraper ──► Tool B: Analyzer ──► Tool C: Reporter  │
│  (site-scraper/)     (future)             (future)          │
│                                                             │
│  Captures HTML,      Extracts structure,  Produces readable  │
│  screenshots, SEO    SEO data, elements   audit reports     │
│  at 5 viewports      from scraped HTML                      │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Static Site Project                       │
│                                                             │
│  shared/      ──► build.js ──► dist/                        │
│  pages/           (merge)      (complete HTML files)        │
│                                (deploy to server)           │
│                                                             │
│  AI edits shared/ and pages/                                │
│  Runs build.js → dist/ updated                              │
│  Deploy dist/ to production                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Chosen Approach: Node.js Build Script

A minimal Node script merges shared components + page content → complete static HTML files.

**Why Node build over other options:**
- Output is pure static HTML — deploy anywhere (VPS, CDN, S3, Netlify)
- Can extend to generate sitemap.xml, validate SEO, check broken links
- Frontmatter gives structured page-level meta — easy for AI to read/edit
- Already using Node for blueprint tools
- Cross-platform (Windows, Linux, Mac)
- 32 pages builds in <2 seconds
- Build script is version-controlled and portable

**Trade-off:** Requires running `node build.js` after edits (not instant like PHP/SSI). Acceptable because the build is <2 seconds and can be automated with a file watcher.

---

## File Structure

```
{project}/
├── build.js                    ← Build script
├── site.config.yaml            ← Site-level config (name, base URL, analytics IDs)
│
├── shared/                     ← Everything reused across pages
│   ├── components/
│   │   ├── head-meta.html      ← CDN links, fonts, vendor CSS, analytics
│   │   ├── header.html         ← Logo, nav menu, hamburger
│   │   ├── footer.html         ← Footer links, copyright, legal
│   │   ├── contact-modal.html  ← Get In Touch popup form
│   │   ├── chat-widget.html    ← Chat widget + JS loader
│   │   ├── gtag.html           ← Google Analytics / Tag Manager
│   │   ├── schema-org.html     ← Organization-level JSON-LD (shared)
│   │   └── forms/
│   │       └── contact.html    ← Inline contact form
│   ├── css/
│   │   ├── vendor/             ← Source vendor CSS (purged per-page)
│   │   ├── global.css          ← Our overrides
│   │   └── pages/{slug}.css    ← Per-page CSS
│   ├── js/
│   │   └── modules/            ← Feature modules
│   └── assets/
│       ├── images/
│       ├── fonts/
│       └── icons/
│
├── pages/                      ← One folder per page (content only)
│   ├── home/
│   │   └── content.html        ← → dist/index.html
│   ├── about-us/
│   │   └── content.html        ← → dist/about-us.html
│   └── ... (more pages)
│
├── dist/                       ← BUILD OUTPUT (complete HTML files, deploy this)
├── scraped/                    ← Scraper output (reference material)
├── tools/                      ← Utility scripts
└── docs/                       ← Project documentation
```

---

## Page File Format

Each page is `pages/{name}/content.html` — plain HTML with YAML frontmatter for SEO/meta:

```html
---
title: About Us - EZ-Plumbing
description: Learn about EZ-Plumbing's services and team.
canonical: /about-us
css: about.css
nav_active: about
og:
  title: About EZ-Plumbing
  description: Professional plumbing services
  image: /assets/images/og-about.jpg
  type: website
schema:
  type: AboutPage
  name: About EZ-Plumbing
robots: index, follow
---

{{header}}

<main>
    <section class="hero">
        <h1>About Us</h1>
        <p>Professional plumbing services.</p>
    </section>

    <section class="team">
        <h2>Our Team</h2>
        <!-- content -->
    </section>
</main>

{{footer}}
```

**Special mapping:** `pages/home/content.html` → `dist/index.html`
**All others:** `pages/{name}/content.html` → `dist/{name}.html`

**Frontmatter fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | `<title>` tag — include brand name |
| `description` | Yes | `<meta name="description">` — max 160 chars |
| `canonical` | Yes | Canonical URL path (relative) |
| `css` | No | Page-specific CSS file (in `shared/css/pages/`) |
| `nav_active` | No | Which nav item to highlight |
| `og.title` | No | OpenGraph title (defaults to `title`) |
| `og.description` | No | OpenGraph description (defaults to `description`) |
| `og.image` | No | OpenGraph image path |
| `og.type` | No | OpenGraph type (default: `website`) |
| `schema.type` | No | Schema.org page type (WebPage, AboutPage, ContactPage, FAQPage, etc.) |
| `schema.name` | No | Schema.org name |
| `robots` | No | Robots meta (default: `index, follow`) |
| `hreflang` | No | Language/region alternate URLs |
| `noindex` | No | If true, sets `noindex, nofollow` |

---

## Component Markers

| Marker | Resolves To |
|--------|-------------|
| `{{header}}` | `shared/components/header.html` |
| `{{footer}}` | `shared/components/footer.html` |
| `{{contact-modal}}` | `shared/components/contact-modal.html` |
| `{{chat-widget}}` | `shared/components/chat-widget.html` |
| `{{gtag}}` | `shared/components/gtag.html` |
| `{{form:contact}}` | `shared/components/forms/contact.html` |
| `{{schema-org}}` | `shared/components/schema-org.html` |
| `{{head-meta}}` | `shared/components/head-meta.html` |

Components are loaded from `shared/components/`. Subdirectories use `:` separator (e.g., `forms/contact.html` → `{{form:contact}}`).

---

## Build Script Behavior

`node build.js` does:

1. **Load** `site.config.yaml` for site-wide settings
2. **Load** all component HTML from `shared/components/`
3. **For each page folder** in `pages/`:
   a. Read `content.html`, parse YAML frontmatter
   b. Replace `{{component}}` markers with component HTML
   c. Wrap in `<!DOCTYPE html>` with `<head>` containing meta, OG, schema, CSS links
   d. Inject `nav_active` class into header nav
   e. Derive output filename from folder name (home → index.html, others → {name}.html)
   f. Write complete HTML to `dist/`
4. **Copy** `shared/css/`, `shared/js/`, `shared/assets/` to `dist/`
5. **Generate** `dist/sitemap.xml` from all pages
6. **Generate** `dist/robots.txt`
7. **Validate** every page has `<title>`, `<meta description>`, `<h1>`, canonical
8. **Report** build stats

**Single page rebuild:**
```bash
node build.js --page=home         # rebuild homepage only
node build.js --page=about-us     # rebuild about page only
```

---

## CSS Strategy

Each page loads:
1. Vendor CSS (source files) — via PurgeCSS per-page
2. `global.css` — our overrides
3. Page-specific CSS (if specified in frontmatter) — e.g., `home.css`

---

## Templating for New Sites

To replicate this project for a new site:

1. Copy the template: `cp -r ez-new/ NewSiteHtml/`
2. Clean project-specific content: remove `pages/*`, `dist/*`, `scraped/*`, page CSS, images
3. Update `site.config.yaml` with new site details
4. Update `shared/components/header.html` and `footer.html`
5. Run scraper on new site
6. Create page folders from scraped data
7. Build and validate

### What stays the same across all sites:
- `build.js` — identical build script
- Component marker system (`{{header}}`, `{{footer}}`, etc.)
- YAML frontmatter format
- CSS strategy (vendor + global + per-page)
- Skills and rules in `.claude/`

### What changes per site:
- `site.config.yaml` — site identity, URLs, analytics
- `shared/components/` — header, footer (logo, nav items)
- `pages/` — all page content
- `shared/css/pages/` — page-specific styles
- `shared/assets/` — images, fonts, icons
