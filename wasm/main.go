package main

import (
	"fmt"
	"syscall/js"
)

func main() {
	// Register the greet function
	js.Global().Set("greet", js.FuncOf(greet))
	js.Global().Set("wasm_result", "")

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
