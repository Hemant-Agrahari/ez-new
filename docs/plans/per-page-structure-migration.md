# Migration Plan: Per-Page Folder Structure

## Context

The EZ-Plumbing project currently has a structure where all pages sit in `pages/`, all CSS in `css/`, all JS in `js/`, and all images in `assets/`. This means every page loads the same vendor CSS (most of it unused for that page). Restructuring to per-page folders improves organization, isolation, and sets the foundation for per-page CSS optimization.

**Goal:** Reorganize into self-contained page folders without breaking anything. The dist output must remain identical.

---

## Target Structure

```
ez-new/
├── shared/
│   ├── components/         (header.html, footer.html, contact-modal.html, etc.)
│   ├── css/
│   │   ├── vendor/         (vendor CSS files — unchanged)
│   │   ├── global.css      (our overrides)
│   │   └── pages/          (home.css, service.css, about.css, contact.css, legal.css)
│   ├── js/                 (modules, utilities)
│   └── assets/             (all images — unchanged for now)
├── pages/
│   ├── home/
│   │   └── content.html
│   ├── services/
│   │   └── content.html
│   └── ... (page folders)
├── build.js                (updated)
├── site.config.yaml
└── dist/                   (output — identical to before)
```

---

## What Changes vs What Stays

| Item | Changes? | Details |
|------|----------|---------|
| Page content HTML | **Moved** | `pages/{slug}.html` → `pages/{slug}/content.html` |
| Components | **Moved** | `components/` → `shared/components/` |
| Vendor CSS | **Moved** | `css/vendor/` → `shared/css/vendor/` |
| Global CSS | **Moved** | `css/global.css` → `shared/css/global.css` |
| Page CSS | **Moved** | `css/pages/` → `shared/css/pages/` |
| JS files | **Moved** | `js/` → `shared/js/` |
| Assets/images | **Moved** | `assets/` → `shared/assets/` |
| build.js | **Updated** | New path resolution, same output |
| site.config.yaml | **Updated** | New path settings |
| dist/ output | **No change** | Byte-identical HTML |
| Image paths in HTML | **No change** | All use absolute paths |
| CSS/JS load order | **No change** | Same files, same order |

---

## Implementation Steps

### Step 1: Save baseline for comparison
- Run `node build.js` and copy `dist/` to `dist-baseline/`
- This is our regression reference

### Step 2: Create `shared/` directory structure
- `mkdir shared/components shared/css shared/css/vendor shared/css/pages shared/js shared/assets`
- Copy: `components/*` → `shared/components/`
- Copy: `css/vendor/*` → `shared/css/vendor/`
- Copy: `css/global.css` → `shared/css/global.css`
- Copy: `css/pages/*` → `shared/css/pages/`
- Copy: `js/*` → `shared/js/`
- Copy: `assets/*` → `shared/assets/`

### Step 3: Create per-page folders
For each page, create a folder and move content:

```
pages/index.html         → pages/home/content.html
pages/about-us.html      → pages/about-us/content.html
pages/services.html      → pages/services/content.html
... (repeat for all pages)
```

### Step 4: Update build.js
Key changes:

1. **Path constants** — Point to new locations:
   ```
   PAGES_DIR → path.join(ROOT, 'pages')  (now contains folders)
   COMPONENTS_DIR → path.join(ROOT, 'shared', 'components')
   ```

2. **collectPages()** — Find `content.html` inside each page folder

3. **buildPage()** — Derive output filename from folder name:
   - `pages/about-us/content.html` → `dist/about-us.html`
   - `pages/home/content.html` → `dist/index.html` (special case)

4. **Static asset copying** — Copy from `shared/` paths

### Step 5: Update site.config.yaml
Add path configuration:
```yaml
# Directory structure
shared_dir: "shared"
pages_dir: "pages"
```

### Step 6: Validate
- Run `node build.js`
- Compare every file in `dist/` against `dist-baseline/`
- Serve and visually spot-check multiple pages
- Test all interactive features

### Step 7: Clean up old structure
- Delete old flat `pages/`, `components/`, `css/`, `js/`, `assets/`
- Final build + validation

---

## Critical Files to Modify

| File | Change |
|------|--------|
| `build.js` | Update path resolution, page collection, asset copying |
| `site.config.yaml` | Add directory path config |

## Success Criteria

- [ ] `dist/` output is byte-identical to baseline
- [ ] All pages build successfully
- [ ] No visual regressions
- [ ] All interactive features work (modals, nav, forms, etc.)
- [ ] No console errors
