"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type State = { error: string } | { success: string } | undefined;

export async function updateName(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient();
  const name = (formData.get("name") as string).trim();
  const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: "Name updated." };
}

export async function updateEmail(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient();
  const email = (formData.get("email") as string).trim();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: error.message };
  return { success: "Confirmation email sent. Please check your new inbox and click the link to confirm the change." };
}

export async function updatePassword(_prev: State, formData: FormData): Promise<State> {
  const currentPassword = formData.get("currentPassword") as string;
  const password = formData.get("password") as string;
  const confirm = formData.get("confirmPassword") as string;

  if (password !== confirm) return { error: "New passwords do not match." };
  if (password.length < 6) return { error: "New password must be at least 6 characters." };

  const supabase = await createClient();

  // Verify current password by re-authenticating
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not authenticated." };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) return { error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { success: "Password updated." };
}
