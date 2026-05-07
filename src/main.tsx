import { Header } from "#components/Header";
import { Navbar } from "#components/Navbar";
import { WasmStats } from "#components/WasmStats";
import { Analytics } from "@vercel/analytics/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import "./index.css";
import { WasmProvider } from "./logic/context/WasmProvider.tsx";
import { Decode } from "./routes/decode.tsx";
import { Index } from "./routes/index.tsx";
import { NotFound } from "./routes/notfound.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Analytics />
    <Toaster position="bottom-center" />
    <WasmProvider>
      <WasmStats />
      <BrowserRouter>
        <main className="relative w-full h-full">
          <Header />
          <Navbar />
          <section className="p-12">
            <Routes>
              <Route index element={<Index />} />
              <Route path="/decode" element={<Decode />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </section>
        </main>
      </BrowserRouter>
    </WasmProvider>
  </StrictMode>,
);
