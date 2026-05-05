export async function initWasm(): Promise<WebAssembly.Exports> {
  let wasmExports = {};
  try {
    console.log("[go:wasm]", "initializing...");
    const response = await fetch('/main.wasm');
    console.debug("[go:wasm]", "response", { response });
    const buffer = await response.arrayBuffer();
    console.debug("[go:wasm]", "buffer", { buffer });

    // Create Go runtime
    console.debug("[go:wasm]", "window.Go", { go: window.Go })
    const go = new window.Go();
    const result = await WebAssembly.instantiate(buffer, go.importObject);

    wasmExports = result.instance.exports;
    console.debug("[go:wasm]", "wasmExports", { ...wasmExports })
    go.run(result.instance);
    console.log("[go:wasm]", 'initialized.');
  } catch (error) {
    console.error('Failed to initialize WASM:', error);
    document.getElementById('output')!.textContent = 'Failed to load WASM module';
  }

  return wasmExports;
}
