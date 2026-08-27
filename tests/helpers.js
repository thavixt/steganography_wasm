// Shared helpers for headlessly exercising the Go/WASM steganography engine
// (frontend/wasm/main.go) under plain Node, without a browser. Loads the
// same wasm_exec.js + main.wasm the app itself uses, and provides a few
// utilities the individual test/investigation scripts share.

const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const PROJECT_ROOT = path.join(__dirname, "..");
const FRONTEND = path.join(PROJECT_ROOT, "frontend");
const IMAGES_DIR = path.join(PROJECT_ROOT, "test_images");

function waitFor(cond, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function poll() {
      if (cond()) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error("timeout"));
      setTimeout(poll, 10);
    })();
  });
}

// Loads wasm_exec.js (defines the global `Go` class) and instantiates
// frontend/public/main.wasm, then waits for encode()/decode() to appear on
// globalThis. Run `npm run wasm:build` inside frontend/ first if main.wasm
// doesn't exist yet or is out of date.
async function loadWasm() {
  const wasmPath = path.join(FRONTEND, "public", "main.wasm");
  if (!fs.existsSync(wasmPath)) {
    throw new Error(
      `${wasmPath} not found - run "npm run wasm:build" in frontend/ first.`,
    );
  }
  require(path.join(FRONTEND, "public", "wasm_exec.js"));
  const go = new Go();
  const wasmBytes = fs.readFileSync(wasmPath);
  const { instance } = await WebAssembly.instantiate(wasmBytes, go.importObject);
  go.run(instance); // never resolves (the Go program loops forever) - don't await
  await waitFor(
    () => typeof globalThis.encode === "function" && typeof globalThis.decode === "function",
  );
}

// A no-op progress callback, since encode()/decode() require one.
const noopProgress = () => {};

// Generates width*height*4 real random bytes for use as carrier/secret
// pixel data. Uses crypto, not a hand-rolled PRNG - simple LCGs have weak
// low-order bits, which would bias exactly the 2-bit-per-byte LSBs this
// code reads/writes.
function randomImageBytes(width, height) {
  const crypto = require("crypto");
  return new Uint8Array(crypto.randomBytes(width * height * 4).buffer);
}

// Reads a PNG file from test_images/ into a flat RGBA Uint8Array + dims.
function readTestImage(filename) {
  const png = PNG.sync.read(fs.readFileSync(path.join(IMAGES_DIR, filename)));
  return {
    data: new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.byteLength),
    width: png.width,
    height: png.height,
  };
}

// Decodes PNG bytes (e.g. encode()'s return value) into a flat RGBA
// Uint8Array + dims.
function decodePngBytes(bytes) {
  const png = PNG.sync.read(Buffer.from(bytes));
  return {
    data: new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.byteLength),
    width: png.width,
    height: png.height,
  };
}

// Simulates what a browser <canvas> does internally: it stores pixels
// premultiplied by alpha, and getImageData() un-premultiplies them back.
// For alpha != 255 that round trip is lossy under 8-bit rounding, and can
// flip the low bits the encode/decode LSB scheme relies on. A plain pngjs
// decode (decodePngBytes above) does NOT exercise this - use this helper to
// approximate the real browser round trip in a headless test.
function simulateCanvasPremultiplyRoundtrip(data) {
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    out[i + 3] = a;
    for (let c = 0; c < 3; c++) {
      if (a === 0) {
        out[i + c] = 0; // browsers commonly zero RGB when alpha is 0
        continue;
      }
      const premultiplied = Math.round((data[i + c] * a) / 255);
      out[i + c] = Math.min(255, Math.round((premultiplied * 255) / a));
    }
  }
  return out;
}

module.exports = {
  PROJECT_ROOT,
  FRONTEND,
  IMAGES_DIR,
  loadWasm,
  noopProgress,
  randomImageBytes,
  readTestImage,
  decodePngBytes,
  simulateCanvasPremultiplyRoundtrip,
};
