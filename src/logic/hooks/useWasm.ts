import { useContext } from "react";
import { WasmContext } from "../context/WasmContext";
import type { WasmContextType } from "../context/WasmProvider";

export function useWasm(): WasmContextType {
  const context = useContext(WasmContext);
  if (context === undefined) {
    throw new Error("useWasm must be used within a WasmProvider");
  }
  return context;
}
