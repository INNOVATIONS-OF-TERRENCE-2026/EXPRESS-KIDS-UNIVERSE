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

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: authErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authErr || !claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const userId = claims.claims.sub as string;

    const { profile, storyId } = await req.json();

    const systemPrompt = `You are a world-class children's story author. You write engaging, age-appropriate, imaginative stories.
RULES:
- The story MUST feature the child as the main character using their name and pronouns
- Include family/friends mentioned in the profile as supporting characters
- Match the reading level: Preschool (simple words, short sentences), Early Reader (moderate vocabulary), Chapter (more complex narrative)
- Incorporate the child's favorites and personality traits naturally
- Match the mood: Calm=peaceful pacing, Excited=action-packed, Silly=lots of humor
- If a lesson focus is provided, weave it in naturally without being preachy
- The story should be 800-1200 words for Early Reader, 400-600 for Preschool, 1200-1800 for Chapter
- Content must be 100% kid-safe, positive, and empowering
- Return the story in the exact JSON format requested using tool calling`;

    const userPrompt = `Create a personalized story with these details:
- Child's Name: ${profile.childName}
- Age: ${profile.age}
- Pronouns: ${profile.pronouns || "they/them"}
- Reading Level: ${profile.readingLevel}
- Theme: ${profile.theme}
- Setting: ${profile.setting || "a magical world"}
- Mood: ${profile.mood}
- Favorites: ${profile.favorites?.join(", ") || "adventures"}
- Personality: brave ${profile.personality?.brave}%, curious ${profile.personality?.curious}%, funny ${profile.personality?.funny}%, kind ${profile.personality?.kind}%, adventurous ${profile.personality?.adventurous}%
- Family/Friends: ${profile.familyFriends?.map((f: any) => `${f.name} (${f.role})`).join(", ") || "none specified"}
- Lesson Focus: ${profile.lessonFocus || "none"}

Generate a complete story with a title and 6 scene descriptions for illustrations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_story",
              description: "Return the complete story with title, text, and scene descriptions",
              parameters: {
                type: "object",
                properties: {
                  storyTitle: { type: "string", description: "Creative title for the story" },
                  storyText: { type: "string", description: "The complete story text with paragraphs separated by double newlines" },
                  scenes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        caption: { type: "string", description: "Short description of what happens in this scene, suitable as an image generation prompt" },
                      },
                      required: ["caption"],
                    },
                    description: "Exactly 6 scene descriptions for illustrations",
                  },
                },
                required: ["storyTitle", "storyText", "scenes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_story" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        // Update story status to failed
        await supabase.from("stories").update({ status: "failed" }).eq("id", storyId);
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        await supabase.from("stories").update({ status: "failed" }).eq("id", storyId);
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      await supabase.from("stories").update({ status: "failed" }).eq("id", storyId);
      return new Response(JSON.stringify({ error: "AI generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      await supabase.from("stories").update({ status: "failed" }).eq("id", storyId);
      return new Response(JSON.stringify({ error: "AI did not return structured output" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const story = JSON.parse(toolCall.function.arguments);

    // Update story in DB
    await supabase.from("stories").update({
      title: story.storyTitle,
      story_text: story.storyText,
      status: "done",
    }).eq("id", storyId);

    // Insert scenes
    const scenes = (story.scenes || []).map((s: any, i: number) => ({
      story_id: storyId,
      scene_number: i + 1,
      caption: s.caption,
    }));
    if (scenes.length > 0) {
      await supabase.from("story_scenes").insert(scenes);
    }

    return new Response(JSON.stringify({ success: true, storyTitle: story.storyTitle }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-story error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
