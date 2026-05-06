import { createContext } from "react";
import type { WasmContextType } from "./WasmProvider";

export const WasmContext = createContext<WasmContextType | undefined>(
  undefined,
);
