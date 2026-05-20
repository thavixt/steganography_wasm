import { useNavigate } from "react-router";
import heroImage from "../assets/hero.png";
import { useAuth } from "../logic/hooks/useAuth";
import { Login } from "./Login";
import { Logout } from "./Logout";
import { Registration } from "./Registration";
import { Button } from "./ui/button";
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
        <div className="flex flex-col lg:flex-row items-center justify-between pb-2 px-4">
          <div className="flex flex-col p-2 md:flex-row gap-2 items-center justify-center">
            <img
              onClick={() => navigate("/")}
              className="size-8 cursor-pointer transition hover:scale-125"
              src={heroImage}
              alt="Steganography illustration"
            />
            <h1 className="font-mono!">WASM Steganography</h1>
            <small className="*:inline">
              by
              <a
                href="http://github.com/thavixt"
                target="_blank"
                className="hover:bg-black p-1"
              >
                thavixt
              </a>
              @github
            </small>
          </div>
          <AuthButtons />
        </div>
      </GlitchVault>
    </header>
  );
}

function AuthButtons() {
  const { auth, enabled, greet } = useAuth();
  console.log({ auth });

  if (!enabled) {
    return;
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => greet("Test user")}>
        Greet
      </Button>
      {auth ? (
        <Logout />
      ) : (
        <>
          <Registration />
          <Login />
        </>
      )}
    </div>
  );
}
