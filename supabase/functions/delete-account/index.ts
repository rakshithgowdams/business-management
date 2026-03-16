import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const tables = [
      "invoice_items",
      "quotation_items",
      "agreement_milestones",
      "emi_payments",
    ];

    for (const table of tables) {
      let parentTable = "";
      let parentColumn = "";
      if (table === "invoice_items") {
        parentTable = "invoices";
        parentColumn = "invoice_id";
      } else if (table === "quotation_items") {
        parentTable = "quotations";
        parentColumn = "quotation_id";
      } else if (table === "agreement_milestones") {
        parentTable = "agreements";
        parentColumn = "agreement_id";
      } else if (table === "emi_payments") {
        parentTable = "emi_loans";
        parentColumn = "loan_id";
      }

      const { data: parentIds } = await adminClient
        .from(parentTable)
        .select("id")
        .eq("user_id", user.id);

      if (parentIds && parentIds.length > 0) {
        const ids = parentIds.map((r: { id: string }) => r.id);
        await adminClient.from(table).delete().in(parentColumn, ids);
      }
    }

    const userTables = [
      "expenses",
      "income",
      "goals",
      "invoices",
      "quotations",
      "agreements",
      "emi_loans",
      "subscriptions",
      "budget_limits",
    ];

    for (const table of userTables) {
      await adminClient.from(table).delete().eq("user_id", user.id);
    }

    await adminClient.from("profiles").delete().eq("id", user.id);

    const { data: avatarFiles } = await adminClient.storage
      .from("avatars")
      .list(user.id);

    if (avatarFiles && avatarFiles.length > 0) {
      const paths = avatarFiles.map((f: { name: string }) => `${user.id}/${f.name}`);
      await adminClient.storage.from("avatars").remove(paths);
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
