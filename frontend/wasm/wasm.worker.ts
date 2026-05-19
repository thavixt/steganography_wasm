import "../public/wasm_exec";
import type { StegoImagePayloadData, StegoMethodType } from "../src/types";
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
  const payload = event.data.payload as StegoImagePayloadData;

  try {
    if (type === "decode-image") {
      const result = self.decode(
        (percent: number) => {
          postMessage({ type: "progress", payload: percent });
        },
        payload.buffer,
        payload.width,
        payload.height,
        payload.decodeType,
      );

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
      throw new Error(`WIP - not yet implemented method type "${type}"`);
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
