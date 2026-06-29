declare module "sm-crypto" {
  export const sm2: {
    generateKeyPairHex(): { publicKey: string; privateKey: string };
    doDecrypt(cipherText: string, privateKey: string, cipherMode?: number): string;
  };
}
