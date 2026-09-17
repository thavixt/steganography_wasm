import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

interface AuthFlowResponse<T = string> {
  response: T;
}

interface Auth {
  email: string;
  name: string;
  lastLogin: number;
  created: string;
}

export interface AuthContextType {
  enabled: boolean;
  authChecked: boolean;
  fetchMe: () => Promise<Auth | null>;
  register: (details: Pick<Auth, "email" | "name">) => Promise<void>;
  login: (details: Pick<Auth, "email">) => Promise<void>;
  auth: Auth | null;
  logout: () => Promise<void>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const enabled = !!SERVER_URL;
  const [auth, setAuth] = useState<Auth | null>(null);
  // Nothing to check when auth is disabled entirely.
  const [authChecked, setAuthChecked] = useState(!enabled);

  const fetchMe = async () => {
    const res = await fetch(`${SERVER_URL}/?me`, { credentials: "include" });
    const json = (await res.json()) as AuthFlowResponse<{
      user_data?: Auth;
    }>;
    const {
      response: { user_data },
    } = json;
    if (!user_data) {
      return null;
    }
    const data: Auth = {
      email: user_data.email,
      name: user_data.name,
      lastLogin: user_data.lastLogin,
      created: user_data.created,
    };
    setAuth((prev) => ({
      ...prev,
      ...data,
    }));
    return data;
  };

  // The PHP session cookie survives a reload on its own (7 day lifetime -
  // see Session.php); this just brings the React auth state back in sync
  // with it on mount, instead of defaulting to "logged out" until the next
  // explicit login() call.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    (async () => {
      try {
        await fetchMe();
      } catch (err) {
        console.error(err);
      } finally {
        setAuthChecked(true);
      }
    })();
    // Only ever run once, on mount - re-checking on every render would fight
    // login()/logout()'s own setAuth calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const register = async ({ email, name }: Pick<Auth, "email" | "name">) => {
    try {
      const argsRes = await fetch(`${SERVER_URL}/?fetchArgs`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
        }),
      });
      const json = await argsRes.json();
      const {
        response: { publicKey },
      } = json as AuthFlowResponse<{
        publicKey: PublicKeyCredentialCreationOptionsJSON;
      }>;

      const parsedOptions =
        PublicKeyCredential.parseCreationOptionsFromJSON(publicKey);
      const credential = await navigator.credentials.create({
        publicKey: parsedOptions,
      });
      if (!credential) {
        throw new Error("Failed creating credential");
      }

      const cred = credential as PublicKeyCredential;
      const response = cred.response as AuthenticatorAttestationResponse;

      const res = await fetch(`${SERVER_URL}/?processArgs`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        // Convert ArrayBuffers to Base64 so the server can read them
        body: JSON.stringify({
          id: cred.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(cred.rawId))),
          type: cred.type,
          attestationObject: btoa(
            String.fromCharCode(...new Uint8Array(response.attestationObject)),
          ),
          clientDataJSON: btoa(
            String.fromCharCode(...new Uint8Array(response.clientDataJSON)),
          ),
        }),
      });

      if (!res.ok) {
        throw new Error("Server failed to verify registration");
      }

      await fetchMe();
      toast.success("Registration successful");
    } catch (err) {
      console.error(err);
      toast.error("Registration failed");
    }
  };

  const login = async ({ email }: Pick<Auth, "email">) => {
    try {
      const fetchArgsRes = await fetch(`${SERVER_URL}/?loginFetchArgs`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
        }),
      });
      if (!fetchArgsRes.ok) {
        throw new Error(
          "Unknown email address, or no passkey registered for it",
        );
      }
      const fetchArgsJson = await fetchArgsRes.json();
      const {
        response: { publicKey },
      } = fetchArgsJson as AuthFlowResponse<{
        publicKey: PublicKeyCredentialRequestOptionsJSON;
      }>;

      const parsedOptions =
        PublicKeyCredential.parseRequestOptionsFromJSON(publicKey);
      const credential = await navigator.credentials.get({
        publicKey: parsedOptions,
      });
      if (!credential) {
        throw new Error("Failed getting credential");
      }

      const cred = credential as PublicKeyCredential;
      const credResponse = cred.response as AuthenticatorAssertionResponse;

      const res = await fetch(`${SERVER_URL}/?loginProcessArgs`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        // Convert ArrayBuffers to Base64 so the server can read them
        body: JSON.stringify({
          id: cred.id,
          clientDataJSON: btoa(
            String.fromCharCode(...new Uint8Array(credResponse.clientDataJSON)),
          ),
          authenticatorData: btoa(
            String.fromCharCode(
              ...new Uint8Array(credResponse.authenticatorData),
            ),
          ),
          signature: btoa(
            String.fromCharCode(...new Uint8Array(credResponse.signature)),
          ),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to authenticate");
      }

      const userdata = await fetchMe();
      if (userdata) {
        toast.success(`Logged in as ${userdata.name ?? "unknown user"}`);
      } else {
        toast.error("Retrieving user data failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Login failed");
    }
  };

  const logout = async () => {
    try {
      await fetch(`${SERVER_URL}/?logout`, { credentials: "include" });
      setAuth(null);
      toast.success(`Successfully logged out`);
    } catch {
      toast.error(`An error happened while attempting to log out`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        enabled,
        authChecked,
        fetchMe,
        register,
        login,
        auth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
