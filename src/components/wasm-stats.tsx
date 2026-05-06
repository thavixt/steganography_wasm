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

export function WasmStats({
  stats: { memorySize, stackPointer },
}: {
  stats: WasmStats;
}) {
  return (
    <div className="fixed top-0 left-0 m-4 p-1 bg-slate-600 rounded-md text-xs opacity-50 min-w-42 w-fit">
      <b>WASM runtime</b>
      <div className="flex flex-col *:flex *:gap-4">
        <div>
          <span>Memory size:</span>
          <span>{memorySize} bytes</span>
        </div>
        <div>
          <span>Stack pointer:</span>
          <span>byte {stackPointer}</span>
        </div>
      </div>
    </div>
  );
}
