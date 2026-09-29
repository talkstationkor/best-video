import { redirect } from "next/navigation";

// Team and name selection now live on the entry screen. Old links such as
// /teams/TMT keep working by preselecting that team there.
export default function TeamRedirectPage({
  params
}: {
  params: { team: string };
}) {
  redirect(`/?team=${encodeURIComponent(params.team)}`);
}
