import { injectManifest } from "workbox-build";

let workboxConfig = {
  globDirectory: "build",
  globPatterns: ["favicon.ico", "index.html", "privacy.html", "assets/**/*", "images/icons/*","manifest.webmanifest"],
  globIgnores: [
    "**/*.map",
    "**/*.txt"
  ],

  swSrc: "src/sw/service-worker.js",
  swDest: "build/sw.js",

  // Vite uses content hashes in filenames (e.g. index-BxK3a1F2.js)
  dontCacheBustURLsMatching: new RegExp("\\.[a-f0-9]{8}\\."),

  // By default, Workbox will not cache files larger than 2Mb (might be an issue for dev builds)
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4Mb
};

injectManifest(workboxConfig).then(({ count, size }) => {
  console.log(
    `Generated ${workboxConfig.swDest}, which will precache ${count} files, totaling ${size} bytes.`
  );
});