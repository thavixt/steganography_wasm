import { Button } from "#components/ui/button";
import { useNavigate } from "react-router";

export function NotFound() {
  const navigate = useNavigate();
  return (
    <main className="flex flex-col gap-12 items-center mt-12">
      <p>Ooops, nothing's here ¯\_(ツ)_/¯ - yet!</p>
      <Button onClick={() => navigate("/")}>Go back</Button>
    </main>
  );
}
