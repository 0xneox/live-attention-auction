import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ALLOWED = ["image/png", "image/jpeg"];
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Artwork originals live in a PRIVATE bucket. The browser never gets write
 * access to it — it gets a one-shot signed upload URL for a server-chosen path.
 */
export const createArtworkUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { contentType: string; sizeBytes: number }) => {
    if (!ALLOWED.includes(input.contentType)) throw new Error("Only PNG or JPG logos are accepted.");
    if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > MAX_BYTES)
      throw new Error("Logo must be under 8 MB.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = data.contentType === "image/png" ? "png" : "jpg";
    const path = `${context.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("artwork")
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error("Could not start the upload.");
    return { path, token: signed.token };
  });

/** Short-lived read link. Owner or admin only. */
export const getArtworkUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { path: string }) => input)
  .handler(async ({ data, context }) => {
    const isOwner = data.path.startsWith(`${context.userId}/`);
    if (!isOwner) {
      const { data: isAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!isAdmin) throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("artwork")
      .createSignedUrl(data.path, 60 * 10);
    if (error || !signed) throw new Error("Could not open that file.");
    return { url: signed.signedUrl };
  });

/** Admin-only: upload proof photos / vehicle photos into the media bucket. */
export const uploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { contentType: string; base64: string; kind: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    if (!["image/png", "image/jpeg", "video/mp4"].includes(data.contentType))
      throw new Error("PNG, JPG or MP4 only.");

    const bytes = Buffer.from(data.base64, "base64");
    if (bytes.byteLength > 40 * 1024 * 1024) throw new Error("File too large.");
    const ext =
      data.contentType === "video/mp4" ? "mp4" : data.contentType === "image/png" ? "png" : "jpg";
    const path = `${data.kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("media")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error("Upload failed.");
    return { path, url: `/api/public/media/${path}` };
  });

/** Housekeeping: release reservations whose payment window lapsed. */
export const releaseExpiredReservations = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.rpc("release_expired_reservations");
  return { released: Number(data ?? 0) };
});
