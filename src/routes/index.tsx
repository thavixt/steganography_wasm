import { Button } from "#components/ui/button";
import { Textarea } from "#components/ui/textarea";
import { useRef } from "react";
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
  );
}
