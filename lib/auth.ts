import { AppError } from "@/lib/errors";
import { mapProfile } from "@/lib/mappers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { StaffProfile } from "@/lib/types";

export async function requireStaff(): Promise<{
  profile: StaffProfile;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError("Debes iniciar sesión.", "UNAUTHENTICATED", 401);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    throw new AppError("No se encontró el perfil de personal.", "FORBIDDEN", 403);
  }

  const profile = mapProfile(data);
  if (!profile.isActive) {
    throw new AppError("Tu cuenta todavía no está activa.", "FORBIDDEN", 403);
  }

  return { profile, supabase };
}
