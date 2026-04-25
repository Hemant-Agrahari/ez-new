# Project Structure Guide — EZ-Plumbing Static Site

## Overview

This project is a static HTML/CSS/JS website built from components and page content using a Node.js build script. The build merges shared components (header, footer, modals) with per-page content to produce complete HTML files ready for deployment.

---

## Folder Structure

```
ez-new/
│
├── build.js                     ← Build script (merges pages + components → dist/)
├── site.config.yaml             ← Site settings (name, URL, SEO defaults)
├── package.json                 ← Node.js dependency (js-yaml)
│
├── shared/                      ← SHARED RESOURCES (used by ALL pages)
│   ├── components/              ← HTML fragments injected into every page
│   │   ├── header.html            Top navigation bar
│   │   ├── footer.html            Footer + copyright bar
│   │   ├── contact-modal.html     "Get in Touch" popup form
│   │   ├── head-meta.html         CDN links, fonts, vendor CSS references
│   │   ├── chat-widget.html       JS loader + chat widget
│   │   ├── gtag.html              Google Tag Manager
│   │   ├── schema-org.html        JSON-LD structured data
│   │   └── forms/
│   │       └── contact.html       Inline contact form
│   │
│   ├── css/
│   │   ├── vendor/              ← Original site CSS (source, DO NOT EDIT)
│   │   ├── global.css           ← Our overrides
│   │   └── pages/               ← Page-specific CSS
│   │       ├── home.css
│   │       ├── service.css
│   │       └── ...
│   │
│   ├── js/
│   │   ├── modules/             ← Feature modules (one feature per file)
│   │   ├── forms.js             ← Form validation
│   │   ├── nav.js               ← Mobile nav toggle
│   │   └── ...
│   │
│   └── assets/                  ← ALL images, fonts, icons
│       ├── images/
│       ├── fonts/
│       ├── icons/
│       └── ...
│
├── pages/                       ← ONE FOLDER PER PAGE
│   ├── home/
│   │   └── content.html          → builds to dist/index.html (special mapping)
│   ├── about-us/
│   │   └── content.html          → builds to dist/about-us.html
│   ├── services/
│   │   └── content.html
│   ├── contact-us/
│   │   └── content.html
│   └── ... (more pages)
│
├── dist/                        ← BUILD OUTPUT (deploy this folder)
│   ├── index.html
│   ├── about-us.html
│   ├── ... (all complete HTML files)
│   ├── css/                       Copied from shared/css/
│   ├── js/                        Copied from shared/js/
│   ├── assets/                    Copied from shared/assets/
│   ├── sitemap.xml                Auto-generated
│   ├── robots.txt                 Auto-generated
│   └── serve.json                 Clean URL config
│
├── docs/                        ← Documentation
│   ├── conventions/             ← How pages, CSS, JS, images are loaded
│   ├── plans/                   ← Project planning docs
│   └── cwv-definition-of-done.md ← Per-page ship checklist
│
├── tools/                       ← Utility scripts
│   ├── purgecss-pages.js
│   ├── extract-critical-css-page.js
│   └── ...
│
└── .claude/                     ← AI skills & rules
    ├── rules/
    └── skills/
```

---

## How Pages Are Organized

Each page lives in its own folder: `pages/{page-name}/content.html`

Each `content.html` has two parts:

### Part 1: YAML Frontmatter (page settings)
```yaml
---
title: "Plumbing Services | EZ-Plumbing"
description: "Professional plumbing services in San Diego..."
canonical: /plumbing-services
css: service.css
nav_active: services
keywords: "plumbing, services, san diego"
og:
  title: "Plumbing Services"
  description: "Professional plumbing services..."
  type: website
schema:
  type: WebPage
  name: "Plumbing Services"
---
```

### Part 2: HTML Body (page content with component markers)
```html
{{header}}

<main>
  <section class="hero-banner">
    <h1>Plumbing Services</h1>
    ...
  </section>
  ...
</main>

{{footer}}
{{chat-widget}}
```

Markers like `{{header}}`, `{{footer}}`, `{{chat-widget}}` are replaced with the corresponding component HTML during the build process.

---

## Build Output

Running `node build.js` produces complete, ready-to-deploy HTML files in `dist/`:
- All meta tags, OG tags, and schema markup are injected
- All CSS and JS links are connected
- All component markers are replaced with actual HTML
- Per-page CSS and JS modules are auto-detected and loaded
- Assets are copied to correct locations
- Sitemap and robots.txt are auto-generated

Each built page is a complete, self-contained HTML file with zero dependencies on the build system.
