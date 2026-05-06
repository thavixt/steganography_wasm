import { Button } from "#components/ui/button";
import { Textarea } from "#components/ui/textarea";
import { useRef } from "react";
import heroImage from "../assets/hero.png";
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
    <main className="mt-12">
      <section className="flex flex-col gap-12">
        <div className="flex flex-col items-center">
          <img src={heroImage} alt="Steganography illustration" />
          <h1>WASM Steganography</h1>
          <p>
            made by{" "}
            <a href="http://github.com/thavixt" target="_blank">
              thavixt@github
            </a>
          </p>
        </div>
        <div>
          <p>
            Select an image file and <code>decode</code> it, or{" "}
            <code>encode</code> some other data into it!
          </p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <p>
            Testing <code>go:wasm</code> with a greeting:
          </p>
          <Textarea ref={outputRef} placeholder="..." className="w-92 h-24" />
          <Button
            size="lg"
            disabled={!ready}
            type="button"
            className="counter"
            onClick={wasm_greet}
          >
            Greet me from go WASM!
          </Button>
        </div>
      </section>
    </main>
  );
}
