export interface PublicKeyCredentialArgs {
  publicKey: {
    rp: PublicKeyCredentialRpEntity;
    authenticatorSelection: AuthenticatorSelectionCriteria;
    user: {
      id: string;
      name: string;
      displayName: string;
    };
    pubKeyCredParams: PublicKeyCredentialParameters[];
    attestation: AttestationConveyancePreference;
    extensions: AuthenticationExtensionsClientInputs;
    timeout: number;
    challenge: string;
    excludeCredentials: PublicKeyCredentialDescriptor[];
  };
}

export type StegoMethodType = "decode-image" | "encode-image";

export interface StegoImagePayloadData {
  buffer: ArrayBuffer;
  width: number;
  height: number;
  decodeType: "text" | "image";
}
export type StegoImagePayloadDataToWASM = [
  ArrayBuffer,
  number,
  number,
  "text" | "image",
];
