import { cache } from "react";
import { cookies } from "next/headers";
import { bvFetch } from "./bvApi";
import type { Member } from "./types";

// -----------------------------------------------------------------------
// IMPORTANT SECURITY NOTE
//
// There is no password or identity verification here. The cookie only
// remembers *which Member row the browser last picked* — exactly like the
// spec's "Change User" flow. It is NOT authentication.
//
// Every permission check happens in the tmt Best Video API, which re-reads
// the member's team, role and isActive from the database using the id sent
// with each request. The cookie can only select which member a request
// claims to be; it can never assert a role.
// -----------------------------------------------------------------------

const COOKIE_NAME = "bv_member_id";

export function currentMemberId(): string | null {
  return cookies().get(COOKIE_NAME)?.value ?? null;
}

// cache(): a page and its AppShell both call this during one request; only
// the first call reaches the API. The same call returns the unread
// notification count shown in the header.
const loadSession = cache(async (): Promise<{ member: Member | null; unreadCount: number }> => {
  const id = currentMemberId();
  if (!id) return { member: null, unreadCount: 0 };

  const res = await bvFetch("/session", { memberId: id });
  if (!res.ok) return { member: null, unreadCount: 0 };

  const data = await res.json().catch(() => null);
  return { member: data?.member ?? null, unreadCount: data?.unreadCount ?? 0 };
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
