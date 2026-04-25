const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

function detectJsModules(html) {
  return "";
}

function injectImageOptimization($, yamlData) {
  const GEN_DIR = path.join(__dirname, "assets/images/generated");
  const IMAGES_BASE_PATH = "assets/images/";
  const GEN_BASE_PATH = "assets/images/generated/";

  // 1. Handle <img> tags (srcset and sizes)
  $("img").each((i, el) => {
    const $img = $(el);
    const src = $img.attr("src") || "";

    if (src.includes("assets/images/") && !src.includes("generated/")) {
      const fileName = path.basename(src);
      const nameOnly = path.parse(fileName).name;
      const srcsetArr = [];

      // Check for responsive versions
      if (fs.existsSync(path.join(GEN_DIR, `${nameOnly}-375w.webp`))) {
        srcsetArr.push(`${GEN_BASE_PATH}${nameOnly}-375w.webp 375w`);
      }
      if (fs.existsSync(path.join(GEN_DIR, `${nameOnly}-768w.webp`))) {
        srcsetArr.push(`${GEN_BASE_PATH}${nameOnly}-768w.webp 768w`);
      }

      if (srcsetArr.length > 0) {
        $img.attr("srcset", srcsetArr.join(", "));
        $img.attr("sizes", "(max-width: 768px) 100vw, 768px");
      }
    }
  });

  // 2. Handle LCP Image (fetchpriority="high", loading="eager")
  if (yamlData.lcp_img) {
    const lcpSrcSnippet = yamlData.lcp_img;
    $(`img[src*="${lcpSrcSnippet}"]`).attr("fetchpriority", "high");
    $(`img[src*="${lcpSrcSnippet}"]`).attr("loading", "eager");
    $(`img[src*="${lcpSrcSnippet}"]`).removeAttr("decoding");
  }

  // 3. Handle LCP Background Preloads
  if (yamlData.lcp_bg_desktop) {
    const bgUrl = yamlData.lcp_bg_desktop.startsWith("http")
      ? yamlData.lcp_bg_desktop
      : yamlData.lcp_bg_desktop;

    $("head").append(
      `    <link rel="preload" as="image" href="${bgUrl}" fetchpriority="high" />\n`,
    );
  }
}

function injectFontPreloads($) {
  const fontsDir = path.join(__dirname, "assets/fonts");
  if (fs.existsSync(fontsDir)) {
    const fonts = fs.readdirSync(fontsDir).filter((f) => f.endsWith(".woff2"));
    fonts.forEach((font) => {
      $("head").prepend(
        `    <link rel="preload" as="font" type="font/woff2" href="assets/fonts/${font}" crossorigin />\n`,
      );
    });
  }
}

function minifyFile(filePath) {
  const ext = path.extname(filePath);
  let content = fs.readFileSync(filePath, "utf8");

  if (ext === ".css") {
    // Basic CSS minification
    content = content
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
      .replace(/\s+/g, " ") // Collapse whitespace
      .replace(/\s*([{}:;,])\s*/g, "$1") // Remove space around separators
      .replace(/;}/g, "}") // Remove last semicolon
      .trim();
  } else if (ext === ".js") {
    // Very basic JS minification (Avoid breaking code)
    content = content
      .replace(/\s*\/\/[^"'\n]*$/gm, "") // Remove single-line comments at end of lines
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
      .replace(/^\s*[\r\n]/gm, "") // Remove empty lines
      .trim();
  }

  fs.writeFileSync(filePath, content);
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function buildPage(pageName) {
  console.log(`Building page: ${pageName}`);
  const contentPath = path.join(__dirname, "pages", pageName, "content.html");
  if (!fs.existsSync(contentPath)) return;

  let html = fs.readFileSync(contentPath, "utf8");

  let yamlData = {};
  if (html.startsWith("---")) {
    const endMatch = html.indexOf("---", 3);
    if (endMatch !== -1) {
      const frontmatter = html.substring(3, endMatch).trim();
      frontmatter.split("\n").forEach((line) => {
        const parts = line.split(":");
        if (parts.length >= 2) {
          yamlData[parts[0].trim()] = parts.slice(1).join(":").trim();
        }
      });
      html = html.substring(endMatch + 3).trim();
    }
  }

  // Extract head content from content.html if it exists
  let pageHeadContent = "";
  const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
  if (headMatch) {
    pageHeadContent = headMatch[1];
    // Remove the original head from html to avoid duplication
    html = html.replace(/<head>[\s\S]*?<\/head>/i, "");
  }

  const componentsDir = path.join(__dirname, "shared", "components");
  const getComponent = (name) => {
    const compPath = path.join(componentsDir, `${name}.html`);
    return fs.existsSync(compPath) ? fs.readFileSync(compPath, "utf8") : "";
  };

  // Re-assemble the head with strict order (Mandated by rules)
  const headMeta = getComponent("head-meta");
  const header = getComponent("header");

  // 1. Technical Tags (Charset, Viewport)
  const technicalTags = `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />`.trim();

  // 2. Brand Tags (Title, Meta Description)
  const titleMatch = pageHeadContent.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? titleMatch[0]
    : `<title>${yamlData.title || pageName} | EZ Heat & Air</title>`;

  const metaDescMatch = pageHeadContent.match(
    /<meta\s+name="description"\s+content="([\s\S]*?)"\s*\/?>/i,
  );
  // Default meta description if missing
  const defaultDesc =
    "EZ Heat & Air offers expert HVAC services, air conditioning repair, heating installation, and plumbing in San Diego. Contact us today for reliable service!";
  const metaDesc = metaDescMatch
    ? metaDescMatch[0]
    : `<meta name="description" content="${yamlData.description || defaultDesc}" />`;

  // 3. Social Tags (OG, Twitter)
  const ogTagsMatch = pageHeadContent.match(
    /<meta\s+(property|name)="(og|twitter):[\s\S]*?"\s+content="[\s\S]*?"\s*\/?>/gi,
  );
  const ogTags = ogTagsMatch
    ? ogTagsMatch.map((t) => t.trim()).join("\n    ")
    : "";

  // 4. Other tags (clean up pageHeadContent)
  let cleanedPageHead = pageHeadContent
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[\s\S]*?\/?>/i, "")
    .replace(/<meta\s+charset="[\s\S]*?"\s*\/?>/i, "")
    .replace(/<meta\s+name="viewport"[\s\S]*?\/?>/i, "")
    .replace(
      /<meta\s+(property|name)="(og|twitter):[\s\S]*?"\s+content="[\s\S]*?"\s*\/?>/gi,
      "",
    )
    .replace(/{{head-meta}}/g, "")
    .trim();

  const finalHead = `
  <head>
    ${technicalTags}
    ${title}
    ${metaDesc}
    ${ogTags}
    ${headMeta}
    ${cleanedPageHead}
  </head>`.trim();

  // Inject the final head back into the html (assuming <html> starts the file)
  if (html.includes("<html")) {
    html = html.replace(/<html([\s\S]*?)>/i, `<html$1>\n  ${finalHead}`);
  } else {
    html = `<!doctype html>\n<html lang="en">\n  ${finalHead}\n${html}\n</html>`;
  }

  // Inject per-page purged CSS before </head> (replaces the 3 external Next.js files)
  const purgedCSSLink = `    <link rel="stylesheet" href="css/pages/${pageName === 'home' ? 'index' : pageName}.purged.css" media="print" onload="this.media='all'" />`;
  
  // Inline critical CSS if available (<14KB gzipped per project rules)
  let criticalCSSInjection = "";
  const criticalCSSPath = path.join(__dirname, "shared/css/pages", `${pageName === 'home' ? 'index' : pageName}.critical.css`);
  if (fs.existsSync(criticalCSSPath)) {
    const criticalCSS = fs.readFileSync(criticalCSSPath, "utf8");
    criticalCSSInjection = `\n    <style>\n${criticalCSS}\n    </style>`;
  }
  
  html = html.replace("</head>", `${criticalCSSInjection}${purgedCSSLink}\n  </head>`);

  // Replace markers
  html = html.replace(/{{header}}/g, header);
  // Re-run component replacement for any markers left in the body
  if (fs.existsSync(componentsDir)) {
    const components = fs
      .readdirSync(componentsDir)
      .filter((f) => f.endsWith(".html"));
    components.forEach((comp) => {
      const name = comp.replace(".html", "");
      const marker = `{{${name}}}`;
      if (html.includes(marker)) {
        html = html.split(marker).join(getComponent(name));
      }
    });
  }

  const jsModules = detectJsModules(html);
  html = html.replace("{{js_modules}}", jsModules);

  const baseUrl = "https://www.ezheatandair.com";
  const pageUrl = pageName === "home" ? "" : `${pageName}`;
  const canonicalUrl = `${baseUrl}/${pageUrl}`;
  const canonicalLink = `<link rel="canonical" href="${canonicalUrl}" />`;
  html = html.split("{{canonical}}").join(canonicalLink);

  // Flat structure: All pages at root. Assets referenced from root.
  const relPrefix = "";

  // Update paths for dist/ (Simple replacement since it's flat)
  html = html.replace(/(\.\.\/)+assets\//g, `${relPrefix}assets/`);
  html = html.replace(/(\.\.\/)+shared\//g, `${relPrefix}shared/`);
  html = html.replace(/(\.\.\/)+components\//g, `${relPrefix}components/`);
  html = html.replace(/(\.\.\/)+pages\//g, `${relPrefix}pages/`);

  // Fix local CSS reference targeting home.css
  html = html.replace(
    /href="\.\/home\.css"/g,
    `href="${relPrefix}pages/${pageName}/home.css"`,
  );
  // Fix page stylesheet if passed in frontmatter
  if (yamlData.css) {
    const cssPath = `${relPrefix}pages/${pageName}/${yamlData.css}`;
    if (!html.includes(cssPath)) {
      html = html.replace(
        "</head>",
        `    <link rel="stylesheet" href="${cssPath}" />\n  </head>`,
      );
    }
  }

  const distRootDir = path.join(__dirname, "dist");
  if (!fs.existsSync(distRootDir)) {
    fs.mkdirSync(distRootDir);
  }

  const $ = cheerio.load(html);

  // Apply Phase Optimization
  injectImageOptimization($, yamlData);
  injectFontPreloads($);

  const destName = pageName === "home" ? "index.html" : `${pageName}.html`;
  const distPath = path.join(distRootDir, destName);

  // Final HTML after Cheerio modifications
  let finalHtml = $.html();

  // Final path corrections on the markup
  finalHtml = finalHtml.replace(/(\.\.\/)+assets\//g, `${relPrefix}assets/`);
  finalHtml = finalHtml.replace(/(\.\.\/)+shared\//g, `${relPrefix}shared/`);
  finalHtml = finalHtml.replace(
    /(\.\.\/)+components\//g,
    `${relPrefix}components/`,
  );
  finalHtml = finalHtml.replace(/(\.\.\/)+pages\//g, `${relPrefix}pages/`);

  // Fix local CSS reference targeting home.css
  finalHtml = finalHtml.replace(
    /href="\.\/home\.css"/g,
    `href="${relPrefix}pages/${pageName}/home.css"`,
  );

  // Add defer to all script tags (project rule: all JS must be deferred)
  finalHtml = finalHtml.replace(
    /<script(\s+)(?!.*(?:defer|type="application\/ld\+json"))/g,
    '<script defer$1',
  );
  finalHtml = finalHtml.replace(
    /<script(\s+src="[^"]*")(\s*)(?!.*defer)/g,
    '<script defer$1$2',
  );

  fs.writeFileSync(distPath, finalHtml);
  console.log(`Generated ${distPath}`);
}

const args = process.argv.slice(2);
let pageToBuild = "all";
args.forEach((arg) => {
  if (arg.startsWith("--page=")) {
    pageToBuild = arg.split("=")[1];
  }
});

// Initialization: Prepare dist directory
const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Always sync assets, shared, and pages to dist (Rule compliance)
console.log("Synchronizing assets, shared, and pages to dist...");
copyDirectory(path.join(__dirname, "assets"), path.join(distDir, "assets"));
copyDirectory(path.join(__dirname, "shared"), path.join(distDir, "shared"));
copyDirectory(path.join(__dirname, "pages"), path.join(distDir, "pages"));

// Minify assets in dist
const minifyRecursively = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      minifyRecursively(fullPath);
    } else if (entry.name.endsWith(".css") || entry.name.endsWith(".js")) {
      minifyFile(fullPath);
    }
  }
};
console.log("Minifying assets in dist...");
minifyRecursively(distDir);

if (pageToBuild === "all") {
  const pagesDir = path.join(__dirname, "pages");
  if (fs.existsSync(pagesDir)) {
    fs.readdirSync(pagesDir).forEach((page) => buildPage(page));
  }
} else {
  buildPage(pageToBuild);
}
