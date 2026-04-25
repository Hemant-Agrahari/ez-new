# Plan: Responsive Images Across All Pages

## Goal

Reduce mobile image transfer by ~85% by serving viewport-appropriate WebP variants
via `srcset`, instead of shipping full-resolution images to every device.

## Scope

- All `<img>` tags in built pages (~100+ across pages + shared components)
- Generate **4 viewport variants** per source WebP image
- Auto-rewrite `src` → `src + srcset + sizes` at build time
- Update LCP preloads to use `imagesrcset` / `imagesizes`

## Target sizes

| Variant | Use case | Width |
|---|---|---|
| `{name}-360.webp` | Mobile portrait | 360w |
| `{name}-768.webp` | Mobile landscape, tablets portrait | 768w |
| `{name}-1280.webp` | Tablet landscape, small laptops | 1280w |
| `{name}-1920.webp` | Desktop, retina | 1920w |

Original (full-resolution source) stays as `src` fallback for legacy browsers.

## Locked decisions

| Decision | Choice |
|---|---|
| Variant location | Alongside originals in `shared/assets/` |
| Commit variants to git | Yes (reproducible deploys, simple CI pipeline) |
| Target sizes | 360 / 768 / 1280 / 1920 |
| Format | WebP only (AVIF possibly later) |
| `sizes` default | `100vw` with `col-lg-*` overrides |
| Rollout | All pages at once |

## Implementation phases

### Phase 1 — Image generation tool

`tools/generate-image-variants.js`

- Use `sharp` to read every `.webp` in `shared/assets/`
- For each source ≥ 768 px wide, generate the 4 variants
- Skip sources already smaller than a target width (don't upscale)
- Skip if variant already exists (idempotent — safe to re-run)
- Output a manifest at `tools/image-variants.json` listing what was generated

### Phase 2 — Build-time `<img>` rewriter

Integrated into `build.js`:

- Find every `<img src="/assets/X.webp">` in built HTML
- Look up which variants exist for X via the manifest
- Rewrite to: `<img src="X.webp" srcset="X-360.webp 360w, X-768.webp 768w, ..." sizes="...">`
- Determine `sizes` attribute from CSS context:
  - Inside `.col-lg-6` → `(min-width: 992px) 50vw, 100vw`
  - Inside `.col-lg-4` → `(min-width: 992px) 33vw, (min-width: 768px) 50vw, 100vw`
  - Default → `100vw`

### Phase 3 — LCP preload upgrade

Modify `build.js` for pages with `lcp_image:` frontmatter:

```html
<link rel="preload" as="image" fetchpriority="high"
      href="/assets/X-1920.webp"
      imagesrcset="...-360.webp 360w, ...-768.webp 768w, ...-1280.webp 1280w, ...-1920.webp 1920w"
      imagesizes="100vw">
```

### Phase 4 — Convention + skill updates

1. Update `docs/conventions/image-strategy.md`:
   - Document the `-{w}.webp` naming convention
   - Document the auto-srcset rewriting at build time
2. Update `.claude/skills/cwv-build-conventions/SKILL.md`:
   - Add "every new product image must run through generate-image-variants.js"

### Phase 5 — Validation

1. Local Playwright bench across representative pages — confirm:
   - Mobile downloads the 360w variant (~1/4 the size)
   - Desktop downloads the 1920w variant
   - No visual regressions
2. Spot-check pages at multiple viewports

### Phase 6 — Deploy

1. Commit + push → CI deploys
2. Wait for rsync to transfer new image files
3. Live PSI run — expect mobile transfer size to drop significantly

## Risk mitigation

| Risk | Mitigation |
|---|---|
| Variant missing for some source → broken `srcset` | Build script falls back to plain `<img src>` if variants missing |
| Wrong `sizes` attribute → browser picks oversized variant | Default `100vw` is conservative; refine per layout |
| Disk usage spike (~10–30 MB extra in repo) | Acceptable; WebPs at these sizes are small |
| `sharp` install issues | Already a devDep, deploy.sh runs `npm install` |

## Time estimate

| Phase | Duration |
|---|---|
| 1. Variant generator script | 15 min |
| 1b. Run generator | 5–10 min for ~50–100 images |
| 2. HTML rewriter | 30 min |
| 3. LCP preload upgrade | 10 min |
| 4. Convention updates | 15 min |
| 5. Local validation | 15 min |
| 6. Deploy + live verification | 10 min |
| **Total** | **~90 min of work** |

## Success criteria

- [ ] Mobile image transfer drops by 60–85%
- [ ] No visual regressions on any pages
- [ ] Zero JS errors
- [ ] All pages still pass CWV self-test
- [ ] Conventions doc reflects new naming + build rewrite contract
