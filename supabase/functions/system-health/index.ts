// @ts-nocheck — Deno edge function; VS Code TS checker lacks Deno types
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Lightweight health-check endpoint for the Support page status panel.
 * Returns operational status of sub-systems.
 *
 * No auth required — public read-only.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // In production these would ping actual health endpoints.
  // For now we return a static "operational" response with timestamps
  // that the frontend can cache for 60s via stale-while-revalidate.
  const systems = [
    { name: "Video Generation", key: "video", status: "operational" },
    { name: "Streaming", key: "streaming", status: "operational" },
    { name: "AR System", key: "ar", status: "operational" },
    { name: "Billing", key: "billing", status: "operational" },
  ];

  return new Response(
    JSON.stringify({
      ok: true,
      timestamp: new Date().toISOString(),
      systems,
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
      },
    },
  );
});
