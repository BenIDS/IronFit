import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseServer } from "@/lib/supabase-server";
import { FOOD_PLAN } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  // Auth check — only logged-in users
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageBase64, mediaType } = await request.json();
  if (!imageBase64) return NextResponse.json({ error: "Missing image" }, { status: 400 });

  // Load user's profile for calibrated context
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const allMeals = Object.entries(FOOD_PLAN).flatMap(([type, meals]) =>
    meals.map(m => ({ ...m, type }))
  );
  const templateList = allMeals.map(m =>
    `- ${m.name}: ${m.desc} (${m.kcal} kcal, ${m.protein}g protein)`
  ).join("\n");

  const goalLine = profile?.phase_goal_label
    ? `Goal: ${profile.phase_goal_label} on ${profile.phase_goal_date}`
    : "";
  const targetLine = profile?.kcal_target
    ? `Daily target: ${profile.kcal_target} kcal, ${profile.protein_target_g}g protein`
    : "Daily target: 2400 kcal, 220g protein";

  const prompt = `You are a nutrition analyst. Analyze this meal photo and return ONLY valid JSON — no preamble, no markdown fences, no explanation outside the JSON.

User context:
${goalLine}
${targetLine}

Available meal templates from the user's plan:
${templateList}

Return JSON in this exact structure:
{
  "name": "short name of what the meal is",
  "ingredients": ["array of identified ingredients with rough quantities"],
  "estimated_kcal": 500,
  "estimated_protein_g": 40,
  "matched_template": "exact template name from list above, or null if no good match",
  "match_confidence": "high|medium|low|none",
  "overall_confidence": "high|medium|low",
  "reasoning": "1-2 sentences explaining what you see and how you estimated",
  "warnings": ["array of strings flagging hidden calories, ambiguous portions, cooking method uncertainty"]
}

Be conservative — err higher on calorie estimates when unclear. Flag hidden oils, sauces, and dressings as warnings. If the photo doesn't clearly show food, set overall_confidence to "low".`;

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 } },
          { type: "text", text: prompt },
        ],
      }],
    });

    const text = message.content
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("");

    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("analyse-meal error:", err);
    return NextResponse.json(
      { error: err.message || "Analysis failed" },
      { status: 500 }
    );
  }
}
