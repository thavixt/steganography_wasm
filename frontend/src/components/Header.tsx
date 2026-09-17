import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../logic/hooks/useAuth";
import { Login } from "./Login";
import { Logout } from "./Logout";
import { Registration } from "./Registration";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import GlitchVault from "./ui/glitchvault";
import heroImage from "/hero.png";

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 h-fit w-full border-b-4 border-red-600 bg-black text-slate-200">
      <GlitchVault
        className="w-full h-full relative z-10"
        glitchColor="#40857e"
        glitchRadius={100}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between pb-2 px-4">
          <div className="h-16 flex flex-col p-2 md:flex-row gap-2 items-center justify-center">
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
  const { auth, authChecked, enabled, fetchMe } = useAuth();
  const [open, setOpen] = useState(false);

  if (!enabled) {
    return;
  }

  return (
    <div className="flex gap-2">
      {auth?.name ? (
        <Dialog
          onOpenChange={setOpen}
          open={open}
          trigger={
            <Button variant="secondary" onClick={() => fetchMe()}>
              {auth.name}
            </Button>
          }
          title={"My account"}
        >
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2">
              <div>Email address:</div>
              <div>{auth.email}</div>
              <div>Display name:</div>
              <div>{auth.name}</div>
              <div>Last login at:</div>
              <div>{new Date(auth.lastLogin).toLocaleString()}</div>
              <div>Registered at:</div>
              <div>{new Date(auth.created).toLocaleString()}</div>
              <div className="col-span-2 mt-2">
                <small>
                  WIP: all kinds of statistics from the DB/backend - like # of
                  pictures processed, bytes extracted/hidden, etc.
                </small>
              </div>
            </div>
          </div>
        </Dialog>
      ) : null}
      {!authChecked ? null : auth ? (
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
