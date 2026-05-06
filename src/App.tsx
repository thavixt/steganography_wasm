import { Button } from "#components/ui/button";
import { Toaster } from "#components/ui/sonner";
import { Textarea } from "#components/ui/textarea";
import { WasmStats } from "#components/wasm-stats";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import heroImg from "./assets/hero.png";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import { initWasm } from "./logic/initWasm";

const WASM_STAT_UPDATE_INTERVAL_MS = 1000;

function App() {
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const [ready, setReady] = useState(false);
  const wasmRuntime = useRef<WebAssembly.Exports | null>(null);
  const [wasmStats, setWasmStats] = useState<WasmStats>({
    stackPointer: 0,
    memorySize: 0,
  });

  const updateWasmStats = () => {
    if (wasmRuntime.current) {
      const stats = {
        stackPointer: (wasmRuntime.current.getsp as unknown as () => number)(),
        memorySize: (wasmRuntime.current.mem as unknown as WebAssembly.Memory)
          .buffer.byteLength,
      };
      setWasmStats(stats);
    }
  };

  useEffect(() => {
    if (ready) {
      return;
    }
    (async function init() {
      wasmRuntime.current = await initWasm();
      setReady(true);
      updateWasmStats();
    })();
  }, [ready]);

  useEffect(() => {
    const timer = window.setInterval(
      updateWasmStats,
      WASM_STAT_UPDATE_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, []);

  const wasm_greet = () => {
    const result = window.greet("Peti");
    if (outputRef.current) {
      outputRef.current.value = result;
    }
  };

  return (
    <main>
      <Toaster />
      <WasmStats stats={wasmStats} />
      <section id="center">
        <br />
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>
            WASM Steganography by{" "}
            <a href="http://github.com/thavixt" target="_blank">
              thavixt@github
            </a>
          </h1>
          <p>
            Select an image file and <code>decode</code> it, or{" "}
            <code>encode</code> some other data into it!
          </p>
        </div>
        <Button
          disabled={!ready}
          type="button"
          className="counter"
          onClick={wasm_greet}
        >
          Greet me from go WASM!
        </Button>
        <Textarea ref={outputRef} placeholder="..." className="w-92 h-24" />
        <br />
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </main>
  );
}

export default App;
