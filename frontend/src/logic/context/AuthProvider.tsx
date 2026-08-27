import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

interface AuthFlowResponse<T = string> {
  response: T;
}

interface UserDetails {
  email: string;
  name: string;
}

interface Auth extends UserDetails {
  loginTime: number;
}

export interface AuthContextType {
  enabled: boolean;
  me: () => Promise<void>;
  register: (details: UserDetails) => Promise<void>;
  login: (details: Pick<UserDetails, "email">) => Promise<void>;
  auth: Auth | null;
  logout: () => Promise<void>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<Auth | null>(null);
  const enabled = !!SERVER_URL;

  const fetchMe = async () => {
    const res = await fetch(`${SERVER_URL}/?me`, { credentials: "include" });
    const json = (await res.json()) as AuthFlowResponse<{
      message: string;
      user_data: (UserDetails & Record<string, string>) | undefined; // json
    }>;
    return json.response;
  };

  const me = async () => {
    const { message, user_data } = await fetchMe();
    console.log(user_data);
    toast.success(
      <div className="flex flex-col gap-2">
        <span>{message}</span>
        <span>
          {user_data ? (
            <div className="flex flex-col">
              {Object.entries(user_data).map(([k, v]) => (
                <span key={k}>
                  {k}: {v}
                </span>
              ))}
            </div>
          ) : null}
        </span>
      </div>,
    );
  };

  const register = async ({ email, name }: UserDetails) => {
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

      setAuth({ email, name, loginTime: Date.now() });
      toast.success("Registration successful");
    } catch (err) {
      console.error(err);
      toast.error("Registration failed");
    }
  };

  const login = async ({ email }: Pick<UserDetails, "email">) => {
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
            String.fromCharCode(
              ...new Uint8Array(credResponse.clientDataJSON),
            ),
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

      const { user_data } = await fetchMe();
      setAuth({
        email: user_data?.email ?? email,
        name: user_data?.name ?? "",
        loginTime: Date.now(),
      });
      toast.success("Logged in");
    } catch (err) {
      console.error(err);
      toast.error("Login failed");
    }
  };

  const logout = async () => {
    try {
      await fetch(`${SERVER_URL}/?logout`, { credentials: "include" });
      setAuth(null);
      toast.success(`Logged out`);
    } catch {
      toast.error(`An error happened while attempting to log out`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        enabled,
        me,
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
