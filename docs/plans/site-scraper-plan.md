# Plan: Generic SEO Website Scraper (Tool A)

## Context

We have multiple CMS/SEO sites that need to be rebuilt in plain HTML/CSS for Core Web Vitals. We need a **generic, config-driven scraper** that any project can use by providing a YAML config file.

This is **Tool A** in a 3-tool architecture:
- **Tool A (this plan):** Scraper — Playwright-based capture of HTML, screenshots, assets, SEO metadata
- **Tool B (future):** Analyzer Pipeline — runs on saved HTML, extracts structural/SEO data in modular passes
- **Tool C (future):** Report Generator — produces readable reports

---

## Location

`tools/site-scraper/` — lives inside the project. Portable across machines.

**Output goes to:** `scraped/{slug}/` (set via `--output-dir` CLI flag or `output_dir` in config).

## Key Decisions
- **Auth:** Public sites only. No login/cookie handling.
- **Assets:** Download everything, no size limits.
- **Output:** Inside each project's directory, not centralized.

---

## File Structure

```
tools/site-scraper/
├── pyproject.toml
├── requirements.txt            # playwright>=1.40.0, pyyaml>=6.0
├── .gitignore
├── configs/
│   └── example.yaml            # Annotated example config
├── src/
│   └── site_scraper/
│       ├── __init__.py
│       ├── __main__.py         # python -m site_scraper
│       ├── cli.py              # argparse CLI
│       ├── config.py           # YAML loading, validation, defaults
│       ├── models.py           # All dataclasses
│       ├── scraper.py          # Orchestrator: page loop → viewport loop → capture
│       ├── browser.py          # Playwright lifecycle (launch, context, navigate)
│       ├── capture/
│       │   ├── __init__.py
│       │   ├── html.py         # Rendered HTML per viewport
│       │   ├── screenshots.py  # Full-page + state screenshots
│       │   ├── css.py          # Inline CSS + external CSS download
│       │   ├── js.py           # Inline JS + external JS download
│       │   ├── images.py       # img src, srcset, background-image, mask-image
│       │   ├── fonts.py        # @font-face url() extraction + download
│       │   ├── media.py        # Video, audio, Lottie
│       │   ├── icons.py        # Favicon, apple-touch-icon, web manifest
│       │   └── tokens.py       # CSS :root custom properties
│       ├── seo/
│       │   ├── __init__.py
│       │   ├── metadata.py     # title, meta desc, robots, canonical, hreflang, lang
│       │   ├── opengraph.py    # og:* and twitter:* tags
│       │   ├── structured.py   # JSON-LD + microdata extraction
│       │   └── crawl.py        # robots.txt + sitemap.xml fetch
│       ├── interactions.py     # Config-driven interaction state runner
│       ├── downloader.py       # Asset downloader with host allowlist + retry
│       ├── manifest.py         # manifest.json builder (incremental writes)
│       └── utils.py            # Slugify, URL resolution, filename sanitization
└── tests/
    ├── conftest.py
    ├── test_config.py
    ├── test_models.py
    ├── test_downloader.py
    ├── test_seo_metadata.py
    └── test_interactions.py
```

---

## Default Viewports (5)

| Name | Width | Height | Covers |
|------|-------|--------|--------|
| mobile | 375 | 812 | iPhone SE/13 mini — most common mobile |
| mobile-large | 412 | 915 | Android default (Samsung, Pixel) |
| tablet | 768 | 1024 | iPad standard — layout switch point |
| desktop | 1440 | 900 | Most common laptop resolution |
| desktop-wide | 1920 | 1080 | Full HD monitors |

Viewport type classification: `<768` = mobile, `768-1023` = tablet, `>=1024` = desktop.
Overridable via config.

---

## Config File Format (`configs/example.yaml`)

```yaml
base_url: "https://example.com"

allowed_hosts:
  - "example.com"
  - "cdn.example.com"
  - "fonts.googleapis.com"

pages:
  - url: "/"
    slug: "home"
    wait_for: ".hero-section"       # Optional: wait for element before capture
    interaction_states:             # Page-specific states
      - name: "hero-video-play"
        viewport_types: ["all"]
        steps:
          - selector: ".play-btn"
            action: "click"
            wait_ms: 1000
        save_screenshot: true

  - url: "/about"
    slug: "about"

  - url: "/services"
    slug: "services"
    wait_for: "form#services-form"

# Optional — defaults shown
viewports:
  - { name: "mobile", width: 375, height: 812 }
  - { name: "mobile-large", width: 412, height: 915 }
  - { name: "tablet", width: 768, height: 1024 }
  - { name: "desktop", width: 1440, height: 900 }
  - { name: "desktop-wide", width: 1920, height: 1080 }

# Global interaction states (applied to all pages)
interaction_states:
  - name: "nav-open"
    viewport_types: ["mobile", "mobile-large", "tablet"]
    steps:
      - selector: "button.hamburger"
        action: "click"
        wait_ms: 500
    confirm_selector: "nav.is-open"
    save_html: true
    save_screenshot: true
    reset_steps:
      - selector: "button.hamburger"
        action: "click"
        wait_ms: 300

  - name: "cookie-dismissed"
    viewport_types: ["all"]
    steps:
      - selector: "#cookie-accept"
        action: "click"
        wait_ms: 300
    save_html: false
    save_screenshot: false          # Setup-only state

# Optional overrides
wait_for_selector: ""               # Global SPA root selector
output_dir: "./scraped"             # Relative to project root
timeouts:
  navigation_ms: 30000
  action_ms: 5000
screenshots:
  full_page: true
```

---

## Output Structure (per page)

```
scraped/{slug}/
├── mobile/
│   ├── rendered-default.html     # Rendered HTML, default state
│   ├── rendered-{state}.html     # For each interaction_state
│   ├── screenshot-default.webp   # Full-page screenshot
│   ├── screenshot-{state}.webp
│   ├── {asset-url-hash}.{ext}    # Extracted assets (CSS, JS, images)
│   └── manifest.json             # {url, selector, type, srcset, ...}
├── tablet/
│   └── ... (same structure)
├── desktop/
│   └── ... (same structure)
├── seo-metadata.json             # SEO tags, schema markup, crawl info
├── assets-manifest.json          # Central registry of all downloaded files
└── scrape-log.jsonl              # Timestamped events + errors
```

---

## Execution Example

```bash
cd tools/site-scraper/

# Install dependencies
pip install -r requirements.txt

# Run scraper with config
python -m site_scraper --config configs/example.yaml

# Or specify output dir
python -m site_scraper --config configs/example.yaml --output-dir ../../scraped
```

---

## Success criteria

- [ ] All pages scraped at all viewports
- [ ] All assets downloaded (no broken 404s)
- [ ] SEO metadata extracted for every page
- [ ] Interaction states captured per config
- [ ] Output structure is consistent and portable
- [ ] No sensitive data in logs or output
- [ ] Scraper is idempotent — re-running updates only changed files
