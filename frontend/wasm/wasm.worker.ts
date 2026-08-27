import "../public/wasm_exec";
import type {
  StegoEncodePayloadData,
  StegoImagePayloadData,
  StegoMethodType,
} from "../src/types";
import type { IGolang } from "../src/window";

declare const Go: IGolang["Go"];
const go = new Go();
const self = globalThis.self as IGolang;
// const origin = globalThis.self.origin;

async function init() {
  const response = await fetch("/main.wasm");
  const buffer = await response.arrayBuffer();
  const obj = await WebAssembly.instantiate(buffer, go.importObject);
  go.run(obj.instance);
}

const readyPromise = init();

onmessage = async (event: MessageEvent) => {
  await readyPromise;
  const type = event.data.type as StegoMethodType;

  try {
    if (type === "decode-image") {
      const payload = event.data.payload as StegoImagePayloadData;
      const result = self.decode(
        (percent: number) => {
          postMessage({ type: "progress", payload: percent });
        },
        payload.buffer,
        payload.width,
        payload.height,
        payload.decodeType,
      );

      if (result === null) {
        throw new Error(
          "No hidden data found in this image (or the image was not a valid stego image).",
        );
      }

      console.log("input", lengthOf(payload.buffer));
      // If the Go WASM module returned a Uint8Array (the PNG file bytes),
      // we extract the buffer to pass it to the main thread as an ArrayBuffer.
      const isImage =
        payload.decodeType === "image" && result instanceof Uint8Array;
      const finalPayload = isImage ? result.buffer : result;
      const transfer = isImage ? [finalPayload as ArrayBuffer] : [];
      console.log("output", lengthOf(result));

      // @ts-expect-error this function signature is wrong?!
      postMessage({ type: "success", payload: finalPayload }, transfer);
    } else if (type === "encode-image") {
      const payload = event.data.payload as StegoEncodePayloadData;
      const result = self.encode(
        (percent: number) => {
          postMessage({ type: "progress", payload: percent });
        },
        payload.carrierBuffer,
        payload.width,
        payload.height,
        payload.secretBuffer,
        payload.secretWidth,
        payload.secretHeight,
      );

      if (result === null) {
        throw new Error(
          "The secret data is too large to fit in the carrier image.",
        );
      }

      const isUint8Array = result instanceof Uint8Array;
      const finalPayload = isUint8Array
        ? (result as unknown as Uint8Array).buffer
        : result;
      const transfer = [finalPayload as ArrayBuffer];

      // @ts-expect-error this function signature is wrong?!
      postMessage({ type: "success", payload: finalPayload }, transfer);
    } else {
      throw new Error(`Error - unrecognized method type "${type}"`);
    }
  } catch (err) {
    postMessage({
      type: "error",
      payload: err instanceof Error ? err.message : String(err),
    });
  }
};

const lengthOf = (value: string | ArrayBuffer): number => {
  if (typeof value === "string") {
    return value.length;
  }
  return value.byteLength;
};
