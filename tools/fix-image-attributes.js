#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'pages');

const ALT_PATTERNS = {
  'logo': 'EZ Heat and Air Logo',
  'icon': 'Icon',
  'hero': 'Hero banner image',
  'banner': 'Banner image',
  'service': 'Service image',
  'team': 'Team member photo',
  'testimonial': 'Customer testimonial photo',
  'blog': 'Blog post image',
  'post': 'Blog post image',
  'card': 'Card image',
  'promo': 'Promotion image',
  'call_us': 'Call us icon',
  'emergency': 'Emergency service icon',
  'repair': 'Repair service icon',
  'installation': 'Installation service icon',
  'heating': 'Heating service icon',
  'cooling': 'Cooling service icon',
  'plumbing': 'Plumbing service icon',
  'water': 'Water service icon',
  'drain': 'Drain service icon',
  'pipe': 'Pipe service icon',
  'hvac': 'HVAC service icon',
  'ac': 'Air conditioning icon',
  'default': 'Image'
};

function getAltFromPath(imagePath) {
  const lower = imagePath.toLowerCase();
  for (const [keyword, alt] of Object.entries(ALT_PATTERNS)) {
    if (lower.includes(keyword)) {
      return alt;
    }
  }
  return ALT_PATTERNS.default;
}

async function getImageDimensions(imagePath) {
  try {
    const fullPath = path.join(ROOT, imagePath);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    const metadata = await sharp(fullPath).metadata();
    return { width: metadata.width, height: metadata.height };
  } catch (e) {
    return null;
  }
}

async function processPage(pageDir) {
  const contentPath = path.join(pageDir, 'content.html');
  if (!fs.existsSync(contentPath)) return { fixed: 0, errors: 0 };

  let content = fs.readFileSync(contentPath, 'utf8');
  const images = content.match(/<img[^>]+>/g) || [];
  let fixed = 0;
  let errors = 0;

  for (const imgTag of images) {
    const originalTag = imgTag;
    const hasAlt = /alt=["']/.test(imgTag);
    const hasWidth = /width=["']/.test(imgTag);
    const hasHeight = /height=["']/.test(imgTag);
    if (hasAlt && hasWidth && hasHeight) continue;

    const srcMatch = imgTag.match(/src=["']([^"']+)["']/);
    if (!srcMatch) continue;

    let newTag = imgTag;
    if (!hasAlt) {
      const altText = getAltFromPath(srcMatch[1]);
      newTag = newTag.replace('<img ', `<img alt="${altText}" `);
    }

    const dims = await getImageDimensions(srcMatch[1]);
    if (dims) {
      if (!hasWidth) newTag = newTag.replace('<img ', `<img width="${dims.width}" `);
      if (!hasHeight) newTag = newTag.replace('<img ', `<img height="${dims.height}" `);
    } else {
      errors++;
    }

    if (newTag !== originalTag) {
      content = content.replace(originalTag, newTag);
      fixed++;
    }
  }

  if (fixed > 0) {
    fs.writeFileSync(contentPath, content);
  }

  return { fixed, errors };
}

async function main() {
  console.log('Fixing image attributes across all pages...\n');
  const pageDirs = fs.readdirSync(PAGES_DIR).filter(f => {
    return fs.statSync(path.join(PAGES_DIR, f)).isDirectory();
  });

  let totalFixed = 0, totalErrors = 0, pagesWithFixes = 0;

  for (const pageDir of pageDirs) {
    const result = await processPage(path.join(PAGES_DIR, pageDir));
    if (result.fixed > 0) {
      console.log(`  ${pageDir}: ${result.fixed} fixed`);
      totalFixed += result.fixed;
      totalErrors += result.errors;
      pagesWithFixes++;
    }
  }

  console.log(`\nDone! Fixed ${totalFixed} images across ${pagesWithFixes} pages.`);
  if (totalErrors > 0) {
    console.log(`Warning: ${totalErrors} images could not be read.`);
  }
}

main().catch(console.error);
