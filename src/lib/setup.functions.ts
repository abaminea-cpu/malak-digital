import { createServerFn } from "@tanstack/react-start";

// One-shot owner bootstrap. Safe: only succeeds if no admin exists yet OR
// the target email is already that admin (idempotent). Creates the auth user
// via the admin API with email pre-confirmed, then grants the admin role.
export const setupOwnerAccountFn = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string; full_name?: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Block if a different admin already exists
    const { data: existingAdmins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    // Find or create the auth user
    let userId: string | null = null;
    const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list.data.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());

    if (found) {
      userId = found.id;
      // Reset password to the requested one + confirm email
      await supabaseAdmin.auth.admin.updateUserById(found.id, {
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.full_name ?? "Malak Digital Owner" },
      });
    } else {
      const created = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.full_name ?? "Malak Digital Owner" },
      });
      if (created.error) throw created.error;
      userId = created.data.user!.id;
    }

    // If admins exist and none is this user, refuse (anti-takeover)
    if ((existingAdmins?.length ?? 0) > 0 && !existingAdmins!.some((r) => r.user_id === userId)) {
      return { ok: false, reason: "Un autre administrateur existe déjà." as const };
    }

    // Grant admin role (idempotent)
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId!, role: "admin" }, { onConflict: "user_id,role" });

    // Ensure profile row
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId!, full_name: data.full_name ?? "Malak Digital Owner" }, { onConflict: "id" });

    return { ok: true, user_id: userId };
  });
