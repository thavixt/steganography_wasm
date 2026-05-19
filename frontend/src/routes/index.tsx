import { Button } from "#components/ui/button";
import { Textarea } from "#components/ui/textarea";
import { useRef } from "react";
import { Link } from "react-router";
import { useWasm } from "../logic/hooks/useWasm";

export function Index() {
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const { ready } = useWasm();

  const wasm_greet = () => {
    const result = window.greet("Peti");
    if (outputRef.current) {
      outputRef.current.value = result;
    }
  };

  return (
    <section className="flex flex-col gap-12">
      <div className="mx-auto max-w-lg flex flex-col gap-4">
        <strong>Welcome!</strong>
        <p>
          <em>Steganographix</em> is a site to decode, encode, compare
          steganographic images, and learn about steganography in general.
        </p>
        <p>
          Learn more about <i>steganography</i> on this site by clicking{" "}
          <Link to="learn">here</Link>, or more about the techniques in general{" "}
          <a href="https://wikipedia.org/wiki/Steganography">here</a>.
        </p>
        <p>
          This project has been a long-running hobby project of mine. It's been
          through many iterations during my learning journey with several
          technologies:
          <ol className="list-decimal ml-6 text-sm">
            <li>a basic Javascript-based React app,</li>
            <li>the same with Typescript,</li>
            <li>done with Svelte.js,</li>
            <li>using Blazor (a C# frontend framework),</li>
            <li>then Wails (a Go-based desktop framework),</li>
            <li>
              and now a React web app written with TypeScript, with WebWorkers
              using WebAssembly compiled from Go, a PHP-based server, a Postgres
              database to store some statistics about the images processed, all
              running in some Docker containers set up on DigitalOcean (soon).
            </li>
          </ol>
        </p>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <p>
            Test <code>[go:wasm]</code> with a welcome message:
          </p>
          <Button
            disabled={!ready}
            type="button"
            className="counter"
            onClick={wasm_greet}
          >
            Greet me!
          </Button>
        </div>
        <Textarea
          ref={outputRef}
          placeholder="Tell me your name in this input field"
          className="w-92 h-24"
        />
      </div>
    </section>
  );
}
