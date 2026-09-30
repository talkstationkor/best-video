import { cache } from "react";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { bvFetch } from "./bvApi";
import type { Member } from "./types";

// -----------------------------------------------------------------------
// IMPORTANT SECURITY NOTE
//
// There is no password for most members: the cookie only remembers *which
// Member row the browser last picked*. It is NOT authentication.
//
// The exception is TMT: entering as TMT needs the shared team PIN, checked
// by the tmt API. After that, a signed browser-session cookie (gone when the
// browser closes) marks the PIN as passed; a TMT member without it counts
// as signed out, on pages and on /api calls alike.
//
// Every permission check happens in the tmt Best Video API, which re-reads
// the member's team, role and isActive from the database using the id sent
// with each request. The cookie can never assert a role.
// -----------------------------------------------------------------------

const COOKIE_NAME = "bv_member_id";
const TMT_GATE_COOKIE = "bv_tmt_ok";

export function currentMemberId(): string | null {
  return cookies().get(COOKIE_NAME)?.value ?? null;
}

export function tmtGateCookieName() {
  return TMT_GATE_COOKIE;
}

// Unforgeable without BV_API_KEY, and tied to one member.
export function tmtGateValue(memberId: string): string {
  return createHmac("sha256", process.env.BV_API_KEY ?? "")
    .update(`tmt-pin-ok:${memberId}`)
    .digest("hex");
}

function hasTmtGate(memberId: string): boolean {
  const got = Buffer.from(cookies().get(TMT_GATE_COOKIE)?.value ?? "");
  const want = Buffer.from(tmtGateValue(memberId));
  return got.length === want.length && timingSafeEqual(got, want);
}

// cache(): a page and its AppShell both call this during one request; only
// the first call reaches the API. The same call returns the unread
// notification count shown in the header.
const loadSession = cache(async (): Promise<{ member: Member | null; unreadCount: number }> => {
  const signedOut = { member: null, unreadCount: 0 };
  const id = currentMemberId();
  if (!id) return signedOut;

  const res = await bvFetch("/session", { memberId: id });
  if (!res.ok) return signedOut;

  const data = await res.json().catch(() => null);
  const member: Member | null = data?.member ?? null;

  if (member?.team === "TMT" && !hasTmtGate(member.id)) return signedOut;

  return { member, unreadCount: data?.unreadCount ?? 0 };
});

export async function getCurrentMember(): Promise<Member | null> {
  return (await loadSession()).member;
}

export async function getUnreadCount(): Promise<number> {
  return (await loadSession()).unreadCount;
}

export function currentMemberCookieName() {
  return COOKIE_NAME;
}
