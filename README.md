# Steganography - WASM

A web application to perform simple LSB (least significat bit) steganography on images.

## Development

Backend created with:

- PHP, PostgreSQL

Frontend created with:

- [lbuchs/webauthn](https://github.com/lbuchs/webauthn)
- [Go / WebAssembly](https://go.dev/wiki/WebAssembly)
- [Vite / React / Typescript](https://tailwindcss.com/docs/installation/using-vite)
- [shadcn](https://ui.shadcn.com/docs/installation/vite)
- [Sera UI](https://seraui.com/docs)

### Frontend

To start the frontend application with Vite:

```sh
npm run dev:fe
```

then open http://localhost:4123

### Backend

Run:

```sh
npm run dev:be # to start the backend docker containers

# or start directly with docker cli:
docker compose --profile stego_backend up -w
```

> See `package.json` for more scripts to run containers, etc.

When the containers are running, you can access them at:

- backend: http://localhost:8000
- postgres db (adminer): http://localhost:8080/?pgsql=postgres&username=admin&db=stego_wasm&ns=public

> See `.env.example` for required environment variables, and create your own `.env` file to use.

## Resources:

- [Yotube: Secrets Hidden in Images (Steganography) - Computerphile](https://www.youtube.com/watch?v=TWEXCYQKyDc)
- [Youtube: How Passkeys Work - Computerphile](https://youtube.com/watch?v=lypcC79k-gg)
- [Implementing Passkeys in Practice - Computerphile](https://www.youtube.com/watch?v=lypcC79k-gg)
- [Package: lbuchs / WebAuthn](https://github.com/lbuchs/WebAuthn)
- [MDN docs: Web / API / Credential](https://developer.mozilla.org/en-US/docs/Web/API/Credential)
- [MDC docs: WebAuth](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API#examples)
