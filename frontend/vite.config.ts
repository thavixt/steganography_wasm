import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    host: true,
    port: 4123,
    // Opens the Caddy-fronted HTTPS URL instead of Vite's own
    // http://localhost:4123, regardless of which npm script started this
    // (dev:fe, dev:caddy, dev:app, ...). Requires caddy-dev (or caddy) to
    // actually be running - see the "HTTPS via Caddy" section in README.md.
    open: "https://localhost/",
    // When served through Caddy (docker compose --profile dev-proxy up
    // caddy-dev), the HMR websocket the browser opens must target the
    // page's own origin (https://localhost, port 443) instead of Vite's
    // actual port 4123, or it can't reach back through the proxy. Left
    // undefined for the plain `npm run dev:fe` (direct, no Caddy) case, so
    // Vite falls back to its normal same-port behavior.
    hmr: process.env.VITE_HMR_PROTOCOL
      ? {
        protocol: process.env.VITE_HMR_PROTOCOL,
        host: process.env.VITE_HMR_HOST ?? "localhost",
        clientPort: process.env.VITE_HMR_CLIENT_PORT
          ? Number(process.env.VITE_HMR_CLIENT_PORT)
          : undefined,
      }
      : undefined,
  },
});
