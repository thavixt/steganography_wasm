import { Link } from "react-router";

export function Navbar() {
  return (
    <nav className="w-full h-fit flex flex-col md:flex-row gap-2 p-4 md:py-2 md:px-12 justify-between items-center border-b-2">
      <Link to="/">Home</Link>
      <Link to="/decode">Decode</Link>
      <Link to="/encode">Encode</Link>
      <Link to="/compare">Compare</Link>
      <Link to="/info">Info</Link>
    </nav>
  );
}
