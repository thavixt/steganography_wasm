import type { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router";

export function Navbar() {
  return (
    <nav className="w-full h-fit p-4 md:pt-2 md:px-12 justify-between items-center border-b">
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center text-sm">
        <LinkTo to="/decode">Decode</LinkTo>
        <LinkTo to="/encode">Encode</LinkTo>
        <LinkTo to="/compare">Compare</LinkTo>
        <LinkTo to="/learn">Learn</LinkTo>
      </div>
    </nav>
  );
}

function LinkTo({ to, children }: PropsWithChildren<{ to: string }>) {
  const { pathname } = useLocation();
  if (pathname === to) {
    return <span>{children}</span>;
  }
  return <Link to={to}>{children}</Link>;
}
