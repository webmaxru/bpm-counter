const { injectManifest } = require("workbox-build");

let workboxConfig = {
  globDirectory: "build",
  globPatterns: ["favicon.ico", "index.html", "privacy.html", "static/**/*", "images/icons/*","manifest.webmanifest"],
  globIgnores: [
    "**/*.map",
    "**/*.txt"
  ],

  swSrc: "src/sw/service-worker.js",
  swDest: "build/sw.js",

  // React takes care of cache busting for JS and CSS (in prod mode)
  dontCacheBustURLsMatching: new RegExp(".+.chunk.(?:js|css)"),

  // By default, Workbox will not cache files larger than 2Mb (might be an issue for dev builds)
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4Mb
};

injectManifest(workboxConfig).then(({ count, size }) => {
  console.log(
    `Generated ${workboxConfig.swDest}, which will precache ${count} files, totaling ${size} bytes.`
  );
});