import { Card, CardContent } from "#components/ui/card";
import { Input } from "#components/ui/input";
import { Label } from "#components/ui/label";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

const DEFAULT_DIFF_COLOR = "#ffc0cb"; // pink

interface LoadedImage {
  imageData: ImageData;
  width: number;
  height: number;
}

function loadImageFile(
  file: File,
  canvas: HTMLCanvasElement,
): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image."));
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported."));
          return;
        }
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        resolve({ imageData, width: img.width, height: img.height });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function Compare() {
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement>(null);

  const [imageA, setImageA] = useState<LoadedImage | null>(null);
  const [imageB, setImageB] = useState<LoadedImage | null>(null);
  const [diffColor, setDiffColor] = useState(DEFAULT_DIFF_COLOR);

  const sizeMismatch =
    imageA && imageB
      ? imageA.width !== imageB.width || imageA.height !== imageB.height
      : false;

  const onImageAInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) {
      toast.error("Invalid or empty file selection.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    const canvas = canvasARef.current;
    if (!canvas) return;
    try {
      setImageA(await loadImageFile(file, canvas));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const onImageBInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) {
      toast.error("Invalid or empty file selection.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    const canvas = canvasBRef.current;
    if (!canvas) return;
    try {
      setImageB(await loadImageFile(file, canvas));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // Pure computation - no DOM access, so it can live in useMemo instead of
  // an effect. Diff pixels get the chosen color at full opacity; matching
  // pixels are fully transparent, so only the differences show.
  const diffResult = useMemo(() => {
    if (!imageA || !imageB || sizeMismatch) return null;

    const { width, height } = imageA;
    const [r, g, b] = hexToRgb(diffColor);
    const a = imageA.imageData.data;
    const bData = imageB.imageData.data;
    const out = new Uint8ClampedArray(a.length);

    let diffPixels = 0;
    for (let i = 0; i < a.length; i += 4) {
      const isDifferent =
        a[i] !== bData[i] ||
        a[i + 1] !== bData[i + 1] ||
        a[i + 2] !== bData[i + 2] ||
        a[i + 3] !== bData[i + 3];
      if (isDifferent) {
        diffPixels++;
        out[i] = r;
        out[i + 1] = g;
        out[i + 2] = b;
        out[i + 3] = 255;
      }
    }

    return {
      imageData: new ImageData(out, width, height),
      diffPixels,
      totalPixels: width * height,
    };
  }, [imageA, imageB, diffColor, sizeMismatch]);

  // Syncing the computed diff into the canvas (an external system) is
  // exactly what an effect is for.
  useEffect(() => {
    const canvas = diffCanvasRef.current;
    if (!canvas) return;
    if (!diffResult) {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }
    canvas.width = diffResult.imageData.width;
    canvas.height = diffResult.imageData.height;
    const ctx = canvas.getContext("2d");
    ctx?.putImageData(diffResult.imageData, 0, 0);
  }, [diffResult]);

  return (
    <div className="w-full h-full flex flex-col items-center gap-4">
      {sizeMismatch ? (
        <span className="text-red-600 text-sm">
          Images must be exactly the same size ({imageA?.width}x{imageA?.height}{" "}
          vs {imageB?.width}x{imageB?.height}).
        </span>
      ) : null}

      <div className="flex gap-8 justify-center items-start flex-wrap">
        <Card className="bg-gray-400">
          <CardContent className="flex flex-col gap-2 items-start">
            <Label htmlFor="image-a">Image A:</Label>
            <Input
              className="shadow-md"
              type="file"
              id="image-a"
              onChange={onImageAInput}
            />
            <div className="p-2 bg-gray-300 border border-gray-400 shadow-md rounded-md size-64 flex items-center justify-center">
              <canvas
                ref={canvasARef}
                className="max-h-full max-w-full"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-400">
          <CardContent className="flex flex-col gap-2 items-start">
            <Label htmlFor="image-b">Image B:</Label>
            <Input
              className="shadow-md"
              type="file"
              id="image-b"
              onChange={onImageBInput}
            />
            <div className="p-2 bg-gray-300 border border-gray-400 shadow-md rounded-md size-64 flex items-center justify-center">
              <canvas
                ref={canvasBRef}
                className="max-h-full max-w-full"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-400">
          <CardContent className="flex flex-col gap-2 items-start">
            <Label>Difference:</Label>
            {diffResult ? (
              <span className="text-xs text-gray-700">
                {diffResult.diffPixels.toLocaleString()} /{" "}
                {diffResult.totalPixels.toLocaleString()} pixels differ (
                {(
                  (diffResult.diffPixels / diffResult.totalPixels) *
                  100
                ).toFixed(2)}
                %)
              </span>
            ) : (
              <span className="text-xs text-gray-600 italic">
                Load two same-size images to compare.
              </span>
            )}
            <div
              className="p-2 border border-gray-400 shadow-md rounded-md size-64 flex items-center justify-center"
              style={{
                backgroundImage:
                  "repeating-conic-gradient(#d1d5db 0% 25%, #e5e7eb 0% 50%)",
                backgroundSize: "16px 16px",
              }}
            >
              <canvas
                ref={diffCanvasRef}
                className="max-h-full max-w-full"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
            <div className="flex gap-2 items-center">
              Color:{" "}
              <Input
                id="diff-color"
                type="color"
                className="w-16 h-8 p-0.5"
                value={diffColor}
                onChange={(e) => setDiffColor(e.currentTarget.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
