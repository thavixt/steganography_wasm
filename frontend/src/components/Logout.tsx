import { useAuth } from "../logic/hooks/useAuth";
import { Button } from "./ui/button";

export function Logout() {
  const { logout } = useAuth();
  return (
    <Button variant="outline" onClick={() => logout()}>
      Logout
    </Button>
  );
}
