import { Button } from "#components/ui/button";
import { Card, CardContent } from "#components/ui/card";
import { Input } from "#components/ui/input";
import { Label } from "#components/ui/label";
import { Progress } from "#components/ui/progress";
import { Textarea } from "#components/ui/textarea";
import { cn } from "#lib/utils";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { useWasm } from "../logic/hooks/useWasm";
import type { StegoEncodePayloadData } from "../types";

// Payload wire format: a 4-byte length header + the secret bytes, at 2 bits
// hidden per R/G/B channel (alpha is left untouched, and forced to fully
// opaque wherever data is embedded - see main.go). So each pixel carries 3
// usable "slots" out of its 4 bytes, and each payload byte needs 4 slots.
const HEADER_BYTES = 4;
const USABLE_BYTES_PER_PIXEL = 3;
const SLOTS_PER_PAYLOAD_BYTE = 4;

function readImageFile(
  file: File,
): Promise<{ buffer: ArrayBuffer; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported."));
          return;
        }
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        resolve({
          buffer: imgData.data.buffer,
          width: imgData.width,
          height: imgData.height,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function Encode() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const carrierData = useRef<{
    buffer: ArrayBuffer;
    width: number;
    height: number;
  } | null>(null);
  const [secretImage, setSecretImage] = useState<{
    buffer: ArrayBuffer;
    width: number;
    height: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [secretType, setSecretType] = useState<"text" | "image">("text");
  const [secretText, setSecretText] = useState("");
  const [capacityBytes, setCapacityBytes] = useState(0);
  const [encodedImageUrl, setEncodedImageUrl] = useState<string | null>(null);
  const wasm = useWasm();

  useEffect(() => {
    return () => {
      if (encodedImageUrl) URL.revokeObjectURL(encodedImageUrl);
    };
  }, [encodedImageUrl]);

  const onCarrierInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) {
      toast.error("Invalid or empty file selection.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, img.width, img.height);
          carrierData.current = {
            buffer: imgData.data.buffer,
            width: imgData.width,
            height: imgData.height,
          };
          const usableSlots =
            (imgData.data.byteLength / 4) * USABLE_BYTES_PER_PIXEL;
          setCapacityBytes(
            Math.max(
              0,
              Math.floor(usableSlots / SLOTS_PER_PAYLOAD_BYTE) - HEADER_BYTES,
            ),
          );
        }
        toast.success("Carrier image loaded.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onSecretImageInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    try {
      const image = await readImageFile(file);
      setSecretImage(image);
      toast.success("Secret image loaded.");
    } catch (err) {
      const error = err as Error;
      toast.error(error.message);
    }
  };

  const secretByteLength =
    secretType === "text"
      ? new TextEncoder().encode(secretText).byteLength
      : (secretImage?.buffer.byteLength ?? 0);
  const overCapacity = secretByteLength > 0 && secretByteLength > capacityBytes;

  const wasm_encode = async () => {
    try {
      setLoading(true);
      setProgress(0);
      if (!carrierData.current) {
        throw new Error("Load a carrier image to encode into.");
      }

      let secretBuffer: ArrayBuffer;
      let secretWidth = 0;
      let secretHeight = 0;
      if (secretType === "text") {
        if (!secretText) {
          throw new Error("Enter some text to hide.");
        }
        secretBuffer = new TextEncoder().encode(secretText)
          .buffer as ArrayBuffer;
      } else {
        if (!secretImage) {
          throw new Error("Load an image to hide.");
        }
        secretBuffer = secretImage.buffer;
        secretWidth = secretImage.width;
        secretHeight = secretImage.height;
      }

      if (secretBuffer.byteLength > capacityBytes) {
        throw new Error(
          "The secret data is too large to fit in the carrier image.",
        );
      }

      const encodingTask = () => {
        return new Promise<ArrayBuffer>((resolve, reject) => {
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

          if (!carrierData.current) {
            throw new Error("Carrier image not found");
          }
          const payload: StegoEncodePayloadData = {
            carrierBuffer: carrierData.current.buffer,
            width: carrierData.current.width,
            height: carrierData.current.height,
            secretBuffer,
            secretWidth,
            secretHeight,
          };
          worker.postMessage({
            type: "encode-image",
            payload,
          });
        });
      };

      const promise = toast.promise(encodingTask(), {
        success: "Data successfully hidden in the image.",
        loading: "Encoding image...",
      });
      const result = await promise.unwrap();

      const blob = new Blob([result], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      setEncodedImageUrl(url);
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
              <Label htmlFor="carrier">Carrier image:</Label>
              <Input
                disabled={loading}
                className="shadow-md"
                type="file"
                name="carrier"
                id="carrier"
                onChange={onCarrierInput}
              />
              {capacityBytes > 0 ? (
                <span className="text-xs text-gray-700">
                  Capacity: {capacityBytes.toLocaleString()} bytes
                  {secretByteLength > 0 ? (
                    <>
                      {" "}
                      &mdash; secret:{" "}
                      <span className={cn(overCapacity && "text-red-600")}>
                        {secretByteLength.toLocaleString()} bytes
                      </span>
                    </>
                  ) : null}
                </span>
              ) : null}
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
                  disabled={!wasm.ready || overCapacity}
                  variant="outline"
                  onClick={wasm_encode}
                >
                  Encode image
                </Button>
                <div className="flex gap-2 bg-slate-200/50 p-1 rounded-md">
                  <Label>Hide:</Label>
                  <div className="flex gap-1">
                    <Button
                      variant={secretType === "text" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setSecretType("text")}
                    >
                      Text
                    </Button>
                    <Button
                      variant={secretType === "image" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setSecretType("image")}
                    >
                      Image
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>
                  {secretType === "text"
                    ? "Text to hide:"
                    : "Image to hide:"}
                </Label>
                {secretType === "text" ? (
                  <Textarea
                    disabled={loading}
                    value={secretText}
                    onChange={(e) => setSecretText(e.currentTarget.value)}
                    className="w-80 h-80 bg-gray-300 border-0 shadow-md"
                    placeholder="Enter the secret message to hide in the carrier image"
                  />
                ) : (
                  <div className="w-80 h-80 bg-gray-300 border border-gray-400 shadow-md rounded-md flex flex-col items-center justify-center gap-2 p-4">
                    <Input
                      disabled={loading}
                      className="shadow-md"
                      type="file"
                      onChange={onSecretImageInput}
                    />
                    <span className="text-xs text-gray-600 text-center">
                      The secret image must fit within the carrier's
                      capacity. Its dimensions are hidden alongside it, so
                      decode reconstructs it at its original size.
                    </span>
                  </div>
                )}
              </div>
              {overCapacity ? (
                <span className="text-red-600 text-xs">
                  The secret is too large for this carrier image.
                </span>
              ) : null}
              {encodedImageUrl ? (
                <div className="flex flex-col gap-2 items-start">
                  <Label>Encoded image:</Label>
                  <img
                    src={encodedImageUrl}
                    alt="Encoded"
                    className="w-40 h-40 object-contain bg-gray-300 border border-gray-400 shadow-md rounded-md"
                    style={{ imageRendering: "pixelated" }}
                  />
                  <Button asChild variant="secondary" size="sm">
                    <a href={encodedImageUrl} download="stego.png">
                      Download
                    </a>
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
