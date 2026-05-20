import { Header } from "#components/Header";
import { Navbar } from "#components/Navbar";
import { WasmStats } from "#components/WasmStats";
import { Analytics } from "@vercel/analytics/react";
import { StrictMode } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./logic/context/AuthProvider.tsx";
import { WasmProvider } from "./logic/context/WasmProvider.tsx";
import { Decode } from "./routes/decode.tsx";
import { Index } from "./routes/index.tsx";
import { NotFound } from "./routes/notfound.tsx";

export function App() {
  return (
    <StrictMode>
      <Analytics />
      <Toaster position="bottom-center" />
      <AuthProvider>
        <WasmProvider>
          <WasmStats />
          <BrowserRouter>
            <main className="relative w-full h-full min-h-screen">
              <Header />
              <Navbar />
              <section className="p-12 mx-auto max-w-4xl">
                <Routes>
                  <Route index element={<Index />} />
                  <Route path="/decode" element={<Decode />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </section>
            </main>
          </BrowserRouter>
        </WasmProvider>
      </AuthProvider>
    </StrictMode>
  );
}
