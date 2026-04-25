const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8000;
const DIST_DIR = path.join(__dirname, "dist");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".woff": "application/font-woff",
  ".ttf": "application/font-ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "application/font-otf",
  ".wasm": "application/wasm",
};

const server = http.createServer((req, res) => {
  // 1. Redirection Logic for Clean URLs
  // Redirect .html to clean
  if (req.url.endsWith(".html")) {
    const cleanUrl = req.url.replace(/\.html$/, "");
    const redirectUrl = cleanUrl === "/index" ? "/" : cleanUrl;
    res.writeHead(301, { Location: redirectUrl });
    return res.end();
  }

  // Redirect trailing slashes to clean (except for root /)
  if (req.url.endsWith("/") && req.url !== "/") {
    const redirectUrl = req.url.slice(0, -1);
    res.writeHead(301, { Location: redirectUrl });
    return res.end();
  }

  // 2. Serving Logic
  let url = req.url === "/" ? "/index.html" : req.url;
  let filePath = path.join(DIST_DIR, url);

  // Serve folder-less .html files if no extension provided
  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    if (fs.existsSync(filePath + ".html")) {
      filePath += ".html";
    }
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || "application/octet-stream";

  const acceptEncoding = req.headers["accept-encoding"] || "";
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        const path404 = path.join(DIST_DIR, "404.html");
        if (fs.existsSync(path404)) {
          fs.readFile(path404, (err, content404) => {
            res.writeHead(404, { "Content-Type": "text/html" });
            res.end(content404 || "404 Not Found", "utf-8");
          });
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("404 Not Found");
        }
      } else {
        res.writeHead(500);
        res.end(
          `Sorry, check with the site admin for error: ${error.code} ..\n`,
        );
      }
    } else {
      // 3. Compression Logic (Gzip)
      const headers = { "Content-Type": contentType };
      if (
        acceptEncoding.includes("gzip") &&
        (contentType.includes("text") ||
          contentType.includes("javascript") ||
          contentType.includes("json"))
      ) {
        const zlib = require("zlib");
        zlib.gzip(content, (err, buffer) => {
          if (!err) {
            res.writeHead(200, { ...headers, "Content-Encoding": "gzip" });
            res.end(buffer);
          } else {
            res.writeHead(200, headers);
            res.end(content, "utf-8");
          }
        });
      } else {
        res.writeHead(200, headers);
        res.end(content, "utf-8");
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
