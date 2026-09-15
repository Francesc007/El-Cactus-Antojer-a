import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isSupabaseConfigured()) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("error", "unconfigured");
    return NextResponse.redirect(login);
  }

  const { supabase, response, user } = await updateSession(request);

  if (!user || !supabase) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("error", "forbidden");
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/panel", "/panel/:path*"],
};
