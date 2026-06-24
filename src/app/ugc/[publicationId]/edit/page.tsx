import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UGCWorkspace } from "@/components/ugc/UGCWorkspace";
import { getGame } from "@/lib/data";
import type { UserPublication } from "@/types/database";

interface EditPageProps {
  params: Promise<{ publicationId: string }>;
}

export default async function EditPublicationPage({ params }: EditPageProps) {
  const { publicationId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirectTo=/ugc/${publicationId}/edit`);

  const { data } = await supabase
    .from("user_publications")
    .select("*")
    .eq("id", publicationId)
    .eq("user_id", user.id)
    .single();

  if (!data) notFound();

  const pub = data as UserPublication;
  if (pub.status === "PUBLISHED" || pub.status === "ARCHIVED") notFound();

  const game = getGame(pub.game_slug);

  return (
    <Suspense>
      <UGCWorkspace
        gameSlug={pub.game_slug}
        gameName={game?.name ?? pub.game_slug}
        publicationId={publicationId}
        initialData={{
          title:       pub.title,
          type:        pub.type,
          content:     pub.content_markdown,
          attachments: pub.attachments_urls,
          isPremium:   pub.is_premium,
        }}
      />
    </Suspense>
  );
}
