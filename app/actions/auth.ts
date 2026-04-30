"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function login(
  _prevState: { error?: string; redirectTo?: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });
  if (error) return { error: error.message };
  // Return the target URL instead of calling redirect() — the client will
  // do window.location.href so the page fully reloads and the Zustand store
  // picks up the new Supabase session from cookies.
  return { redirectTo: "/recommend" };
}

export async function signup(
  _prevState: { error?: string; redirectTo?: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: { full_name: (formData.get("name") as string).trim() },
    },
  });
  if (error) return { error: error.message };
  return { redirectTo: "/recommend" };
}

export async function logout() {
  // Explicitly delete the Supabase auth cookies by name so sign-out
  // works even when the refresh token is already expired.
  const cookieStore = await cookies();
  for (const { name } of cookieStore.getAll()) {
    if (name.startsWith("sb-")) {
      cookieStore.delete(name);
    }
  }
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // token already expired — ignore
  }
  redirect("/login");
}
