import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let token = url.searchParams.get("token");
    if (!token && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      token = body.token ?? null;
    }
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "token required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: share, error: sErr } = await admin
      .from("shared_list")
      .select("id,token,list_id,sender_name,note,include_emails,is_active,created_at,expires_at")
      .eq("token", token)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!share || !share.is_active) {
      return new Response(JSON.stringify({ error: "Share link not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Share link expired" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: list } = await admin
      .from("journalist_list")
      .select("id,name,created_at")
      .eq("id", share.list_id)
      .maybeSingle();

    const { data: items } = await admin
      .from("journalist_list_items")
      .select("id,connected_journalist,connected_creator")
      .eq("connected_journalist_list", share.list_id);

    const journalistIds = (items ?? [])
      .map((i) => i.connected_journalist).filter(Boolean) as number[];
    const creatorIds = (items ?? [])
      .map((i) => i.connected_creator).filter(Boolean) as number[];

    const journalistFields = share.include_emails
      ? "id,name,email,outlet,titles,topics,xhandle,country"
      : "id,name,outlet,titles,topics,xhandle,country";
    const creatorFields = share.include_emails
      ? "id,name,email,category,ig_handle,ig_followers,youtube_url,youtube_subscribers,type"
      : "id,name,category,ig_handle,ig_followers,youtube_url,youtube_subscribers,type";

    const [{ data: journalists }, { data: creators }] = await Promise.all([
      journalistIds.length
        ? admin.from("journalist").select(journalistFields).in("id", journalistIds)
        : Promise.resolve({ data: [] as any[] }),
      creatorIds.length
        ? admin.from("creators").select(creatorFields).in("id", creatorIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    return new Response(JSON.stringify({
      share: {
        senderName: share.sender_name,
        note: share.note,
        includeEmails: share.include_emails,
        createdAt: share.created_at,
      },
      list: list ? { name: list.name, createdAt: list.created_at } : null,
      journalists: journalists ?? [],
      creators: creators ?? [],
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("share-list-fetch", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
