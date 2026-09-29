import { getCurrentMember } from "@/lib/session";
import { redirect } from "next/navigation";
import EntryForm from "@/components/EntryForm";

export default async function EntryPage({
  searchParams
}: {
  searchParams: { team?: string };
}) {
  const member = await getCurrentMember();
  if (member) redirect("/dashboard");

  return <EntryForm initialTeam={searchParams.team ?? null} />;
}
