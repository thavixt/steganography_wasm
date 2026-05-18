# Agent Project Context: Steganography - WASM

This document provides the necessary context and guidelines for working on the Steganography WASM project.

## Project Overview

A web application enabling Least Significant Bit (LSB) steganography on images. The core processing is offloaded to Go-based WebAssembly for performance, while the UI is built with a modern React stack and the backend provides persistent storage and WebAuthn security.

## Technical Stack

### Frontend

- **Framework:** React with Vite and TypeScript.
- **Routing:** `react-router-dom`.
- **Styling:** Tailwind CSS.
- **Components:** `shadcn/ui` and `Sera UI`.
- **Concurrency:** Web Workers are used to execute WebAssembly (WASM) modules to keep the UI thread responsive during image processing.

### Steganography Engine

- **Language:** Go (Golang).
- **Target:** WebAssembly (WASM).
- **Logic:** Implements LSB algorithms for hiding and extracting data within image pixel bits.

### Backend (Server)

- **Language:** PHP.
- **Database:** PostgreSQL.
- **Authentication:** Passwordless authentication using the WebAuthn standard (via `lbuchs/webauthn`).
- **Infrastructure:** Containerized using `docker-compose`.

## Architecture Notes

1. **Processing Flow:** The React frontend receives an image, passes the buffer to a Web Worker, which runs the Go-compiled WASM to perform LSB manipulation.
2. **Persistence:** The PHP backend handles user sessions and stores metadata or processed images alongside other misc. user data or statistics in PostgreSQL.
3. **Authentication:** Uses WebAuthn for secure, biometric, or hardware-key-based login, replacing traditional passwords.

## Coding Standards & Styles

- **TypeScript:** Strict typing is preferred. Use functional components and hooks for React.
- **Styling:** Utilize Tailwind utility classes. Follow `shadcn/ui` patterns for new components.
- **Go:** Follow standard Go formatting (`gofmt`). Ensure WASM exports are correctly handled for JS interop.
- **PHP:** Adhere to PSR standards. Ensure the WebAuthn flow follows the implementation logic provided by the `lbuchs/webauthn` package.

## Development Workflow

- **Frontend Dev:** `npm run dev:fe` (Runs on http://localhost:4123).
- **Backend Dev:** `npm run dev:be` (Starts Docker containers).
- **Database Admin:** Accessible via Adminer at http://localhost:8080.

## Key Files

- `frontend/`: React source code.
- `backend/`: PHP source code and Docker configuration.
- `wasm/`: Go source code for steganography logic.
- `docker-compose.yml`: Services definition (PHP, Postgres, Adminer).

## Important Considerations

- Always check `.env` requirements against `.env.example`.
