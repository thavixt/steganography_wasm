import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

interface AuthFlowResponse<T = string> {
  response: T;
}

interface UserDetails {
  id: string;
  name: string;
  username: string;
}

interface AuthDetails {
  name: string;
}

export interface AuthContextType {
  enabled: boolean;
  greet: (name: string) => Promise<string>;
  register: (details: UserDetails) => Promise<void>;
  login: () => Promise<void>;
  auth: AuthDetails | null;
  logout: () => Promise<void>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthDetails | null>(null);
  const enabled = !!SERVER_URL;

  const greet = async (name: string) => {
    const params = ["welcome", `name=${name}`].join("&");
    const url = `${SERVER_URL}/?${params}`;
    const res = await fetch(url);
    const json = (await res.json()) as AuthFlowResponse;
    return json.response;
  };

  const fetchArgs = async (userDetails: UserDetails) => {
    const { username, id, name } = userDetails;
    const params = [
      `userId=${id}`,
      `userName=${name}`,
      `userDisplayName=${username}`,
    ].join("&");
    const url = `${SERVER_URL}/?fetchArgs&${params}`;
    const res = await fetch(url);
    const json = (await res.json()) as AuthFlowResponse<{
      publicKey: PublicKeyCredentialCreationOptionsJSON;
    }>;
    return json.response.publicKey;
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

  // TODO
  const processCredentials = async () => {
    const clientDataJSON = "";
    const attestationObject = "";
    const challenge = "";
    const params = [
      `clientDataJSON=${clientDataJSON}`,
      `attestationObject=${attestationObject}`,
      `challenge=${challenge}`,
    ].join("&");
    const url = `${SERVER_URL}/?processArgs&${params}`;
    const res = await fetch(url);
    const json = (await res.json()) as AuthFlowResponse<PublicKeyCredential>;
    return JSON.stringify(json, null, "\t");
  };

  // TODO
  const register = async (details: UserDetails) => {
    console.log("start registration");
    const args = await fetchArgs(details);
    const registrationCreds = await createCredentials(args);
    console.log(registrationCreds);
    setAuth({ name: "PLACEHOLDER" });
    console.log("successful registration");
    toast.success("Registration successful");
  };

  // TODO
  const login = async () => {
    const loginCreds = processCredentials();
    console.log(loginCreds);
    setAuth({ name: "PLACEHOLDER" });
    toast.success(`Logged in as ${loginCreds}`);
  };

  // TODO
  const logout = async () => {
    setAuth(null);
    toast.success(`Logged out`);
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
