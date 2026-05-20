import { useAuth } from "../logic/hooks/useAuth";
import { Button } from "./ui/button";

export function Logout() {
  const { logout } = useAuth();
  // TODO: dialog
  return (
    <Button variant="secondary" onClick={() => logout()}>
      Logout
    </Button>
  );
}
