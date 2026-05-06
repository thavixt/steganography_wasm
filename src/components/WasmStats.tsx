import { useWasm } from "../logic/hooks/useWasm";

/**
 *
 * @todo tiny line chart for memory usage
 */

export function WasmStats() {
  const { ready, error, stats } = useWasm();
  if (!ready) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 m-4 p-1 bg-slate-600 rounded-md text-xs opacity-50 min-w-42 w-fit">
      <b>WASM runtime</b>
      {error ? (
        <div>Instantiation failed.</div>
      ) : (
        <div className="flex flex-col *:flex *:gap-4">
          <div>
            <span>Memory size:</span>
            <span>{stats.memorySize} bytes</span>
          </div>
          <div>
            <span>Stack pointer:</span>
            <span>byte {stats.stackPointer}</span>
          </div>
        </div>
      )}
    </div>
  );
}
