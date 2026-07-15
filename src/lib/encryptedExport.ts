// Password-encrypted export using Web Crypto API AES-GCM. Not wired into any UI
// yet — see Stats for the plain JSON export. Call encryptString(json, password)
// to get a hex-encoded blob safe to email, and decryptString(blob, password)
// on import. PBKDF2 100k rounds → AES-256-GCM.

const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: 100000, hash: "SHA-256" },
    material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"],
  );
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

export async function encryptString(text: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const buf = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as unknown as BufferSource }, key, enc.encode(text));
  return `zn1.${toHex(salt)}.${toHex(iv)}.${toHex(new Uint8Array(buf))}`;
}

export async function decryptString(blob: string, password: string): Promise<string> {
  const [prefix, saltHex, ivHex, dataHex] = blob.split(".");
  if (prefix !== "zn1") throw new Error("Bad format");
  const salt = fromHex(saltHex); const iv = fromHex(ivHex); const data = fromHex(dataHex);
  const key = await deriveKey(password, salt);
  const buf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as unknown as BufferSource }, key, data as unknown as BufferSource);
  return dec.decode(buf);
}
