package main

import (
	"fmt"
	"syscall/js"
)

func main() {
	// Register the greet function
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
	fmt.Println(message)

	// Set output in global variable
	js.Global().Set("wasm_result", message)

	// Set the output in the DOM
	// document := js.Global().Get("document")
	// output := document.Call("getElementById", "output")
	// output.Set("textContent", message)

	// return string immediately from go func ?
	return message
}

func readLSB(bytes []byte) string {
	// TODO: ready LSB as chars from buffer bytes
	return ""
}

func decode(this js.Value, args []js.Value) interface{} {
	if len(args) > 0 {
		src := args[0]
		u8 := js.Global().Get("Uint8Array").New(src)
		buf := make([]byte, u8.Length())
		n := js.CopyBytesToGo(buf, u8)
		return string(buf[:n])
		// @todo
		// return readLSB(buf)
	}
	return nil
}
