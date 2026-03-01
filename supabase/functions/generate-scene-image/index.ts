import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: authErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authErr || !claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { sceneId, caption, childName, theme, sceneIndex, totalScenes, emotion } = await req.json();

    // ── Pixar Lighting Directive ──
    const idx = sceneIndex ?? 0;
    const tot = totalScenes ?? 1;
    const sceneEmotion = emotion || "playful";
    const lightingDirective = computeSceneLighting(sceneEmotion, caption || "", idx, tot);

    // ── Character DNA Identity ──
    const characterIdentity = buildSceneCharacterDNA(childName || "Hero", theme || "Adventure");

    const prompt = `A colorful, whimsical children's book illustration in a warm, friendly art style. Scene: ${caption}. The main character is a child named ${childName}. Theme: ${theme}. Style: soft watercolor, vibrant colors, kid-friendly, no scary elements, safe for children. 16:9 aspect ratio. ${lightingDirective} ${characterIdentity}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      console.error("Image generation failed:", status, await response.text());
      return new Response(JSON.stringify({ error: "Image generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      return new Response(JSON.stringify({ error: "No image generated" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Upload to storage
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileName = `${sceneId}.png`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from("scene-images")
      .upload(fileName, binaryData, { contentType: "image/png", upsert: true });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return new Response(JSON.stringify({ error: "Failed to upload image" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: publicUrl } = supabaseAdmin.storage.from("scene-images").getPublicUrl(fileName);

    // Update scene record
    await supabase.from("story_scenes").update({ image_url: publicUrl.publicUrl }).eq("id", sceneId);

    return new Response(JSON.stringify({ success: true, imageUrl: publicUrl.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-scene-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/* ── Inline Pixar Lighting for Image Generation ── */
function computeSceneLighting(emotion: string, caption: string, idx: number, total: number): string {
  const moodMap: Record<string, string> = {
    calm: "warm soft ambient light, gentle golden-hour glow",
    playful: "bright cheerful lighting, light bouncing off colorful surfaces",
    magical: "ethereal pastel glow, sparkling light particles, soft lens flare",
    tense: "moody directional lighting, cool blue-grey tones, subtle shadows",
    dramatic: "chiaroscuro lighting, strong key light, deep but child-safe shadows",
    action: "dynamic high-contrast lighting, motion-energy glow",
    emotional: "soft diffused warm light, intimate and gentle",
    triumphant: "radiant golden backlight, hero lighting, glowing rim highlights",
  };
  const envLighting = inferEnvironmentLighting(caption);
  const base = moodMap[emotion] || moodMap.playful;
  return `Lighting: ${base}. ${envLighting} Pixar-quality subsurface scattering on skin. No harsh shadows (child-safe).`;
}

function inferEnvironmentLighting(caption: string): string {
  const lower = caption.toLowerCase();
  if (/forest|tree|jungle/.test(lower)) return "Dappled sunlight through canopy, god rays filtering through leaves.";
  if (/ocean|sea|underwater/.test(lower)) return "Underwater caustic light patterns, gentle sun shafts through water surface.";
  if (/space|star|planet/.test(lower)) return "Distant starfield illumination, nebula ambient glow, zero-gravity light scatter.";
  if (/cave|underground/.test(lower)) return "Bioluminescent glow, crystal light refraction, atmospheric mist.";
  if (/night|moon|dark/.test(lower)) return "Cool moonlit ambience, gentle blue-silver fill, warm window light spill.";
  if (/garden|flower|meadow/.test(lower)) return "Warm petal-filtered sunlight, butterfly wing iridescence.";
  if (/snow|ice|winter/.test(lower)) return "Cool blue ambient, snow crystal sparkle, clean reflective highlights.";
  return "Clean three-point studio lighting with soft fill.";
}

/* ── Inline Character DNA for Image Generation ── */
function buildSceneCharacterDNA(childName: string, theme: string): string {
  const themeOutfit: Record<string, string> = {
    "Space Quest": "wearing a silver space suit with starry patches",
    "Magic Forest": "wearing a green leaf-patterned tunic with a nature crown",
    "Ocean Voyage": "wearing a blue sailor outfit with coral accessories",
    "Super Builders": "wearing an orange hard hat and tool belt",
    "Dino Discovery": "wearing a khaki explorer outfit with fossil-patterned bandana",
  };
  const outfit = themeOutfit[theme] || "wearing a colorful adventure outfit with a star emblem";
  return `Character consistency: ${childName} is a Pixar-quality 3D cartoon child with bright expressive eyes, friendly smile, ${outfit}. CRITICAL: Keep the character's face, proportions, and outfit colors IDENTICAL to all other scenes.`;
}
