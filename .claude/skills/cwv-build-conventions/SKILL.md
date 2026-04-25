---
name: cwv-build-conventions
description: Project-specific Core Web Vitals build conventions for EZ-Plumbing. Use when building or editing any page, component, or build step where render path, CSS loading, JS loading, or image handling is affected. Binds the generic `core-web-vitals` and `performance` skills to this project's actual tools and files.
---

# CWV Build Conventions — Project Bindings

You are working on **EZ-Plumbing**, a static HTML/CSS/JS rebuild of a plumbing services site. The
entire point of the rebuild is to pass Core Web Vitals on mobile. Generic CWV advice alone is
not enough — you must follow this project's specific conventions and know which tools apply.

Read these before making any change that touches rendering, loading, or metrics:

1. `docs/conventions/head-order.md` — exact `<head>` ordering
2. `docs/conventions/css-strategy.md` — CSS taxonomy, purging, critical extraction
3. `docs/conventions/js-strategy.md` — JS loading, modules, auto-detection
4. `docs/conventions/image-strategy.md` — LCP, preload, `fetchpriority`, `loading`
5. `docs/cwv-definition-of-done.md` — per-page checklist that gates "done"

## Project tooling (what already exists)

| Tool | Path | Role |
|---|---|---|
| Build script | `build.js` | Merges `shared/components/*` + `pages/{slug}/content.html` → `dist/{slug}.html`. Auto-detects JS modules via regex. Emits per-page CSS link based on presence of `*.purged.css`. |
| PurgeCSS per page | `tools/purgecss-pages.js` | Combines vendor + global + per-page CSS (including Bootstrap), runs PurgeCSS against built HTML, outputs `dist/css/pages/{slug}.purged.css`. |
| Critical CSS extractor | `tools/extract-critical-css-page.js` | Playwright-based above-fold extraction. Output is **inlined** by `build.js` (fonts.css + critical CSS combined into `<style>` block, CleanCSS level 2 applied). |
| Lazy loading pass | `tools/add-lazy-loading.js` | Adds `loading="lazy"` and `decoding="async"` to below-fold images. |
| Image optimizer | `tools/optimize-images.js` | Regenerates WebP/AVIF from source. |
| CSS minifier | Integrated into `build.js` (`minifyDistCSS()`) | CleanCSS level 2 runs on all `dist/css/**/*.css` at end of full build. Also minifies inline critical CSS during injection. No separate step needed. |
| Visual diff | `tools/visual-compare.js` | Playwright screenshots vs reference. Uses 2500ms settle time after `networkidle` to allow lazy images and AOS animations to render before capture. |
| Page comparator | `tools/compare-pages.js` / `tools/deep-compare.js` | Content-level diff of built pages against original scraped HTML. |
| Functional test | `tools/functional-test.js` | CTA, form, modal smoke tests. |

## Head emission — where to change things

`build.js` emits `<head>` in this order (per `docs/conventions/head-order.md`):

1. **`buildHead(meta)`** — meta tags, OG, Twitter, favicon (no schemas — those are separate).
2. **LCP preload** — per-page from `meta.lcp_image` frontmatter, or home page fallback.
3. **`{headMeta}` component** (`shared/components/head-meta.html`) — font preload only.
   No `<link rel="stylesheet">` tags — all vendor CSS libraries have been removed.
4. **`<style>` block** — `fonts.css` + per-page `*.critical.css` inlined together.
5. **Purged CSS** — `*.purged.css` deferred via `media="print" onload="this.media='all'"`.
6. **`buildSchemas(meta)`** — JSON-LD blocks (after CSS, never before).

When head-order.md and reality disagree, fix reality: typically either
(a) reorder the string concatenation in `buildPage()`, or
(b) edit `head-meta.html` directly.

## CSS build order (MANDATORY — violating this caused a live LCP regression)

When touching ANY CSS source (vendor rewrite, bg conversion, new images), follow this exact order.
**Skipping or reordering steps causes stale PNG/JPG refs in critical CSS → LCP regression.**

```
1. Edit vendor/global CSS sources
2. node tools/rewrite-bg-css.js           (vendor .png/.jpg → .webp)
3. node build.js                          (dist/ from sources)
4. node tools/purgecss-pages.js           (regenerate purged CSS)
5. cp dist/css/pages/*.purged.css shared/css/pages/
6. Rewrite purged + critical CSS for stale .png/.jpg refs
7. node tools/extract-critical-css-page.js --all
8. node build.js                          (final build)
9. VERIFY: grep -rE 'background-image.*\.(png|jpg)' dist/*.html → must be zero
```

**Step 6 is why this section exists.** `rewrite-bg-css.js` only touches vendor source CSS.
Purged and critical CSS files are generated artifacts that may contain stale PNG/JPG refs
from a previous extraction. They MUST be checked and rewritten before committing.

**April 2026 incident:** skipping step 6 left 52 purged/critical CSS files with old `.jpg`
refs. Browser loaded 39 KB JPEG instead of 3 KB WebP for the LCP background. Score dropped
97 → 82, LCP regressed 1.7 s → 3.9 s on live. See `css-strategy.md` § "Build order".

## Rules you must follow

### CSS + JS load rules

- **Never add a `<link rel="stylesheet">` to `head-meta.html` or any component.** All CSS is either inlined (critical + fonts) or in the deferred purged bundle. See `css-strategy.md`.
- **Never add jQuery, Bootstrap JS, Slick, AOS, or Font Awesome.** See `js-strategy.md` § "Banned libraries" for the full list and why.
- **Never add a JS library > 5 KB.** Every feature must be implementable in < 2 KB vanilla JS.
- **Never add a `<script src>` without `defer` or `async`.**
- **Never add `.aos-item` to above-the-fold elements.** The transition starts invisible.
- **When adding a new JS module**, update `detectJsModules()` in `build.js` and `js-strategy.md` in the same commit.
- **When adding a JS behavior that toggles a class**, add the class to `SAFELIST` in `tools/purgecss-pages.js`.

### Image rules (STRICT)

- **Never hard-code an LCP preload in `build.js`.** Use `lcp_image:`, `lcp_bg_mobile:`, or `lcp_bg_desktop:` in page frontmatter.
- **Never reference PNG/JPG in CSS `background-image:`.** Use WebP only. If you find any, run `node tools/convert-bg-to-webp.js` + `node tools/rewrite-bg-css.js`.
- **Never reference cross-origin URLs in CSS `background-image:`.** They 404 on our domain and Lighthouse can't preload them. Self-host everything.
- **When adding a new image (≥768 px wide)**, run `node tools/generate-image-variants.js`. Commit the manifest (`tools/image-variants.json`) and variants.
- **CSS-background LCPs MUST be declared** via `lcp_bg_mobile:` or `lcp_bg_desktop:` frontmatter — preload scanner can't discover CSS backgrounds.

### Per-page verification (MANDATORY for new pages + content edits)

Before marking a page "done", run this Playwright LCP detection at 360×640 mobile
and 1440×900 desktop:

```js
new PerformanceObserver(l => {
  const e = l.getEntries().pop();
  console.log({ tag: e.element.tagName, url: e.url, src: e.element.currentSrc });
}).observe({ type: 'largest-contentful-paint', buffered: true });
```

Then follow the decision tree:

| LCP reports | Frontmatter to set |
|---|---|
| `tag: IMG` with `src` or `currentSrc` | `lcp_image: /path/to.webp` |
| `tag: SECTION/DIV` with `url` (CSS bg) | `lcp_bg_mobile: /path.webp` and/or `lcp_bg_desktop:` |
| `tag: P/H1/DIV` with `text` (no url) | Nothing — font preload handles it |

**If the reported URL ends in `.png` or `.jpg`**, convert it to WebP first
(`tools/convert-bg-to-webp.js`) before setting the frontmatter.

### Ship gate

- **When done with a page, walk `docs/cwv-definition-of-done.md` line by line.** Don't skip items.
- **When modifying critical CSS or the extractor**, run the Critical-CSS self-test from the DoD.
- **Do not push to master without local Playwright verification** that the new page's CWV metrics pass thresholds (LCP ≤ 2.5 s, CLS ≤ 0.1, FCP ≤ 1.8 s).

## TBT diagnosis and reduction

**Total Blocking Time** is the sum of "blocking periods" of long tasks (>50 ms) between FCP and
TTI. PSI weight is 30% of the performance score — it dominates mobile scores. Threshold: good
≤200 ms, needs improvement ≤600 ms.

### Bench ÷ 4 rule

PSI applies 4× CPU throttle + 4G network. To approximate PSI TBT from a local Playwright bench:

```
PSI TBT ≈ local_bench_TBT ÷ 4
```

Run `node tools/cwv-bench.js` locally (throttle is applied automatically) and divide the TBT
result by 4. If the result is near 200 ms, it is worth checking live PSI — variance can push you
either side of the threshold.

### Root cause checklist for high TBT

Work through these in order — each has a known fix in this project:

| Cause | Diagnosis | Fix |
|---|---|---|
| Unminified purged CSS (100s of KB parsed on main thread) | Check `dist/css/pages/{slug}.purged.css` size before/after build | CleanCSS is now integrated into `build.js` — just rebuild |
| Large inline critical CSS (>50 KB) | Check `<style>` block size in built HTML | Re-run `extract-critical-css-page.js` on the page; see css-strategy.md § "Critical CSS duplication trap" |
| Third-party JS on main thread | Console → Sources → Coverage; or Performance tab long tasks | Remove the script or replace with self-hosted vanilla equivalent |
| Long JS parse / execution | Chrome DevTools Performance → Main thread flame chart | Split into smaller modules; defer non-essential init |
| Many layout reflows during load | Chrome DevTools → Layout → "Forced reflow" warnings | Batch DOM reads before writes; avoid reading layout properties inside loops |

**April 2026 result:** After CleanCSS integration, white-label TBT dropped from ~4000 ms (bench)
to ~1047 ms (bench), approximately 262 ms PSI equivalent — just above the 200 ms good threshold.
The remaining TBT is dominated by JS parse time and AOS animations; future work is in JS deferral.

## Visual test timing

`tools/visual-test.js` waits **2500 ms** after `networkidle` before taking a screenshot. This
is necessary because:

- With minified CSS, `networkidle` fires faster — but lazy images at y > 3000 px haven't
  triggered their IntersectionObserver yet
- AOS animation classes are applied by a 100 ms tick loop — they may not have all fired
- Without the extra wait, lazy images appear broken and visual diffs show false failures

**Do not reduce the 2500 ms settle time.** The wait directly affects pixel-diff accuracy.
Functional tests (`tools/functional-test.js`) skip `loading="lazy"` images in broken-image checks
for the same reason.

## Cloudflare cache caveat

After deploying CSS changes, HTML is fresh immediately (inline critical CSS updates on next
request). But async-loaded `*.purged.css` files are served from Cloudflare edge cache with
`max-age=31536000`. The browser may download the new CSS but Cloudflare may serve the old file
to other users until the CDN cache naturally invalidates or is manually purged.

**Symptom:** local test passes (fresh CSS served) but live PSI still shows old file size in
waterfall.

**Fix:** manually purge the affected CSS path in Cloudflare dashboard, or use a cache-busting
query parameter in the `<link>` tag (update the `href` to add `?v=YYYYMMDD`). The critical CSS
`<style>` block is unaffected since it's inlined in HTML.

## Enforcement status

Conventions are **manually enforced right now**. User directive (2026-04-14) is to validate on
2–3 pages first, then add a build-time validator / pre-commit hook. Do not add enforcement
automation until the user confirms conventions are stable. See memory file
`feedback_deferred_cwv_enforcement.md`.

## Common mistakes to avoid

1. Treating Bootstrap as "just a vendor file" and loading it as a second blocking stylesheet. It must be purged with the rest.
2. Placing JSON-LD above the font preload. Schema is not for rendering — it comes after the render path is set up.
3. Using `fetchpriority="high"` on more than one image. Browser resolves this by ignoring the hint.
4. Deferring CSS a component actually needs above-the-fold (causes FOUC).
5. Editing a `*.purged.css` file by hand — it's regenerated on every build.
6. Adding a new CDN reference "just for this feature." All third-party assets must be self-hosted.
7. **Critical CSS extraction that only uses `getBoundingClientRect()`.** Hidden elements in `<header>`/`<nav>` (e.g. mobile menu at ≤1024px) must have their rules included in critical CSS, or the first paint renders the menu fully expanded and CLS explodes when deferred CSS arrives. See `docs/conventions/css-strategy.md` § "Critical CSS extraction — pitfalls".
8. Shipping a critical-CSS change without running the "Critical-CSS self-test" in `docs/cwv-definition-of-done.md`. The extractor can silently miss rules; only the self-test catches it.
9. **Assuming the LCP is the `<img>` you preloaded.** On pages with a `<section class="main-banner">` that uses a CSS `background-image`, the SECTION itself is often the LCP element and its background URL is what Lighthouse measures — NOT the `<img>` inside. Always detect LCP via Playwright `PerformanceObserver` before claiming victory on LCP optimization.
10. **Referencing PNG or JPG in `background-image:`.** Always WebP. The conversion tool (`convert-bg-to-webp.js`) is idempotent and measures before/after — use it every time you see a `.png` or `.jpg` URL in a CSS rule.
11. **Committing purged/critical CSS without checking for stale image refs.** After ANY CSS source change (vendor rewrite, bg conversion), the purged + critical CSS files in `shared/css/pages/` may contain old .png/.jpg URLs from the previous extraction. Always grep `dist/*.html` for `background-image.*\.(png|jpg)` before pushing. See `css-strategy.md` § "Build order" and the April 2026 LCP regression incident.

## How to verify a page

```bash
# Build the single page
node build.js --page=white-label-igaming-platform

# Walk the DoD checklist in docs/cwv-definition-of-done.md
# Then run Lighthouse mobile against dist/white-label-igaming-platform.html
```

Pair this skill with `core-web-vitals` and `performance` skills when a generic pattern is needed.
This skill contains project bindings; they contain the universal theory.
