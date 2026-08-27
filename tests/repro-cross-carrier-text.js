// Ad-hoc investigation script (not a pass/fail test) that hides the text
// "testing" in each of the test carriers and decodes it back, both with and
// without a simulated browser canvas round trip. Written to check a report
// of "testing" decoding back as "tqwuing<garbage>" in the actual app - this
// does NOT reproduce it, which points at something outside main.go itself
// (most likely a stale cached frontend/public/main.wasm in the browser from
// an earlier build, since encode and decode must agree on the header format
// baked into that binary).
//
// Run: node tests/repro-cross-carrier-text.js

const {
  loadWasm,
  noopProgress: noop,
  readTestImage,
  decodePngBytes,
  simulateCanvasPremultiplyRoundtrip,
} = require("./helpers");

async function main() {
  await loadWasm();

  const secretText = "testing";
  const secretBytes = new TextEncoder().encode(secretText);

  for (const carrierFile of ["carrier_opaque.png", "carrier_transparent.png"]) {
    const carrier = readTestImage(carrierFile);
    const pngBytes = globalThis.encode(
      noop, carrier.data.buffer, carrier.width, carrier.height, secretBytes.buffer, 0, 0,
    );
    const stego = decodePngBytes(pngBytes);

    const decodedRaw = globalThis.decode(noop, stego.data.buffer, stego.width, stego.height, "text");

    const roundTripped = simulateCanvasPremultiplyRoundtrip(stego.data);
    const decodedAfterCanvas = globalThis.decode(noop, roundTripped.buffer, stego.width, stego.height, "text");

    console.log(
      carrierFile,
      "-> raw:", JSON.stringify(decodedRaw),
      "| after-canvas-sim:", JSON.stringify(decodedAfterCanvas),
      "| expected:", JSON.stringify(secretText),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
