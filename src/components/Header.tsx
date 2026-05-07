import { useNavigate } from "react-router";
import heroImage from "../assets/hero.png";
import GlitchVault from "./ui/glitchvault";

export function Header() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 h-fit w-full border-b-4 border-red-600 bg-black text-slate-200">
      <GlitchVault
        className="w-full h-full relative z-10"
        glitchColor="#40857e"
        glitchRadius={120}
      >
        <div className="flex flex-col p-2 md:flex-row gap-2 items-center justify-center">
          <img
            onClick={() => navigate("/")}
            className="size-8 cursor-pointer transition hover:scale-125"
            src={heroImage}
            alt="Steganography illustration"
          />
          <h1 className="font-mono!">WASM Steganography</h1>
          <span className="*:inline">
            by
            <a
              href="http://github.com/thavixt"
              target="_blank"
              className="hover:bg-black p-1"
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
