import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

// Client for the tmt Best Video API (Laravel, /api/bv on the tmt server).
// This app never touches the database: every read and write goes through
// that API, which owns the business rules. Server-side only.
//
// BV_API_URL  e.g. http://tmt.tsai.kr/api/bv (local: http://127.0.0.1:8080/api/bv)
// BV_API_KEY  shared secret, same value as BV_API_KEY on the tmt server
//
// The tmt server has no HTTPS yet, so the key is never sent. Each request is
// signed (HMAC-SHA256 over method, URI, timestamp, single-use nonce, member
// and body hash) and each response must carry a matching signature, so a
// request cannot be forged or replayed and a response cannot be altered in
// transit. Content is still readable on the wire until the server has HTTPS.
// See App\Http\Middleware\BestVideoApi on the tmt side.

export class BvApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "BvApiError";
  }
}

type Options = {
  method?: string;
  // The member acting (the id stored in this app's cookie).
  memberId?: string | null;
  body?: unknown;
  // Raw request body to forward as is (used by the /api proxy).
  rawBody?: string;
  query?: string;
};

const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
const hmac = (key: string, text: string) => createHmac("sha256", key).update(text, "utf8").digest("hex");

function sameHex(a: string, b: string) {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

// Returns a verified Response (its body is safe to read), or throws.
export async function bvFetch(path: string, options: Options = {}): Promise<Response> {
  const base = process.env.BV_API_URL;
  const key = process.env.BV_API_KEY;

  if (!base || !key) {
    throw new BvApiError(503, "BV_API_URL and BV_API_KEY must be set.");
  }

  const url = new URL(`${base.replace(/\/$/, "")}${path}${options.query ?? ""}`);
  const method = (options.method ?? "GET").toUpperCase();

  let body: string | undefined = options.rawBody;
  if (options.body !== undefined) body = JSON.stringify(options.body);

  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = randomBytes(16).toString("hex");
  const member = options.memberId ?? "";

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-BV-Timestamp": timestamp,
    "X-BV-Nonce": nonce,
    "X-BV-Signature": hmac(
      key,
      [method, url.pathname + url.search, timestamp, nonce, member, sha256(body ?? "")].join("\n")
    )
  };
  if (member) headers["X-BV-Member"] = member;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(url, { method, headers, body, cache: "no-store" });
  const text = await res.text();

  const expected = hmac(key, [nonce, String(res.status), sha256(text)].join("\n"));
  const received = res.headers.get("X-BV-Response-Signature") ?? "";

  if (!sameHex(expected, received)) {
    console.error(`Best Video API ${method} ${url.pathname}: response signature mismatch (status ${res.status})`);
    throw new BvApiError(502, "The Best Video API response could not be verified.");
  }

  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" }
  });
}

// For server components: returns the parsed JSON or throws BvApiError.
export async function bvGet<T>(path: string, memberId?: string | null): Promise<T> {
  const res = await bvFetch(path, { memberId });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new BvApiError(res.status, data?.error ?? `Best Video API returned ${res.status}.`);
  }

  return data as T;
}
