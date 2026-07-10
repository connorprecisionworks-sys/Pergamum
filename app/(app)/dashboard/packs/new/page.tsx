import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createDraftPack } from "../actions";

export default async function NewPackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard/packs/new");

  const { id, error } = await createDraftPack();
  if (error || !id) {
    redirect("/dashboard/packs");
  }

  redirect(`/dashboard/packs/${id}`);
}
