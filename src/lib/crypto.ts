/**
 * End-to-End Encryption utilities using Web Crypto API (AES-GCM 128-bit).
 *
 * The encryption key lives ONLY in the URL fragment (#key=...) and never
 * reaches the server.  The server stores opaque ciphertext + IV.
 */

// ─── Key Management ───

/** Generate a new AES-GCM 128-bit key */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 128 },
    true, // extractable – so we can put it in the URL
    ["encrypt", "decrypt"],
  )
}

/** Export a CryptoKey to a URL-safe base64 string */
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key)
  return arrayBufferToBase64Url(raw)
}

/** Import a URL-safe base64 string back into a CryptoKey */
export async function importKey(base64Url: string): Promise<CryptoKey> {
  const raw = base64UrlToArrayBuffer(base64Url)
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ])
}

// ─── Encrypt / Decrypt ───

export interface EncryptedData {
  /** Base64url-encoded ciphertext */
  ciphertext: string
  /** Base64url-encoded 12-byte IV */
  iv: string
}

/** Encrypt arbitrary data (will be JSON-serialised) with the given key */
export async function encryptData(
  data: unknown,
  key: CryptoKey,
): Promise<EncryptedData> {
  const json = JSON.stringify(data)
  const encoded = new TextEncoder().encode(json)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  )

  return {
    ciphertext: arrayBufferToBase64Url(ciphertext),
    iv: arrayBufferToBase64Url(iv.buffer),
  }
}

/** Decrypt data that was encrypted with encryptData */
export async function decryptData<T = unknown>(
  encrypted: EncryptedData,
  key: CryptoKey,
): Promise<T> {
  const ciphertext = base64UrlToArrayBuffer(encrypted.ciphertext)
  const iv = base64UrlToArrayBuffer(encrypted.iv)

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  )

  const json = new TextDecoder().decode(decrypted)
  return JSON.parse(json) as T
}

// ─── Binary helpers (for Socket.IO wire format) ───

/** Encrypt data to a single binary buffer:  [12-byte IV] + [ciphertext] */
export async function encryptToBuffer(
  data: unknown,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  const json = JSON.stringify(data)
  const encoded = new TextEncoder().encode(json)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  )

  // Combine: IV (12 bytes) + ciphertext
  const combined = new Uint8Array(12 + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), 12)
  return combined.buffer
}

/** Decrypt a binary buffer produced by encryptToBuffer */
export async function decryptFromBuffer<T = unknown>(
  buffer: ArrayBuffer,
  key: CryptoKey,
): Promise<T> {
  const data = new Uint8Array(buffer)
  const iv = data.slice(0, 12)
  const ciphertext = data.slice(12)

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  )

  const json = new TextDecoder().decode(decrypted)
  return JSON.parse(json) as T
}

// ─── Base64url encoding ───

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// ─── URL fragment helpers ───

/** Get the encryption key from the URL hash fragment */
export function getKeyFromHash(): string | null {
  if (typeof window === "undefined") return null
  const hash = window.location.hash
  if (!hash) return null

  const params = new URLSearchParams(hash.slice(1))
  return params.get("key")
}

/** Set the encryption key in the URL hash fragment (without triggering navigation) */
export function setKeyInHash(keyString: string): void {
  if (typeof window === "undefined") return
  const hash = `#key=${keyString}`
  window.history.replaceState(null, "", hash)
}
