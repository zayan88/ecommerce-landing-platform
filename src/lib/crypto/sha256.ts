/**
 * Zero-dependency SHA-256 + HMAC-SHA256 (RFC 2104) over UTF-8 bytes.
 * Edge/Workers/Node/Browser safe (uses only TextEncoder, DataView, typed arrays).
 */
const encoder = new TextEncoder();

const K: number[] = [];
const H0: number[] = [];
(function initConstants() {
  const isPrime = (x: number): boolean => {
    for (let d = 2; d * d <= x; d++) if (x % d === 0) return false;
    return true;
  };
  let n = 2;
  let count = 0;
  while (count < 64) {
    if (isPrime(n)) {
      if (count < 8) H0[count] = (Math.pow(n, 1 / 2) * 0x100000000) | 0;
      K[count] = (Math.pow(n, 1 / 3) * 0x100000000) | 0;
      count++;
    }
    n++;
  }
})();

function rotr(v: number, n: number): number {
  return (v >>> n) | (v << (32 - n));
}

function toBytes(input: string | Uint8Array): Uint8Array {
  return typeof input === "string" ? encoder.encode(input) : input;
}

export function toHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

export function sha256Bytes(data: Uint8Array): Uint8Array {
  const len = data.length;
  const total = Math.ceil((len + 9) / 64) * 64;
  const padded = new Uint8Array(total);
  padded.set(data);
  padded[len] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(total - 8, Math.floor(len / 0x20000000)); // high 32 bits of bit length
  view.setUint32(total - 4, (len << 3) >>> 0); // low 32 bits of bit length

  const h = H0.slice();
  const w = new Int32Array(64);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getInt32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15];
      const y = w[i - 2];
      const s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
      const s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
  }
  const out = new Uint8Array(32);
  const ov = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) ov.setUint32(i * 4, h[i] >>> 0);
  return out;
}

/** SHA-256 hex digest of the UTF-8 encoding of `input` (matches Node createHash("sha256").update(s, "utf8")). */
export function sha256(input: string): string {
  return toHex(sha256Bytes(encoder.encode(input)));
}

export function hmacSha256Bytes(key: string | Uint8Array, message: string | Uint8Array): Uint8Array {
  let k = toBytes(key);
  const m = toBytes(message);
  if (k.length > 64) k = sha256Bytes(k);
  const inner = new Uint8Array(64 + m.length);
  const outer = new Uint8Array(64 + 32);
  for (let i = 0; i < 64; i++) {
    const kb = i < k.length ? k[i] : 0;
    inner[i] = kb ^ 0x36;
    outer[i] = kb ^ 0x5c;
  }
  inner.set(m, 64);
  outer.set(sha256Bytes(inner), 64);
  return sha256Bytes(outer);
}

/** Real HMAC-SHA256, hex output (matches Node createHmac("sha256", key).update(msg).digest("hex")). */
export function hmacSha256(key: string, message: string): string {
  return toHex(hmacSha256Bytes(key, message));
}

/** Constant-time string comparison (time depends only on the longer length). */
export function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}
