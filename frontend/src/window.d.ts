declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window extends IGolang { }
}

export interface IGolang {
  Go: typeof Go;
  callWasm: () => void;
  greet: (name: string) => string;
  decode: (
    onProgress: (percent: number) => void,
    buffer: ArrayBuffer,
    width: number,
    height: number,
    type: "text" | "image",
  ) => Promise<string | ArrayBuffer>;
}

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
