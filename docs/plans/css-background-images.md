# Plan: CSS Background Image Optimization

## Goal

Eliminate the LCP bottleneck caused by CSS `background-image` declarations that:
- Use unoptimized PNG/JPG files
- Are not discoverable by the preload scanner
- Cannot have `fetchpriority="high"` applied
- Are often the actual LCP element on pages

## Why this matters

Lighthouse audit "LCP request discovery" flags pages where the LCP element is a
`<section>` whose CSS `background-image` URL isn't preloaded. Responsive image work optimized
`<img>` elements but CSS backgrounds need separate handling. The CSS background is often what
paints as LCP on most banner sections.

## Locked decisions

| Decision | Choice |
|---|---|
| Image format for backgrounds | WebP only (skip AVIF for now) |
| Variant generation | Reuse existing `tools/generate-image-variants.js` |
| CSS rewrite strategy | Update CSS source files (purged + critical regenerated) |
| Preload strategy | Per-page `<link rel="preload" media="..." fetchpriority="high">` for LCP bg |
| Conversion target | All PNG/JPG used in `background-image:` ≥ 30 KB |

## Implementation phases

### Phase 1 — Convert PNG/JPG backgrounds to WebP

Extend or create tool (e.g., `tools/convert-bg-to-webp.js`) to:

1. Read the list of CSS-referenced PNG/JPG backgrounds
2. For each, generate a WebP at the same dimensions
3. Then run the existing variant generator on those new WebPs (4 widths)

Expected savings: significant total size reduction (most PNG→WebP conversions save 70–90%).

### Phase 2 — Rewrite CSS to use WebP

**Option A: Source-level rewrite** (preferred)
- Find every `background-image: url(.../X.png)` in vendor and global CSS
- Replace with `background-image: url(.../X.webp)`
- Re-run PurgeCSS so per-page purged CSS picks up the change
- Re-extract critical CSS

**Option B: Build-time post-process**
- Leave CSS source untouched
- Add a build step that rewrites `.png/.jpg` → `.webp` in final CSS
- Less invasive but harder to debug

### Phase 3 — Preload LCP backgrounds per page

For each page, identify the LCP background image. Add to `build.js`:

```html
<!-- Mobile-specific LCP background -->
<link rel="preload" as="image"
      href="/assets/images/main-mobile-banner.webp"
      media="(max-width: 575px)"
      fetchpriority="high">

<!-- Desktop LCP background -->
<link rel="preload" as="image"
      href="/assets/images/desktop-banner.webp"
      media="(min-width: 768px)"
      fetchpriority="high">
```

Frontmatter additions per page:

```yaml
lcp_bg_mobile: /assets/images/main-mobile-banner.webp
lcp_bg_desktop: /assets/images/desktop-banner.webp
```

### Phase 4 — Validation

1. Local Playwright bench across representative pages — confirm:
   - LCP element is now correctly preloaded
   - Mobile transfer drops by target amount
   - LCP improves significantly
   - No visual regressions
2. Spot-check pages at mobile and desktop viewports

### Phase 5 — Deploy

1. Commit + push → CI deploys
2. Live PSI run — expect performance improvements

## Risk mitigation

| Risk | Mitigation |
|---|---|
| Variant missing for some source | Build script falls back gracefully |
| Wrong `sizes` attribute | Conservative defaults, refine per layout |
| Disk usage spike | Acceptable with WebP compression |
| Rsync transfers large files | One-time event at first deploy |

## What won't change

- Image content (same image, just optimized format)
- Layout or visual presentation
- Page structure or components
