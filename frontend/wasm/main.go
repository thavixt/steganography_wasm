package main

import (
	"bytes"
	"fmt"
	"image"
	"image/png"
	"math"
	"syscall/js"
)

func main() {
	js.Global().Set("greet", js.FuncOf(greet))
	js.Global().Set("decode", js.FuncOf(decode))
	js.Global().Set("wasm_result", js.TypeString.String())
	// Keep the program running
	select {}
}

func greet(this js.Value, args []js.Value) interface{} {
	name := "curious netizen"
	if len(args) > 0 {
		name = args[0].String()
	}
	message := fmt.Sprintf("Welcome, %s - greetings from Go running in WASM! =)", name)
	return message
}

func getBytesFromLSBList(bytes []byte, progressCb js.Value) []byte {
	total := len(bytes)
	// Pre-allocate the result slice to avoid multiple reallocations.
	// Since we extract 2 bits per input byte, the total input bytes yield total * 2 bits.
	// Number of output bytes = (total * 2) / 8 = total / 4.
	decodedMessage := make([]byte, 0, total/4)

	var currentByte byte
	bitCount := 0

	for i, b := range bytes {
		// Extract the last two bits (0b11 or 3).
		// Example: if b = 0b10110101, twoBits = 0b01.
		twoBits := b & 3

		// Shift currentByte by 2 positions to make space for the new twoBits.
		// Then, OR the new twoBits into the accumulator.
		currentByte = (currentByte << 2) | twoBits
		bitCount += 2 // We've added 2 bits to currentByte.

		if bitCount == 8 {
			decodedMessage = append(decodedMessage, currentByte)
			currentByte = 0
			bitCount = 0
		}

		// Update progress 0-100% in a single pass.
		// This is much more efficient as it skips the intermediate slice.
		if !progressCb.IsUndefined() && i%(total/20+1) == 0 {
			p := (float64(i) / float64(total)) * 100
			progressCb.Invoke(p)
		}
	}

	// Handle any remaining bits if the total number of extracted bits is not a multiple of 8.
	// This left-aligns the partial byte by shifting it to fill the remaining bits with zeros.
	if bitCount > 0 {
		currentByte = currentByte << (8 - bitCount)
		decodedMessage = append(decodedMessage, currentByte)
	}

	if !progressCb.IsUndefined() {
		// Finalize progress to 100% before returning the result.
		progressCb.Invoke(100)
	}
	return decodedMessage
}

func decode(this js.Value, args []js.Value) interface{} {
	if len(args) != 5 {
		return nil
	}

	// progress indicator callback
	var progressCb js.Value = args[0]
	// image buffer
	u8 := js.Global().Get("Uint8Array").New(args[1])
	buf := make([]byte, u8.Length())
	n := js.CopyBytesToGo(buf, u8)
	// image dimensions
	width := args[2].Int()
	height := args[3].Int()
	// "text" or "image"
	decodeType := args[4].String()

	decodedBytes := getBytesFromLSBList(buf[:n], progressCb)

	if decodeType == "image" {
		if width > 0 && height > 0 {
			// Calculate new dimensions while preserving the carrier's aspect ratio.
			// We determine how many pixels we can form from the decoded bytes (RGBA = 4 bytes/pixel).
			totalDecodedPixels := len(decodedBytes) / 4
			aspectRatio := float64(width) / float64(height)

			// We solve for: newWidth * newHeight = totalDecodedPixels  AND  newWidth / newHeight = aspectRatio
			// Resulting in: newHeight = sqrt(totalDecodedPixels / aspectRatio)
			newHeight := int(math.Sqrt(float64(totalDecodedPixels) / aspectRatio))
			newWidth := int(float64(newHeight) * aspectRatio)

			// Create a new RGBA image with the calculated dimensions
			img := image.NewRGBA(image.Rect(0, 0, newWidth, newHeight))

			// Fill the image pixels with decoded bytes.
			// The copy operation will naturally only fill up to the capacity of the new image buffer.
			copy(img.Pix, decodedBytes)

			var pngBuf bytes.Buffer
			if err := png.Encode(&pngBuf, img); err == nil {
				decodedBytes = pngBuf.Bytes()
			}
		}

		// Create a Uint8Array in JS to hold the binary data
		uint8Array := js.Global().Get("Uint8Array").New(len(decodedBytes))
		// Copy Go bytes to the JS Uint8Array
		js.CopyBytesToJS(uint8Array, decodedBytes)
		return uint8Array
	}

	// Default to returning a string
	return js.ValueOf(string(decodedBytes))
}
