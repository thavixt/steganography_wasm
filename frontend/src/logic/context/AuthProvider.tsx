import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

interface AuthFlowResponse<T = string> {
  response: T;
}

interface UserDetails {
  name: string;
  username: string;
}

interface Auth extends UserDetails {
  loginTime: number;
}

export interface AuthContextType {
  enabled: boolean;
  greet: (name: string) => Promise<string>;
  register: (details: UserDetails) => Promise<void>;
  login: () => Promise<void>;
  auth: Auth | null;
  logout: () => Promise<void>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<Auth | null>(null);
  const enabled = !!SERVER_URL;

  const greet = async (name: string) => {
    const params = ["greet", `name=${name}`].join("&");
    const res = await fetch(`${SERVER_URL}/?${params}`);
    const json = (await res.json()) as AuthFlowResponse;
    return json.response;
  };

  const fetchArgs = async ({ username, name }: UserDetails) => {
    const res = await fetch(`${SERVER_URL}/?fetchArgs`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: name,
        userDisplayName: username,
      }),
    });
    const json = await res.json();
    const {
      response: { publicKey },
    } = json as AuthFlowResponse<{
      publicKey: PublicKeyCredentialCreationOptionsJSON;
    }>;
    return publicKey;
  };

  const createCredentials = async (
    args: PublicKeyCredentialCreationOptionsJSON,
  ) => {
    const parsedOptions =
      PublicKeyCredential.parseCreationOptionsFromJSON(args);
    const credential = await navigator.credentials.create({
      publicKey: parsedOptions,
    });
    if (!credential) {
      throw new Error("Failed creating credential");
    }
    return credential;
  };

  const saveRegistration = async (credential: Credential) => {
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
    return await res.json();
  };

  const register = async (details: UserDetails) => {
    try {
      const args = await fetchArgs(details);
      const credential = await createCredentials(args);
      await saveRegistration(credential);
      setAuth({ ...details, loginTime: Date.now() });
      toast.success("Registration successful");
    } catch (err) {
      console.error(err);
      toast.error("Registration failed");
    }
  };

  // TODO
  const login = async () => {
    // const loginCreds = processCredentials();
    // console.log(loginCreds);
    // setAuth({ name: "PLACEHOLDER" });
    // toast.success(`Logged in as ${loginCreds}`);uthFlowResponse;
  };

  // TODO
  const logout = async () => {
    try {
      const params = ["greet", `name=${name}`].join("&");
      await fetch(`${SERVER_URL}/?${params}`);
      setAuth(null);
      toast.success(`Logged out`);
    } catch {
      toast.error(`En error happened while attempting to log out`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        enabled,
        greet,
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
