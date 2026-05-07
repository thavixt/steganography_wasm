import { Button } from "#components/ui/button";
import { Card, CardContent } from "#components/ui/card";
import { Input } from "#components/ui/input";
import { Label } from "#components/ui/label";
import { Progress } from "#components/ui/progress";
import { Textarea } from "#components/ui/textarea";
import { cn } from "#lib/utils";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useWasm } from "../logic/hooks/useWasm";

export function Decode() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageBuffer = useRef<ArrayBuffer>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const wasm = useWasm();

  const onImageInput: React.ReactEventHandler<HTMLInputElement> = (e) => {
    const file = e.currentTarget.files?.[0];
    if (!file) {
      toast.error("Invalid or empty file selection.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    // Read file as DataURL for display
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas size to match original image dimensions for accurate pixel data
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image with aspect ratio preserved
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0);

          // Extract raw pixel data from canvas
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          imageBuffer.current = imageData.data.buffer;
          console.log(
            "Pixel data length:",
            imageBuffer.current.byteLength,
            imageBuffer.current,
          );
        }
        toast.success("Image file loaded.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const wasm_decode = async () => {
    setLoading(true);
    setProgress(0);
    try {
      if (!imageBuffer.current) {
        throw new Error("Load an image to the canvas to decode.");
      }
      const result = window.decode(new Uint8Array(imageBuffer.current));
      console.log(result, typeof result);
      if (!outputRef.current) {
        throw new Error("Output text area not found.");
      }

      // @todo actual progress feedback from wasm
      setProgress(25);
      await new Promise((res) => setTimeout(res, 1000));
      setProgress(50);
      await new Promise((res) => setTimeout(res, 1000));
      setProgress(75);
      await new Promise((res) => setTimeout(res, 1000));

      toast.success("Text decoded from image data.");
      outputRef.current.value = result;
    } catch (e) {
      const error = e as Error;
      toast.error(error.message);
      console.error(e);
    } finally {
      setProgress(100);
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center gap-4">
      <div className="flex gap-1 items-center justify-center">
        <span className={cn("text-xs opacity-0", { "opacity-100": loading })}>
          {progress}%
        </span>
        <Progress
          value={progress}
          className={cn("bg-slate-400 w-xl opacity-0", {
            "animate-pulse opacity-100!": loading,
          })}
        />
      </div>
      <div className="flex gap-12 justify-center items-center">
        <Card className="bg-gray-400">
          <CardContent className="flex flex-col gap-4 items-start">
            <div className="flex flex-col gap-2">
              <Label htmlFor="image">Input image:</Label>
              <Input
                disabled={loading}
                className="shadow-md"
                type="file"
                name="image"
                id="image"
                onChange={onImageInput}
              />
            </div>
            <div className="p-2 bg-gray-300 border border-gray-400 shadow-md rounded-md size-80 flex items-center justify-center gap-12">
              <canvas
                ref={canvasRef}
                className="h-full w-full"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-400">
          <CardContent>
            <div className="flex flex-col gap-4 items-start">
              <Button
                loading={loading}
                disabled={!wasm.ready}
                variant="outline"
                onClick={wasm_decode}
              >
                Decode image
              </Button>
              <div className="flex flex-col gap-2">
                <Label>Decoded text content:</Label>
                <Textarea readOnly ref={outputRef} className="w-82 h-80" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
