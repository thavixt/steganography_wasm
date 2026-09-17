import { Button } from "#components/ui/button";
import { Textarea } from "#components/ui/textarea";
import { useRef } from "react";
import { Link } from "react-router";
import { useAuth } from "../logic/hooks/useAuth";
import { useWasm } from "../logic/hooks/useWasm";

export function Index() {
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const { ready } = useWasm();
  const { auth } = useAuth();

  const wasm_greet = () => {
    if (!outputRef.current) {
      return;
    }
    if (auth?.name) {
      const result = window.greet(auth.name);
      outputRef.current.value = result;
    } else {
      const result = window.greet();
      outputRef.current.value = `${result}\nTry registering and logging in!`;
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
        <blockquote>
          <p>
            Learn more about steganography on this site by clicking{" "}
            <Link to="learn">here</Link>, or more about the techniques in
            general on{" "}
            <a href="https://wikipedia.org/wiki/Steganography" target="_blank">
              Wikipedia
            </a>
            .
          </p>
        </blockquote>
        <p>
          This project has been a long-running hobby project of mine. It's been
          through many iterations during my learning journey with several
          technologies:
        </p>
        <ol className="list-decimal ml-6">
          <li>
            a basic <em>Javascript</em>-based React app,
          </li>
          <li>
            the same with{" "}
            <a href="https://www.typescriptlang.org/" target="_blank">
              TypeScript
            </a>
            ,
          </li>
          <li>
            done with{" "}
            <a href="https://svelte.dev/" target="_blank">
              Svelte.js
            </a>
            ,
          </li>
          <li>
            using{" "}
            <a
              href="https://dotnet.microsoft.com/en-us/apps/aspnet/web-apps/blazor"
              target="_blank"
            >
              Blazor
            </a>{" "}
            (a C# desktop app framework),
          </li>
          <li>
            then{" "}
            <a href="https://wails.io/" target="_blank">
              Wails
            </a>{" "}
            (a Go desktop app framework),
          </li>
          <li>
            and now this - a React SPA written with <b>TypeScript</b>, with{" "}
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API"
              target="_blank"
            >
              WebWorkers
            </a>{" "}
            using{" "}
            <a href="https://webassembly.org/" target="_blank">
              WebAssembly
            </a>{" "}
            to process data compiled from <b>Go</b>, a <b>PHP</b>-based server,
            a <b>Postgres</b> database to store some statistics about the images
            processed, all running in some Docker containers set up on
            DigitalOcean (soon).
          </li>
        </ol>
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
