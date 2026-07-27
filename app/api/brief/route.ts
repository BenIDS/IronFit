import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { PLAN, SCALE } from "@/lib/constants";

export const runtime = "nodejs";

function daysUntil(dateStr: string) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - Date.now()) / 86400000);
}

export async function GET() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Load everything
  const [profileR, workoutsR, bodyR, foodR, hydrationR] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("workouts").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(60),
    supabase.from("body_stats").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30),
    supabase.from("food_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(60),
    supabase.from("hydration").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(14),
  ]);

  const profile = profileR.data;
  const workouts = workoutsR.data || [];
  const body = bodyR.data || [];
  const food = foodR.data || [];
  const hydration = hydrationR.data || [];

  const today = new Date().toISOString().slice(0, 10);
  const daysAgo = (d: string, n: number) => (Date.now() - new Date(d).getTime()) / 86400000 <= n;

  let out = `IRONFIT BRIEF — ${today}\n${"=".repeat(40)}\n\n`;

  if (profile?.phase_goal_date) {
    out += `## CURRENT PHASE: ${profile.phase_name || "Boost"}\n`;
    out += `Goal: ${profile.phase_goal_label || "—"} on ${profile.phase_goal_date} (${daysUntil(profile.phase_goal_date)} days away)\n`;
    if (profile.kcal_target) out += `Targets: ${profile.kcal_target} kcal · ${profile.protein_target_g}g protein\n`;
    out += "\n";
  }

  if (profile) {
    out += `## PROFILE\n`;
    if (profile.name) out += `Name: ${profile.name}\n`;
    if (profile.age) out += `Age: ${profile.age}\n`;
    if (profile.sex) out += `Sex: ${profile.sex}\n`;
    if (profile.height_cm) out += `Height: ${profile.height_cm}cm\n`;
    if (profile.current_weight_kg) out += `Current weight: ${profile.current_weight_kg}kg\n`;
    if (profile.goal_weight_kg) out += `Goal weight: ${profile.goal_weight_kg}kg\n`;
    if (profile.primary_goal) out += `Goal: ${profile.primary_goal}\n`;
    if (profile.activity_level) out += `Activity: ${profile.activity_level}\n`;
    if (profile.injuries) out += `Injuries: ${profile.injuries}\n`;
    if (profile.notes) out += `Notes: ${profile.notes}\n`;
    out += "\n";
  }

  if (body.length) {
    out += `## BODY COMPOSITION (last 30d)\n`;
    const recent = body.slice().reverse();
    const first = recent[0], last = recent[recent.length - 1];
    SCALE.forEach(f => {
      if (last[f.k] !== undefined && last[f.k] !== null) {
        const delta = first[f.k] !== undefined && first.id !== last.id
          ? ` (${(last[f.k] - first[f.k]).toFixed(1)} ${f.u} since ${first.date})`
          : "";
        out += `${f.l}: ${last[f.k]}${f.u}${delta}\n`;
      }
    });
    out += `Readings logged: ${recent.length}\n\n`;
  }

  const last7 = workouts.filter(w => daysAgo(w.date, 7));
  const last30 = workouts.filter(w => daysAgo(w.date, 30));
  out += `## TRAINING\nLast 7d: ${last7.length} sessions | Last 30d: ${last30.length} sessions\n\n`;

  if (last7.length) {
    out += `### Last 7 days\n`;
    last7.forEach(w => {
      const label = (PLAN as any)[w.type]?.label || w.type;
      out += `${w.date} — ${label}`;
      if (w.steps) out += ` · ${w.steps} steps`;
      out += "\n";
      (w.exercises || []).forEach((e: any) => {
        if (e.setLog?.length > 0) {
          const setStr = e.setLog.map((s: any, i: number) => {
            let str = `${i + 1}) ${s.reps || "?"}`;
            if (s.weight) str += `@${s.weight}kg`;
            if (s.rir) str += ` (${s.rir} RIR)`;
            return str;
          }).join(" · ");
          out += `  · ${e.name}: ${setStr}\n`;
        } else {
          const parts = [];
          if (e.sets) parts.push(`${e.sets} sets`);
          if (e.reps) parts.push(`${e.reps} reps`);
          if (e.weight) parts.push(`@ ${e.weight}kg`);
          out += `  · ${e.name}: ${parts.join(" ")}\n`;
        }
        if (e.notes) out += `    ${e.notes}\n`;
      });
      if (w.notes) out += `  notes: ${w.notes}\n`;
      out += "\n";
    });
  }

  const recentF = food.filter(f => daysAgo(f.date, 7));
  if (recentF.length) {
    out += `## NUTRITION (last 7d)\nMeals logged: ${recentF.length}\n`;
    const proteinDays: Record<string, number> = {};
    recentF.forEach(f => {
      if (f.protein_g) proteinDays[f.date] = (proteinDays[f.date] || 0) + Number(f.protein_g);
    });
    const protList = Object.values(proteinDays);
    if (protList.length) {
      const avg = protList.reduce((a, b) => a + b, 0) / protList.length;
      out += `Avg daily protein (where logged): ${avg.toFixed(0)}g across ${protList.length} days\n`;
    }
    out += `\n### Recent meals\n`;
    recentF.slice(0, 12).forEach(f => {
      out += `${f.date} ${f.meal}: ${f.description}`;
      if (f.protein_g) out += ` [${f.protein_g}g protein]`;
      out += "\n";
    });
    out += "\n";
  }

  const recentH = hydration.filter(h => daysAgo(h.date, 7));
  if (recentH.length) {
    const target = profile?.hydration_target_ml || 4500;
    const avg = recentH.reduce((a, h) => a + h.ml, 0) / recentH.length;
    const hit = recentH.filter(h => h.ml >= target).length;
    out += `## HYDRATION (last 7d)\nAvg: ${Math.round(avg).toLocaleString()}ml/day (target ${target.toLocaleString()}ml)\nDays at target: ${hit}/${recentH.length}\n\n`;
  }

  out += `${"=".repeat(40)}\nClaude — review the above and tell me:\n1. Am I on track for my goal?\n2. Where am I stuck or sliding?\n3. Diet adjustments needed?\n4. What to focus on this week?\n`;

  return NextResponse.json({ brief: out });
}
