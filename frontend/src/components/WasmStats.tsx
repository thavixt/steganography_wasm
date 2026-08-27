import { useWasm } from "../logic/hooks/useWasm";

/**
 *
 * @todo tiny line chart for memory usage
 */
export function WasmStats() {
  const { ready, error, stats, refreshIntervalMs } = useWasm();

  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="z-100 fixed bottom-0 left-0 m-4 p-2 flex flex-col gap-1 bg-gray-400 drop-shadow-lg drop-shadow-slate-700 rounded-md text-xs opacity-100 min-w-42 w-fit">
      <b>WASM runtime debug stats:</b>
      <small>(refreshed every {Math.round(refreshIntervalMs / 1000)}s)</small>
      {error ? (
        <div>Instantiation failed.</div>
      ) : (
        <>
          <div className="flex flex-col *:flex *:gap-4 *:justify-between">
            <div>
              <span>Initialized:</span>
              <span>{ready.toString()}</span>
            </div>
            <div>
              <span>Memory size:</span>
              <span>{stats.memorySize} bytes</span>
            </div>
            <div>
              <span>Stack pointer:</span>
              <span>{stats.stackPointer}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
