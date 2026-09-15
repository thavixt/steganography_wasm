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

### HTTPS via Caddy

`docker compose up` also brings up a `caddy` service that serves a production build of the frontend and reverse-proxies `/api/*` to the PHP backend, at `https://localhost` (or `http://localhost:8888` - see `CADDY_SITE_ADDRESS`/`CADDY_HTTP_PORT`/`CADDY_HTTPS_PORT` in `.env.example`). Setting `CADDY_SITE_ADDRESS` to a real domain in production gets automatic Let's Encrypt HTTPS with no other config changes.

For local dev, `CADDY_SITE_ADDRESS=https://localhost` gets you HTTPS via Caddy's own local CA, which your browser won't trust out of the box. To trust it once:

```sh
docker cp wasm-caddy:/data/caddy/pki/authorities/local/root.crt frontend/certs/caddy-local-root.crt
certutil -user -addstore Root frontend/certs/caddy-local-root.crt   # PowerShell, no admin required
```

(Firefox keeps its own certificate store separate from Windows - import it there too via Settings > Privacy & Security > Certificates if you use Firefox.)

While actively developing the frontend, use the dev-proxy variant instead of the static build, so hot reload keeps working through Caddy/HTTPS:

```sh
docker compose stop caddy
docker compose --profile dev-proxy up -d caddy-dev   # proxies to the Vite dev server instead of a static build
cd frontend && npm run dev:caddy                     # like npm run dev, but with HMR wired for the proxy
```

## Resources:

- [Yotube: Secrets Hidden in Images (Steganography) - Computerphile](https://www.youtube.com/watch?v=TWEXCYQKyDc)
- [Youtube: How Passkeys Work - Computerphile](https://youtube.com/watch?v=lypcC79k-gg)
- [Implementing Passkeys in Practice - Computerphile](https://www.youtube.com/watch?v=lypcC79k-gg)
- [Package: lbuchs / WebAuthn](https://github.com/lbuchs/WebAuthn)
- [MDN docs: Web / API / Credential](https://developer.mozilla.org/en-US/docs/Web/API/Credential)
- [MDC docs: WebAuth](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API#examples)
