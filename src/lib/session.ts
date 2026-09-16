import { cookies } from "next/headers";
import { prisma } from "./db";

// -----------------------------------------------------------------------
// IMPORTANT SECURITY NOTE
//
// There is no password or identity verification here. The cookie only
// remembers *which Member row the browser last picked* — exactly like the
// spec's "Change User" flow. It is NOT authentication.
//
// The reason this is still safe enough for an internal tool: every
// server-side permission check in lib/permissions.ts re-reads the
// Member's `role` and `isActive` columns from the database using the id
// stored in the cookie. The cookie can only ever *select which member
// record* a request claims to be; it can never assert a role directly,
// and the role that ends up being enforced always comes from the DB row,
// not from anything the client sent.
//
// If this app is ever exposed outside a trusted internal network, this
// cookie should be replaced with a real authenticated session (SSO/OIDC)
// — see README "Extending to real auth".
// -----------------------------------------------------------------------

const COOKIE_NAME = "bv_member_id";

export async function getCurrentMember() {
  const id = cookies().get(COOKIE_NAME)?.value;
  if (!id) return null;

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member || !member.isActive) return null;
  return member;
}

export function currentMemberCookieName() {
  return COOKIE_NAME;
}
