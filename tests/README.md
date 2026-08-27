# WASM steganography engine tests

Headless Node scripts that exercise `frontend/wasm/main.go`'s compiled
`encode()`/`decode()` directly, without a browser - by loading the same
`wasm_exec.js` + `main.wasm` the app itself uses.

This isn't its own npm package - `pngjs` (the only dependency, used to
read/write PNGs) lives in the project root's `package.json`, and all the
scripts here run via the root's `npm` scripts.

## Setup

From the project root:

```sh
npm install
cd frontend && npm run wasm:build && cd ..   # (re)builds frontend/public/main.wasm from main.go
```

Re-run `npm run wasm:build` after any change to `frontend/wasm/main.go` -
these scripts load whatever `main.wasm` currently exists on disk, and won't
warn you if it's stale.

## Scripts (run from the project root)

- `npm test` (`tests/encode-decode.test.js`, via Node's built-in
  `node:test` runner) - the regression suite. Text and image round trips,
  oversized-secret rejection, non-stego images reporting no data instead of
  garbage, mismatched-aspect-ratio image reconstruction, and robustness
  against a browser canvas's alpha-premultiply rounding.

- `npm run test:generate-images` (`tests/generate-test-images.js`) -
  (re)generates the PNGs in `test_images/` used both by the scripts below
  and for manual testing in the actual app (`/encode`, `/decode`).

- `npm run test:investigate:alpha` (`tests/investigate-alpha-region.js`) -
  diagnostic, not pass/fail. Measures exactly how much of a transparent
  carrier's alpha channel gets forced opaque by encoding a secret into it
  (should be just the embedded region, not the whole image), and diffs a
  decoded secret image against the original byte-for-byte.

- `npm run test:investigate:cross-carrier-text`
  (`tests/repro-cross-carrier-text.js`) - diagnostic, not pass/fail. Hides
  `"testing"` in each carrier and decodes it back, with and without a
  simulated canvas round trip. Written to chase a report of "testing"
  decoding back corrupted in the real app; it does NOT reproduce here,
  which points at something outside `main.go` itself - most likely a stale
  `main.wasm` cached in the browser from an earlier build (encode and
  decode must agree on the exact binary's header format).

`tests/helpers.js` has the shared loading/comparison utilities the scripts
above are built from - reuse it for new tests or investigation scripts
rather than re-deriving the WASM-loading boilerplate.

## Why headless, not a real browser

There's no headless-browser tooling (Playwright/`chromium-cli`/etc.) wired
up in this environment. These scripts substitute for that by simulating the
one browser behavior that actually matters here - `<canvas>`'s
premultiplied-alpha storage - via `simulateCanvasPremultiplyRoundtrip` in
`helpers.js`. That's an approximation, not a real browser; anything that
doesn't reproduce headlessly but does in the app is worth treating as
genuinely browser-specific (see `repro-cross-carrier-text.js`) rather than
assumed fixed.
