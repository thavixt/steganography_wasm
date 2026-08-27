// Ad-hoc investigation script (not a pass/fail test) used to diagnose two
// reported issues with real test images:
//  A) "transparency lost" when hiding secret_wide_stripes.png inside
//     carrier_transparent.png - measures exactly how much of the alpha
//     channel changed, to distinguish "the whole image went opaque" (bug)
//     from "only the embedded region did" (by design).
//  B) "a few random pixels differ" when hiding secret_wide_stripes.png
//     inside carrier_opaque.png - diffs the decoded secret against the
//     original, byte-for-byte, both with and without a simulated browser
//     canvas premultiply round trip.
//
// Run: node tests/investigate-alpha-region.js

const {
  loadWasm,
  noopProgress: noop,
  readTestImage,
  decodePngBytes,
  simulateCanvasPremultiplyRoundtrip,
} = require("./helpers");

async function main() {
  await loadWasm();

  console.log("=== A: carrier_transparent.png + secret_wide_stripes.png ===");
  {
    const carrier = readTestImage("carrier_transparent.png");
    const secret = readTestImage("secret_wide_stripes.png");

    const pngBytes = globalThis.encode(
      noop, carrier.data.buffer, carrier.width, carrier.height,
      secret.data.buffer, secret.width, secret.height,
    );
    if (!pngBytes) {
      console.log("encode() returned null (unexpected)");
    } else {
      const stego = decodePngBytes(pngBytes);
      console.log(`stego dims: ${stego.width}x${stego.height} (carrier was ${carrier.width}x${carrier.height})`);

      let changedAlphaCount = 0;
      let firstChangedPixel = -1;
      let lastChangedPixel = -1;
      let notAllOpaque = 0;
      const totalPixels = carrier.width * carrier.height;
      for (let px = 0; px < totalPixels; px++) {
        const aOrig = carrier.data[px * 4 + 3];
        const aNew = stego.data[px * 4 + 3];
        if (aOrig !== aNew) {
          changedAlphaCount++;
          if (firstChangedPixel === -1) firstChangedPixel = px;
          lastChangedPixel = px;
          if (aNew !== 255) notAllOpaque++;
        }
      }
      console.log(`alpha channel changed on ${changedAlphaCount} / ${totalPixels} pixels (${((changedAlphaCount / totalPixels) * 100).toFixed(2)}%)`);
      console.log(`changed pixel index range: [${firstChangedPixel}, ${lastChangedPixel}]`);
      console.log(`  (as x,y: first=(${firstChangedPixel % carrier.width},${Math.floor(firstChangedPixel / carrier.width)}), last=(${lastChangedPixel % carrier.width},${Math.floor(lastChangedPixel / carrier.width)}))`);
      console.log(`pixels where alpha changed but is NOT exactly 255: ${notAllOpaque}`);
    }
  }

  console.log("\n=== B: carrier_opaque.png + secret_wide_stripes.png ===");
  {
    const carrier = readTestImage("carrier_opaque.png");
    const secret = readTestImage("secret_wide_stripes.png");

    const pngBytes = globalThis.encode(
      noop, carrier.data.buffer, carrier.width, carrier.height,
      secret.data.buffer, secret.width, secret.height,
    );
    if (!pngBytes) {
      console.log("encode() returned null (unexpected)");
    } else {
      const stego = decodePngBytes(pngBytes);

      const decodedRaw = globalThis.decode(noop, stego.data.buffer, stego.width, stego.height, "image");
      const canvasRoundTripped = simulateCanvasPremultiplyRoundtrip(stego.data);
      const decodedAfterCanvas = globalThis.decode(noop, canvasRoundTripped.buffer, stego.width, stego.height, "image");

      function diffAgainstSecret(decoded, label) {
        if (!(decoded instanceof Uint8Array)) {
          console.log(`${label}: decode() did not return an image (got ${decoded})`);
          return;
        }
        const decodedPng = decodePngBytes(decoded);
        console.log(`${label}: decoded dims ${decodedPng.width}x${decodedPng.height} (secret was ${secret.width}x${secret.height})`);
        if (decodedPng.width !== secret.width || decodedPng.height !== secret.height) {
          console.log(`${label}: DIMENSION MISMATCH`);
          return;
        }
        let diffCount = 0;
        const diffs = [];
        for (let i = 0; i < decodedPng.data.length; i++) {
          if (decodedPng.data[i] !== secret.data[i]) {
            diffCount++;
            if (diffs.length < 20) {
              const px = Math.floor(i / 4);
              const channel = ["R", "G", "B", "A"][i % 4];
              diffs.push({
                x: px % secret.width,
                y: Math.floor(px / secret.width),
                channel,
                expected: secret.data[i],
                actual: decodedPng.data[i],
              });
            }
          }
        }
        console.log(`${label}: ${diffCount} byte(s) differ out of ${decodedPng.data.length}`);
        for (const d of diffs) {
          console.log(`  pixel(${d.x},${d.y}) channel=${d.channel} expected=${d.expected} actual=${d.actual} diff=${d.actual - d.expected}`);
        }
      }

      diffAgainstSecret(decodedRaw, "raw (no canvas simulation)");
      diffAgainstSecret(decodedAfterCanvas, "after simulated canvas round trip");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
