import { Button } from "#components/ui/button";
import { Card, CardContent } from "#components/ui/card";
import { Input } from "#components/ui/input";
import { Label } from "#components/ui/label";
import { Textarea } from "#components/ui/textarea";
import { useRef } from "react";
import { toast } from "sonner";
import { useWasm } from "../logic/hooks/useWasm";

export function Decode() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageBuffer = useRef<ArrayBuffer>(null);
  const wasm = useWasm();
  console.log(wasm.ready);

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

  const onDecode = () => {
    console.log("onDecode");
    if (!imageBuffer.current) {
      toast.warning("Load an image to the canvas to decode.");
      return;
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex gap-12 justify-center items-center">
        <Card className="bg-gray-100">
          <CardContent className="flex flex-col gap-4 items-center justify-center">
            <div className="flex flex-col gap-1">
              <Label htmlFor="image">Input image:</Label>
              <Input
                className="shadow-md"
                type="file"
                name="image"
                id="image"
                onChange={onImageInput}
              />
            </div>
            <div className="p-2 bg-slate-200 border border-gray-400 shadow-md rounded-md size-80 flex items-center justify-center gap-12">
              <canvas
                ref={canvasRef}
                className="h-full w-full"
                style={{ imageRendering: "pixelated" }}
              ></canvas>
            </div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2 items-start">
          <Button variant="secondary" onClick={onDecode}>
            Decode image
          </Button>
          <Label>Decoded text content:</Label>
          <Textarea placeholder="..." className="w-92 h-92" />
        </div>
      </div>
    </div>
  );
}
