declare global {
  interface Window {
    Go: typeof Go;
    callWasm: () => void;
    greet: (name: string) => string;
    decode: (buffer: Uint8Array<ArrayBuffer>) => string;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare class Go {
  constructor();

  argv: string[];
  env: Record<string, string>;
  exit: (code: number) => void;
  importObject: WebAssembly.Imports;

  run(instance: WebAssembly.Instance): Promise<void>;
  _resume(): void;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  _makeFuncWrapper(id: number): Function;
}

export { };

