import { getUserByUsername } from "@/app/actions";
import { notFound } from "next/navigation";
import TipPageClient from "./TipPageClient";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function TipPage({ params }: PageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  return <TipPageClient user={user} />;
}

