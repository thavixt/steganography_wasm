import { WasmStats } from "#components/WasmStats";
import { Analytics } from "@vercel/analytics/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import "./index.css";
import { WasmProvider } from "./logic/context/WasmProvider.tsx";
import { Index } from "./routes/index.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Analytics />
    <Toaster />
    <WasmProvider>
      <WasmStats />
      <BrowserRouter>
        <Routes>
          <Route index element={<Index />} />
        </Routes>
      </BrowserRouter>
    </WasmProvider>
  </StrictMode>,
);
