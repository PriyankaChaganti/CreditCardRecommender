import Link from "next/link";

import { ProfileForms } from "@/components/ProfileForms";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          ← Back
        </Link>
      </div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Profile settings
      </h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Manage your name, email, and password.
      </p>
      <ProfileForms
        currentName={user?.user_metadata?.full_name ?? ""}
        currentEmail={user?.email ?? ""}
      />
    </div>
  );
}
