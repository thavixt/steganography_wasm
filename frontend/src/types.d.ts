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

export interface StegoEncodePayloadData {
  carrierBuffer: ArrayBuffer;
  width: number;
  height: number;
  secretBuffer: ArrayBuffer;
  // 0/0 for a text secret; the secret image's own dimensions otherwise, so
  // decode() can reconstruct it exactly instead of guessing a size from the
  // carrier's aspect ratio.
  secretWidth: number;
  secretHeight: number;
}
