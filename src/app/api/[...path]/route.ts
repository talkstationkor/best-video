import { NextRequest, NextResponse } from "next/server";
import { BvApiError, bvFetch } from "@/lib/bvApi";
import { getCurrentMember } from "@/lib/session";

// Forwards the browser's /api/* calls to the tmt Best Video API (/api/bv/*),
// signed server-side and acting as the member from this app's cookie. The
// paths match one to one (e.g. /api/versions/:id/approve). /api/session is
// handled by its own route because it sets the cookie.

const ALLOWED_ROOTS = new Set([
  "activity",
  "feedback",
  "members",
  "notifications",
  "projects",
  "versions"
]);

async function forward(req: NextRequest, params: { path: string[] }) {
  const segments = params.path ?? [];

  if (!ALLOWED_ROOTS.has(segments[0] ?? "")) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const path = "/" + segments.map(encodeURIComponent).join("/");
  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  try {
    const res = await bvFetch(path, {
      method: req.method,
      // Resolved like the pages do, so a TMT member whose PIN session has
      // ended acts as nobody here too.
      memberId: (await getCurrentMember())?.id ?? null,
      rawBody: hasBody ? await req.text() : undefined,
      query: req.nextUrl.search
    });
    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" }
    });
  } catch (err) {
    console.error(`${req.method} /api${path} failed:`, err);
    const status = err instanceof BvApiError ? err.status : 502;
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status });
  }
}

type Ctx = { params: { path: string[] } };

export const GET = (req: NextRequest, { params }: Ctx) => forward(req, params);
export const POST = (req: NextRequest, { params }: Ctx) => forward(req, params);
export const PATCH = (req: NextRequest, { params }: Ctx) => forward(req, params);
export const PUT = (req: NextRequest, { params }: Ctx) => forward(req, params);
export const DELETE = (req: NextRequest, { params }: Ctx) => forward(req, params);
