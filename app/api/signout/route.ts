import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // signOut in a Route Handler can properly set/delete cookies,
  // unlike Server Components or browser actions with stale tokens.
  try {
    await supabase.auth.signOut();
  } catch {
    // Token already expired — ignore and proceed with redirect
  }

  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);

  // Force-expire any remaining Supabase auth cookies so the
  // browser stops sending them on subsequent requests.
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", {
        maxAge: 0,
        path: "/",
      });
    }
  }

  return response;
}
