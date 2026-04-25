# 🏆 DEFINITIVE PROJECT STANDARDS: EZ-Plumbing Static Rebuild

This is the MASTER reference for all development work. Adherence is mandatory to protect Core Web Vitals and SEO rankings.

---

## 🏗️ 1. HTML & Global Structure

- **One H1 per page**: Must contain primary keyword + brand name.
- **Heading Hierarchy**: Semantic tree (h1 > h2 > h3). Never skip levels.
- **Semantic HTML**: Use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
- **Strict Head Order**:
  1. Charset & Viewport
  2. LCP Preloads (imagesrcset-aware)
  3. SEO Meta (Title, Description, Robots)
  4. Canonical Link
  5. Social Meta (OG, Twitter)
  6. Preconnect/Font Preload
  7. **Critical CSS** (Inlined <style>)
  8. **Deferred CSS** (Purged file)
  9. Structured Data (JSON-LD)
  10. Analytics (Async, last)

## 🎨 2. CSS Strategy

- **Banned**: Banned: Bootstrap CSS (except purged), Slick, AOS, Font Awesome CSS.
- **Inlining**: Critical CSS (above-fold + header/nav) must be inlined and < 14KB gzipped.
- **Purging**: All vendor/global styles must be purged per-page via `tools/purgecss-pages.js`.
- **Loading**: Deferred purged CSS via `media="print" onload="this.media='all'"`.
- **Fonts**: `font-display: optional` only (to eliminate CLS from font swaps).
- **Rules**:
  - No `@import`.
  - No inline `style="..."`.
  - No unprefixed experimental properties.

## ⚡ 3. JavaScript Strategy

- **Vanilla Only**: Hard ban on jQuery, Bootstrap JS, Slick, AOS.
- **Loading**: Every script MUST have the `defer` attribute.
- **Modularity**: One feature per file in `shared/js/modules/`. Avoid monolithic files.
- **INP Protection**:
  - Use `{ passive: true }` on touch/scroll listeners.
  - Debounce high-frequency events (resize/scroll).
  - Defer heavy work (like chat widget) with `requestIdleCallback` or 5s delay post-load.

## 🖼️ 4. Image & LCP Strategy

- **Mandatory Attributes**: `width`, `height`, `alt`, and `decoding="async"`.
- **Loading Behavior**:
  - **LCP Image**: `loading="eager"`, `fetchpriority="high"`, `preload` in head.
  - **Others**: `loading="lazy"`.
- **Formats**: WebP is default. PNG only if WebP is larger (e.g. complex gradients).
- **Auto-Srcset**: Source images ≥ 768px auto-generate 375w, 768w, 1280w variants.
- **Traps**:
  - Never commit SVGs > 50KB (unwrap fake base64 raster data).
  - Clean Next.js paths (strip `&w=...&q=...`).

## 📈 5. SEO & Social

- **Meta Descriptions**: 150-160 chars, unique, keyword-rich.
- **Canonical**: Must match deployed URL exactly with trailing slash consistency.
- **OG Tags**: `og:title`, `og:description`, `og:image` (1200x630), `og:type="website"`.
- **JSON-LD**: Always placed AFTER CSS. Person/WebSite on home; CreativeWork/Service on others.

## 🛠️ 6. Dev Workflow & Build

- **Frontmatter**: Declare `title`, `description`, `lcp_image`, `css`, and `bg` preloads in `content.html`.
- **Next.js Cleanup**: Strip proxy URLs and params; convert to local assets.
- **Build Order**:
  1. Update Source CSS (shared/css/vendor/, global.css)
  2. `node build.js` (generates dist/)
  3. `node tools/purgecss-pages.js` (regenerates purged CSS)
  4. `node tools/extract-critical-css-page.js --all` (regenerates critical)
  5. `node build.js` (final build with inlined CSS)

---

_Verified & Consolidated: April 2026_
