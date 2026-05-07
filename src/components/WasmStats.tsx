import { useWasm } from "../logic/hooks/useWasm";

/**
 *
 * @todo tiny line chart for memory usage
 */

export function WasmStats() {
  const { ready, error, stats } = useWasm();
  // const refreshInterval = WASM_STAT_UPDATE_INTERVAL_MS / 1000;

  return (
    <div className="z-100 fixed bottom-0 left-0 m-4 p-2 flex flex-col gap-1 bg-gray-900 drop-shadow-lg drop-shadow-slate-800 rounded-md text-xs opacity-35 hover:opacity-100 min-w-42 w-fit">
      <b>WASM runtime stats</b>
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
          {/* <small>(refreshed every {refreshInterval}s)</small> */}
        </>
      )}
    </div>
  );
}
