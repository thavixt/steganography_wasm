// Regenerates the PNG files in test_images/ used for manual browser testing
// and by investigate-alpha-region.js / repro-cross-carrier-text.js.
//
// Run: node tests/generate-test-images.js

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const { IMAGES_DIR } = require("./helpers");

function writePng(filename, width, height, fill) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const [r, g, b, a] = fill(x, y);
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const outPath = path.join(IMAGES_DIR, filename);
  fs.writeFileSync(outPath, PNG.sync.write(png));
  console.log("wrote", outPath, `${width}x${height}`);
}

// 1. General-purpose opaque carrier: a smooth diagonal color gradient.
// Plenty of capacity (256x256 -> ~49KB usable) for hiding text or a small image.
writePng("carrier_opaque.png", 256, 256, (x, y) => [
  Math.floor((x / 255) * 255),
  Math.floor((y / 255) * 255),
  Math.floor(((x + y) / 510) * 255),
  255,
]);

// 2. Carrier with a transparency gradient (alpha 0 -> 255, left to right),
// including fully-transparent pixels at the top-left corner - exactly where
// the embedded header lives. This is the scenario that originally corrupted
// decoding via a browser <canvas> premultiply/un-premultiply round trip.
writePng("carrier_transparent.png", 256, 256, (x, y) => [
  Math.floor((x / 255) * 255),
  Math.floor((y / 255) * 255),
  200,
  Math.floor((x / 255) * 255),
]);

// 3. Secret image with a non-square (4:1) aspect ratio: distinct colored
// horizontal stripes, so a wrong reconstructed resolution (e.g. squashed to
// square, a carrier-aspect-ratio guess) is obvious at a glance.
const STRIPE_COLORS = [
  [230, 60, 60],
  [60, 200, 90],
  [70, 110, 230],
  [230, 200, 60],
];
writePng("secret_wide_stripes.png", 64, 16, (x, y) => {
  const [r, g, b] = STRIPE_COLORS[Math.floor((y / 16) * STRIPE_COLORS.length)];
  return [r, g, b, 255];
});

// 4. Secret image that itself has transparency: a solid circle on a fully
// transparent background - checks that hiding + recovering a secret with
// its own alpha channel still works.
writePng("secret_icon_transparent.png", 32, 32, (x, y) => {
  const dx = x - 15.5;
  const dy = y - 15.5;
  const inCircle = dx * dx + dy * dy <= 14 * 14;
  return inCircle ? [255, 120, 40, 255] : [0, 0, 0, 0];
});

console.log("done");
