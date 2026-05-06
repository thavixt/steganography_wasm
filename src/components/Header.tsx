import { useNavigate } from "react-router";
import heroImage from "../assets/hero.png";
import GlitchVault from "./ui/glitchvault";

export function Header() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 h-fit w-full border-b pb-2 bg-black">
      <GlitchVault
        className="w-full h-full relative z-10"
        glitchColor="#0AF0F0"
        glitchRadius={120}
      >
        <div className="flex flex-col p-4 md:flex-row md:p-0 gap-2  items-center justify-center">
          <img
            onClick={() => navigate("/")}
            className="size-12 cursor-pointer transition hover:scale-125"
            src={heroImage}
            alt="Steganography illustration"
          />
          <h1 className="font-mono!">WASM Steganography</h1>
          <span className="*:inline">
            by
            <a
              href="http://github.com/thavixt"
              target="_blank"
              className="bg-black p-1"
            >
              thavixt
            </a>
            @github
          </span>
        </div>
      </GlitchVault>
    </header>
  );
}
