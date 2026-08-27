// Headless regression suite for the Go/WASM steganography engine
// (frontend/wasm/main.go). Exercises encode()/decode() the same way the
// app does, without a browser - see helpers.js for how.
//
// Run: npm test (from the project root)
// (requires `npm run wasm:build` in frontend/ to have produced an
// up-to-date frontend/public/main.wasm)

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  loadWasm,
  noopProgress: noop,
  randomImageBytes,
  decodePngBytes,
  simulateCanvasPremultiplyRoundtrip,
} = require("./helpers");

test.before(async () => {
  await loadWasm();
});

test("text round trip", () => {
  const width = 64,
    height = 64;
  const carrier = randomImageBytes(width, height);
  const secretText = "Hello, steganography! This is a test message.";
  const secretBytes = new TextEncoder().encode(secretText);

  const pngBytes = globalThis.encode(
    noop,
    carrier.buffer,
    width,
    height,
    secretBytes.buffer,
    0,
    0,
  );
  assert.ok(pngBytes, "encode(text) should return non-null");

  const { data: stegoRaw, width: w2, height: h2 } = decodePngBytes(pngBytes);
  assert.equal(w2, width);
  assert.equal(h2, height);

  const decoded = globalThis.decode(noop, stegoRaw.buffer, w2, h2, "text");
  assert.equal(decoded, secretText);
});

test("encode() rejects a secret too large for the carrier", () => {
  const width = 4,
    height = 4; // 64 bytes carrier -> tiny capacity
  const carrier = randomImageBytes(width, height);
  const secretBytes = new TextEncoder().encode(
    "This message is definitely too long to fit in a 4x4 carrier image.",
  );
  const result = globalThis.encode(
    noop,
    carrier.buffer,
    width,
    height,
    secretBytes.buffer,
    0,
    0,
  );
  assert.equal(result, null);
});

test("decode() on a random (non-stego) image reports no data, not garbage", () => {
  const width = 64,
    height = 64;
  const randomImage = randomImageBytes(width, height); // never encoded
  const decoded = globalThis.decode(
    noop,
    randomImage.buffer,
    width,
    height,
    "text",
  );
  assert.equal(decoded, null);
});

test("image-in-image round trip reconstructs the secret's exact resolution, not a carrier-aspect-ratio guess", () => {
  // The carrier is square; the secret is a wide non-square rectangle.
  // Guessing dimensions from the carrier's aspect ratio would reconstruct
  // the wrong resolution here - the secret's own dimensions are embedded in
  // the header specifically so this comes out exact.
  const width = 64,
    height = 64; // square carrier
  const carrier = randomImageBytes(width, height);
  const secretW = 16,
    secretH = 4; // 4:1 aspect ratio secret, unrelated to carrier's 1:1
  const secretBytes = randomImageBytes(secretW, secretH);

  const pngBytes = globalThis.encode(
    noop,
    carrier.buffer,
    width,
    height,
    secretBytes.buffer,
    secretW,
    secretH,
  );
  assert.ok(pngBytes, "encode(image) should return non-null");

  const { data: stegoRaw, width: w2, height: h2 } = decodePngBytes(pngBytes);
  const decoded = globalThis.decode(noop, stegoRaw.buffer, w2, h2, "image");
  assert.ok(
    decoded instanceof Uint8Array,
    "decode(image) should return a Uint8Array",
  );

  const decodedPng = decodePngBytes(decoded);
  assert.equal(decodedPng.width, secretW);
  assert.equal(decodedPng.height, secretH);
  assert.ok(
    Buffer.from(decodedPng.data).equals(Buffer.from(secretBytes)),
    "decoded pixel data should match the original secret exactly",
  );
});

test("decode() survives a simulated browser canvas alpha-premultiply round trip", () => {
  // A browser <canvas> stores pixels premultiplied by alpha internally, and
  // getImageData() un-premultiplies them back; for alpha != 255 that round
  // trip is lossy under 8-bit rounding and can flip the low bits this
  // scheme relies on. A plain PNG decode (used in the other tests here)
  // does NOT exercise this - this test does, via simulateCanvasPremultiplyRoundtrip.
  const width = 64,
    height = 64;
  const carrier = randomImageBytes(width, height);
  // Force a mix of transparency levels across the carrier, including fully
  // transparent pixels near the top-left corner (where the header lives) -
  // the scenario that originally corrupted decoding.
  for (let i = 0; i < carrier.length; i += 4) {
    const px = i / 4;
    carrier[i + 3] = px < 8 ? 0 : px % 4 === 0 ? 40 : 255;
  }
  const secretText = "Round trip through a lossy canvas alpha pipeline.";
  const secretBytes = new TextEncoder().encode(secretText);

  const pngBytes = globalThis.encode(
    noop,
    carrier.buffer,
    width,
    height,
    secretBytes.buffer,
    0,
    0,
  );
  assert.ok(
    pngBytes,
    "encode() should succeed with a partially-transparent carrier",
  );

  const { data: stegoRaw, width: w2, height: h2 } = decodePngBytes(pngBytes);
  const roundTripped = simulateCanvasPremultiplyRoundtrip(stegoRaw);

  const decoded = globalThis.decode(noop, roundTripped.buffer, w2, h2, "text");
  assert.equal(decoded, secretText);
});
