import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UGCWorkspace } from "@/components/ugc/UGCWorkspace";
import { getGame } from "@/lib/data";

interface NewPublicationPageProps {
  searchParams: Promise<{ game?: string }>;
}

export default async function NewPublicationPage({ searchParams }: NewPublicationPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirectTo=/ugc/new");

  const { game: gameSlug } = await searchParams;
  const game = gameSlug ? getGame(gameSlug) : null;

  return (
    <Suspense>
      <UGCWorkspace
        gameSlug={game?.id ?? gameSlug ?? "general"}
        gameName={game?.name ?? gameSlug ?? "General"}
      />
    </Suspense>
  );
}
