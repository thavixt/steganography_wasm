package main

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"image"
	"image/png"
	"math"
	"syscall/js"
)

// The payload embedded in a carrier image is a 12-byte big-endian header -
// secret width, secret height (both 0 for a text secret), and the byte
// length of the secret that follows - then the secret bytes themselves.
// Embedding the secret image's own dimensions lets decode() reconstruct it
// exactly, instead of guessing a size from the carrier's aspect ratio (which
// is only right when the secret happens to share it).
//
// Only the R, G and B channels of each pixel are used to carry data (2 bits
// per channel) - the alpha channel is left alone, and every pixel touched by
// the payload has its alpha forced to fully opaque (255) in the output.
// This matters because a browser <canvas> stores pixels with premultiplied
// alpha internally; reading them back via getImageData() un-premultiplies
// them, and that round trip is only lossless when alpha is exactly 255 -
// for any lower alpha, 8-bit rounding can flip the low bits this scheme
// relies on, corrupting the embedded data as soon as the stego image is
// reloaded into a canvas (e.g. on the decode page).
const headerWidthBytes = 4
const headerHeightBytes = 4
const headerLengthBytes = 4
const headerBytes = headerWidthBytes + headerHeightBytes + headerLengthBytes

// carrierSlotIndex maps the n-th usable (R/G/B) 2-bit slot to its raw byte
// index in an RGBA carrier buffer: every group of 4 raw bytes (one pixel)
// contributes 3 usable slots (R, G, B), skipping the 4th (A).
func carrierSlotIndex(slot int) int {
	group := slot / 3
	offset := slot % 3
	return group*4 + offset
}

// requiredCarrierLen returns how many raw carrier bytes are needed to hold
// `slots` 2-bit slots.
func requiredCarrierLen(slots int) int {
	if slots <= 0 {
		return 0
	}
	return carrierSlotIndex(slots-1) + 1
}

func main() {
	js.Global().Set("greet", js.FuncOf(greet))
	js.Global().Set("decode", js.FuncOf(decode))
	js.Global().Set("encode", js.FuncOf(encode))
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

// extractLSBBytes reads `count` bytes out of carrier's R/G/B least-significant
// 2 bits, starting at slot `slotOffset`. 4 slots (i.e. 4 R/G/B channels,
// spread across up to 4 pixels) are consumed per output byte.
func extractLSBBytes(carrier []byte, slotOffset int, count int, progressCb js.Value) []byte {
	out := make([]byte, count)
	for i := 0; i < count; i++ {
		var b byte
		for j := 0; j < 4; j++ {
			idx := carrierSlotIndex(slotOffset + i*4 + j)
			b = (b << 2) | (carrier[idx] & 3)
		}
		out[i] = b

		if !progressCb.IsUndefined() && count > 0 && i%(count/20+1) == 0 {
			progressCb.Invoke((float64(i) / float64(count)) * 100)
		}
	}
	if !progressCb.IsUndefined() {
		progressCb.Invoke(100)
	}
	return out
}

// embedLSBBytes writes `payload` into the least-significant 2 bits of
// carrier's R/G/B channels (4 slots per payload byte), forces the alpha
// channel of every touched pixel to 255, and returns a copy of carrier with
// those bits changed.
func embedLSBBytes(carrier []byte, payload []byte, progressCb js.Value) []byte {
	out := make([]byte, len(carrier))
	copy(out, carrier)

	total := len(payload)
	for i, b := range payload {
		base := i * 4
		out[carrierSlotIndex(base+0)] = (out[carrierSlotIndex(base+0)] &^ 3) | ((b >> 6) & 3)
		out[carrierSlotIndex(base+1)] = (out[carrierSlotIndex(base+1)] &^ 3) | ((b >> 4) & 3)
		out[carrierSlotIndex(base+2)] = (out[carrierSlotIndex(base+2)] &^ 3) | ((b >> 2) & 3)
		out[carrierSlotIndex(base+3)] = (out[carrierSlotIndex(base+3)] &^ 3) | (b & 3)

		if !progressCb.IsUndefined() && total > 0 && i%(total/20+1) == 0 {
			progressCb.Invoke((float64(i) / float64(total)) * 100)
		}
	}
	if !progressCb.IsUndefined() {
		progressCb.Invoke(100)
	}

	// Force full opacity on every pixel touched by the payload (see the
	// package comment on headerBytes for why).
	touchedBytes := requiredCarrierLen(total * 4)
	touchedGroups := (touchedBytes + 3) / 4
	for g := 0; g < touchedGroups; g++ {
		alphaIdx := g*4 + 3
		if alphaIdx < len(out) {
			out[alphaIdx] = 255
		}
	}

	return out
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
	carrier := buf[:n]
	// image dimensions
	width := args[2].Int()
	height := args[3].Int()
	// "text" or "image"
	decodeType := args[4].String()

	headerSlots := headerBytes * 4
	if len(carrier) < requiredCarrierLen(headerSlots) {
		// Carrier too small to even hold a length header.
		return nil
	}
	header := extractLSBBytes(carrier, 0, headerBytes, js.Undefined())
	secretWidth := int(binary.BigEndian.Uint32(header[0:4]))
	secretHeight := int(binary.BigEndian.Uint32(header[4:8]))
	payloadLen := int(binary.BigEndian.Uint32(header[8:12]))

	totalSlots := (headerBytes + payloadLen) * 4
	if payloadLen < 0 || requiredCarrierLen(totalSlots) > len(carrier) {
		// No (valid) hidden payload in this image.
		return nil
	}

	decodedBytes := extractLSBBytes(carrier, headerSlots, payloadLen, progressCb)

	if decodeType == "image" {
		var img *image.NRGBA
		if secretWidth > 0 && secretHeight > 0 {
			// Exact dimensions embedded by encode() - the normal case.
			img = image.NewNRGBA(image.Rect(0, 0, secretWidth, secretHeight))
		} else if width > 0 && height > 0 {
			// Fallback for a payload that didn't embed its own dimensions
			// (e.g. hidden as "text" but decoded as "image"): guess a size
			// from the carrier's aspect ratio. This is only a best effort -
			// it's right just when the secret happens to share that ratio.
			totalDecodedPixels := len(decodedBytes) / 4
			aspectRatio := float64(width) / float64(height)
			newHeight := int(math.Sqrt(float64(totalDecodedPixels) / aspectRatio))
			newWidth := int(float64(newHeight) * aspectRatio)
			img = image.NewNRGBA(image.Rect(0, 0, newWidth, newHeight))
		}

		if img != nil {
			// NRGBA (straight alpha), not RGBA (premultiplied) - see the
			// package comment on headerWidthBytes for why.
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

func encode(this js.Value, args []js.Value) interface{} {
	if len(args) != 7 {
		return nil
	}

	// progress indicator callback
	var progressCb js.Value = args[0]
	// carrier image buffer (RGBA pixels)
	carrierU8 := js.Global().Get("Uint8Array").New(args[1])
	carrier := make([]byte, carrierU8.Length())
	js.CopyBytesToGo(carrier, carrierU8)
	// carrier image dimensions
	width := args[2].Int()
	height := args[3].Int()
	// secret data to hide (raw bytes: UTF-8 text, or another image's raw RGBA pixels)
	secretU8 := js.Global().Get("Uint8Array").New(args[4])
	secret := make([]byte, secretU8.Length())
	js.CopyBytesToGo(secret, secretU8)
	// secret image dimensions (0, 0 for a text secret)
	secretWidth := args[5].Int()
	secretHeight := args[6].Int()

	if width <= 0 || height <= 0 {
		return nil
	}

	header := make([]byte, headerBytes)
	binary.BigEndian.PutUint32(header[0:4], uint32(secretWidth))
	binary.BigEndian.PutUint32(header[4:8], uint32(secretHeight))
	binary.BigEndian.PutUint32(header[8:12], uint32(len(secret)))
	payload := append(header, secret...)

	totalSlots := len(payload) * 4
	if requiredCarrierLen(totalSlots) > len(carrier) {
		// Secret does not fit in this carrier image.
		return nil
	}

	stego := embedLSBBytes(carrier, payload, progressCb)

	// NRGBA (straight alpha), not RGBA (premultiplied) - see decode()'s
	// comment. This also matches the canvas ImageData the frontend reads
	// the carrier from and writes the stego image back into.
	img := image.NewNRGBA(image.Rect(0, 0, width, height))
	copy(img.Pix, stego)

	var pngBuf bytes.Buffer
	if err := png.Encode(&pngBuf, img); err != nil {
		return nil
	}

	uint8Array := js.Global().Get("Uint8Array").New(pngBuf.Len())
	js.CopyBytesToJS(uint8Array, pngBuf.Bytes())
	return uint8Array
}
