package main

import (
	"bytes"
	"fmt"
	"image"
	"image/png"
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

func readLSB(bytes []byte, progressCb js.Value) []byte {
	var messageBits []byte
	total := len(bytes)

	for i, b := range bytes {
		// Extract the least significant bit (LSB)
		bit := b & 1
		messageBits = append(messageBits, bit)

		// Update progress every 5% to avoid over-calling the JS bridge
		if !progressCb.IsUndefined() && i%(total/20+1) == 0 {
			progressCb.Invoke(float64(i) / float64(total) * 50) // First 50% for bit extraction
		}
	}

	var decodedMessage []byte
	var currentByte byte
	bitCount := 0

	for _, bit := range messageBits {
		currentByte = (currentByte << 1) | bit
		bitCount++
		if bitCount == 8 {
			decodedMessage = append(decodedMessage, currentByte)
			currentByte = 0
			bitCount = 0
			// Update progress for the remaining 50% (decoding phase)
			if !progressCb.IsUndefined() && len(decodedMessage)%(len(messageBits)/8/10+1) == 0 {
				p := 50 + (float64(len(decodedMessage)) / float64(len(messageBits)/8) * 50)
				progressCb.Invoke(p)
			}
		}
	}

	if !progressCb.IsUndefined() {
		progressCb.Invoke(100)
	}
	return decodedMessage
}

func decode(this js.Value, args []js.Value) interface{} {
	if len(args) != 5 {
		return nil
	}

	// progress indicator callback
	var progressCb js.Value
	progressCb = args[0]

	// image buffer
	imageBuffer := args[1]

	// image dimensions
	width := args[2].Int()
	height := args[3].Int()

	// "text" or "image"
	decodeType := args[4].String()

	u8 := js.Global().Get("Uint8Array").New(imageBuffer)
	buf := make([]byte, u8.Length())
	n := js.CopyBytesToGo(buf, u8)
	decodedBytes := readLSB(buf[:n], progressCb)

	if decodeType == "image" {
		if width > 0 && height > 0 {
			// Create a new RGBA image with the provided dimensions
			img := image.NewRGBA(image.Rect(0, 0, width, height))

			// Fill the image pixels with decoded bytes.
			// Note: image.RGBA.Pix expects [R, G, B, A, R, G, B, A...]
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
