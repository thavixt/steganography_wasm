import { Link } from "react-router";

export function Navbar() {
  return (
    <nav className="w-full h-fit p-4 md:pt-2 md:px-12 justify-between items-center border-b">
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center text-sm">
        <Link to="/">/home</Link>
        <Link to="/decode">/decode</Link>
        <Link to="/encode">/encode</Link>
        <Link to="/compare">/compare</Link>
        <Link to="/info">/info</Link>
      </div>
    </nav>
  );
}
