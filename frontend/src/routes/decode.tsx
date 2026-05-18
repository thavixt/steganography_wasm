import { Button } from "#components/ui/button";
import { Card, CardContent } from "#components/ui/card";
import { Input } from "#components/ui/input";
import { Label } from "#components/ui/label";
import { Progress } from "#components/ui/progress";
import { Textarea } from "#components/ui/textarea";
import { cn } from "#lib/utils";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useWasm } from "../logic/hooks/useWasm";
import type { StegoImagePayloadData } from "../types";

export function Decode() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageData = useRef<StegoImagePayloadData | null>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [decodeType, setDecodeType] = useState<"text" | "image">("text");
  const [decodedImageUrl, setDecodedImageUrl] = useState<string | null>(null);
  const wasm = useWasm();

  // Cleanup decoded image URL when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (decodedImageUrl) URL.revokeObjectURL(decodedImageUrl);
    };
  }, [decodedImageUrl]);

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
          const imgData = ctx.getImageData(0, 0, img.width, img.height);
          imageData.current = {
            buffer: imgData.data.buffer,
            width: imgData.width,
            height: imgData.height,
            decodeType,
          };
          console.log("[js] image data", imageData.current);
        }
        toast.success("Image file loaded.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const wasm_decode = async () => {
    try {
      setLoading(true);
      setProgress(0);
      if (!imageData.current) {
        throw new Error("Load an image to the canvas to decode.");
      }

      const decodingTask = () => {
        return new Promise<string | ArrayBuffer>((resolve, reject) => {
          const worker = new Worker(
            new URL("../../wasm/wasm.worker.ts", import.meta.url),
            { type: "module" },
          );

          worker.onmessage = (event) => {
            const { type, payload } = event.data;
            if (type === "progress") {
              setProgress(Math.round(payload));
            }
            if (type === "success") {
              resolve(payload);
              worker.terminate();
            }
            if (type === "error") {
              reject(new Error(payload));
              worker.terminate();
            }
          };

          worker.onerror = (e) => {
            reject(e);
            worker.terminate();
          };

          if (!imageData.current) {
            throw new Error("Image to decode not found");
          }
          const buffer = imageData.current.buffer;
          const width = imageData.current.width;
          const height = imageData.current.height;
          const payload: StegoImagePayloadData = {
            buffer,
            width,
            height,
            decodeType,
          };
          console.debug("[js] start decoding", payload);
          worker.postMessage({
            type: "decode-image",
            payload,
          });
        });
      };
      const promise = toast.promise(decodingTask(), {
        success: `${decodeType === "text" ? "Text" : "Image"} successfully decoded from image.`,
        loading: "Decoding image...",
      });
      const result = await promise.unwrap();
      console.debug("[js] decode finished", { result, typeof: typeof result });

      if (decodeType === "text") {
        if (outputRef.current) {
          outputRef.current.value = result as string;
        }
        setDecodedImageUrl(null);
      } else {
        const blob = new Blob([result as ArrayBuffer], { type: "image/png" });
        const url = URL.createObjectURL(blob);
        setDecodedImageUrl(url);
      }
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
              <div className="flex gap-4 items-center">
                <Button
                  loading={loading}
                  disabled={!wasm.ready}
                  variant="outline"
                  onClick={wasm_decode}
                >
                  Decode image
                </Button>
                <div className="flex gap-2 bg-slate-200/50 p-1 rounded-md">
                  <Label>Output to:</Label>
                  <div className="flex gap-1">
                    <Button
                      variant={decodeType === "text" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setDecodeType("text")}
                    >
                      Text
                    </Button>
                    <Button
                      variant={decodeType === "image" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setDecodeType("image")}
                    >
                      Image
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>
                  {decodeType === "text"
                    ? "Decoded text content:"
                    : "Decoded image:"}
                </Label>
                {decodeType === "text" ? (
                  <Textarea
                    readOnly
                    ref={outputRef}
                    className="w-80 h-80 bg-gray-300 border-0 shadow-md"
                  />
                ) : (
                  <div className="p-2 bg-gray-300 border border-gray-400 shadow-md rounded-md size-80 flex items-center justify-center overflow-hidden">
                    {decodedImageUrl ? (
                      <img
                        src={decodedImageUrl}
                        alt="Decoded"
                        className="max-h-full max-w-full object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    ) : (
                      <span className="text-gray-500 italic text-sm">
                        No image decoded yet
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
