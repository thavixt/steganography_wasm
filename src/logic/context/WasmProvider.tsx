import { type ReactNode, useCallback, useEffect, useState } from "react";
import { initWasm } from "../initWasm";
import { WasmContext } from "./WasmContext";

export const WASM_STAT_UPDATE_INTERVAL_MS = 5000;

/**
 * Some stats about the active WASM instance
 */
export interface WasmStats {
  /**
   * Current memory buffer size in bytes
   */
  memorySize: number;
  /**
   * Current stack pointer
   */
  stackPointer: number;
}

export interface WasmContextType {
  wasm: WebAssembly.Exports | null;
  ready: boolean;
  error: string | null;
  stats: WasmStats;
}

export function WasmProvider({ children }: { children: ReactNode }) {
  const [wasm, setWasm] = useState<WebAssembly.Exports | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<WasmStats>({
    stackPointer: 0,
    memorySize: 0,
  });

  const updateWasmStats = useCallback(() => {
    if (wasm) {
      const stats = {
        stackPointer: (wasm.getsp as unknown as () => number)(),
        memorySize: (wasm.mem as unknown as WebAssembly.Memory).buffer
          .byteLength,
      };
      setStats(stats);
    }
  }, [wasm]);

  useEffect(() => {
    if (ready) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      updateWasmStats();
    }
  }, [ready, updateWasmStats, wasm]);

  useEffect(() => {
    const timer = window.setInterval(
      updateWasmStats,
      WASM_STAT_UPDATE_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [updateWasmStats]);

  useEffect(() => {
    (async function init() {
      try {
        const wasmInstance = await initWasm();
        setWasm(wasmInstance);
        setReady(true);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to initialize WASM";
        setError(errorMessage);
        console.error("WASM initialization error:", err);
      }
    })();
  }, []);

  return (
    <WasmContext.Provider value={{ wasm, ready, error, stats }}>
      {children}
    </WasmContext.Provider>
  );
}
