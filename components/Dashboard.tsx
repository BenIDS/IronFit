"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { C, PLAN, SCALE, MEALS, TABS, FOOD_PLAN, MACRO_COLORS } from "@/lib/constants";
import { Btn, Card, Stat, SectionLabel } from "./ui";
import {
  WorkoutForm, BodyForm, CustomiseModal, RecipeModal, PhotoLogger,
} from "./modals";
import { ProfileForm } from "./ProfileForm";
import { FoodLogger } from "./FoodLogger";

type Props = {
  userEmail: string;
  initialProfile: any;
  initialWorkouts: any[];
  initialBody: any[];
  initialFood: any[];
  initialHydration: any[];
  initialPrefs: any;
};

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - Date.now()) / 86400000);
}

// Deduplicate recent meals — keep the most recent instance of each unique meal (grouped by product_name or description)
function buildRecentFoods(food: any[], limit = 15): any[] {
  const seen = new Map<string, any>();
  for (const f of food) {
    const key = (f.product_name || f.description || "").trim().toLowerCase();
    if (!key) continue;
    if (!seen.has(key)) seen.set(key, f);
    if (seen.size >= limit) break;
  }
  return Array.from(seen.values());
}

function coachMessage(workouts: any[], food: any[], hydration: any[], profile: any, todayKey: string) {
  const last7 = workouts.filter(w => (Date.now() - new Date(w.date).getTime()) / 86400000 <= 7).length;
  const todayHydRow = hydration.find(h => h.date === todayKey);
  const todayWater = todayHydRow?.ml || 0;
  const todayFood = food.filter(f => f.date === todayKey);
  const todayProtein = todayFood.reduce((s, f) => s + (Number(f.protein_g) || 0), 0);
  const proteinTarget = profile?.protein_target_g || 220;
  const waterTarget = profile?.hydration_target_ml || 4500;

  const gymSessions = workouts.filter(w => ["push", "pull", "legs"].includes(w.type));
  const nextInRotation = () => {
    if (gymSessions.length === 0) return "Push";
    const last = gymSessions[0].type;
    if (last === "push") return "Pull";
    if (last === "pull") return "Legs";
    return "Push";
  };

  if (last7 === 0 && workouts.length > 0) {
    return { tone: "Focus", title: "0 sessions in 7 days", body: `Get back at it — next up: ${nextInRotation()}. Even at 80% intensity, break the zero today.` };
  }
  if (last7 === 0 && workouts.length === 0) {
    return { tone: "Start", title: "Ready when you are", body: "Log your first session. Start with Push — chest, shoulders, triceps." };
  }
  if (todayProtein < proteinTarget * 0.5 && new Date().getHours() > 14) {
    return { tone: "Food", title: "Protein behind pace", body: `At ${Math.round(todayProtein)}g by afternoon. Target ${proteinTarget}g — grab a shake or lean protein snack.` };
  }
  if (todayWater < waterTarget * 0.4 && new Date().getHours() > 14) {
    return { tone: "Hydrate", title: "Behind on water", body: `At ${(todayWater / 1000).toFixed(1)}L. Target ${(waterTarget / 1000).toFixed(1)}L — refill and drink now.` };
  }
  if (gymSessions.length > 0) {
    return { tone: "Good", title: "On track", body: `${last7} sessions this week. Next: ${nextInRotation()}. Keep the rotation moving.` };
  }
  return { tone: "Good", title: "Building momentum", body: `${last7} sessions this week. Consistency beats intensity.` };
}

// ─── Macro bar sub-component ───
function MacroBar({ label, value, target, unit, color }: {
  label: string; value: number; target: number; unit: string; color: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div>
      <div style={{ fontSize: 11, color: color, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div className="num" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, letterSpacing: -0.5 }}>
        {Math.round(value)}<span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>/{target}{unit}</span>
      </div>
      <div style={{ height: 6, background: C.surface, borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

export default function Dashboard(props: Props) {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [tab, setTab] = useState("Home");
  const [foodView, setFoodView] = useState("LOG");
  const [profile, setProfile] = useState(props.initialProfile);
  const [workouts, setWorkouts] = useState(props.initialWorkouts);
  const [body, setBody] = useState(props.initialBody);
  const [food, setFood] = useState(props.initialFood);
  const [hydration, setHydration] = useState(props.initialHydration);
  const [prefs, setPrefs] = useState(props.initialPrefs);
  const [modal, setModal] = useState<string | null>(null);
  const [recipeMeal, setRecipeMeal] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoggerTab, setInitialLoggerTab] = useState("recent");

  const todayKey = new Date().toISOString().slice(0, 10);

  const recentFoods = useMemo(() => buildRecentFoods(food), [food]);

  // ── Save handlers ──
  const addWorkout = async (w: any) => {
    setSaving(true);
    const { data, error } = await supabase.from("workouts").insert({
      user_id: (await supabase.auth.getUser()).data.user!.id,
      date: w.date, type: w.type, exercises: w.exercises, steps: w.steps, notes: w.notes,
    }).select().single();
    setSaving(false);
    if (error) { alert("Save failed: " + error.message); return; }
    setWorkouts([data, ...workouts]);
    setModal(null);
  };

  const addBody = async (b: any) => {
    setSaving(true);
    const { data, error } = await supabase.from("body_stats").insert({
      user_id: (await supabase.auth.getUser()).data.user!.id, ...b,
    }).select().single();
    setSaving(false);
    if (error) { alert("Save failed: " + error.message); return; }
    setBody([data, ...body]);
    setModal(null);
  };

  const addFood = async (f: any) => {
    setSaving(true);
    const userId = (await supabase.auth.getUser()).data.user!.id;
    let photoPath: string | null = null;

    if (f.photoBlob) {
      const filename = `${userId}/${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("meal-photos")
        .upload(filename, f.photoBlob, { contentType: "image/jpeg" });
      if (uploadErr) {
        setSaving(false);
        alert("Photo upload failed: " + uploadErr.message);
        return;
      }
      photoPath = filename;
    }

    const { data, error } = await supabase.from("food_logs").insert({
      user_id: userId,
      date: f.date, meal: f.meal,
      description: f.description,
      product_name: f.product_name || null,
      portion_g: f.portion_g || null,
      barcode: f.barcode || null,
      source: f.source || "manual",
      kcal: f.kcal, protein_g: f.protein_g,
      carbs_g: f.carbs_g || null, fat_g: f.fat_g || null,
      photo_path: photoPath,
      ai_analysis: f.ai_analysis || null,
    }).select().single();
    setSaving(false);
    if (error) { alert("Save failed: " + error.message); return; }
    setFood([data, ...food]);
    setModal(null);
  };

  const saveProfile = async (p: any) => {
    setSaving(true);
    const userId = (await supabase.auth.getUser()).data.user!.id;
    const { data, error } = await supabase.from("profiles")
      .update({ ...p, updated_at: new Date().toISOString() })
      .eq("id", userId).select().single();
    setSaving(false);
    if (error) { alert("Save failed: " + error.message); return; }
    setProfile(data);
    setModal(null);
  };

  const savePrefs = async (p: any) => {
    setSaving(true);
    const userId = (await supabase.auth.getUser()).data.user!.id;
    const { data, error } = await supabase.from("preferences")
      .upsert({ user_id: userId, ...p, updated_at: new Date().toISOString() })
      .select().single();
    setSaving(false);
    if (error) { alert("Save failed: " + error.message); return; }
    setPrefs(data);
    setModal(null);
  };

  const addWater = async (ml: number) => {
    const userId = (await supabase.auth.getUser()).data.user!.id;
    const existing = hydration.find(h => h.date === todayKey);
    const currentMl = existing?.ml || 0;
    const newMl = Math.max(0, currentMl + ml);
    const { data, error } = await supabase.from("hydration")
      .upsert({ user_id: userId, date: todayKey, ml: newMl }, { onConflict: "user_id,date" })
      .select().single();
    if (error) { console.error("Hydration save error:", error); return; }
    setHydration(hydration.filter(h => h.date !== todayKey).concat(data));
  };

  const delItem = async (table: string, id: string, listSetter: any, list: any[]) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { alert("Delete failed: " + error.message); return; }
    listSetter(list.filter(x => x.id !== id));
  };

  const quickLogMeal = async (mealType: string, template: any) => {
    await addFood({
      date: todayKey, meal: mealType,
      description: `${template.name} — ${template.desc}`,
      product_name: template.name,
      source: "plan",
      protein_g: template.protein, kcal: template.kcal,
      carbs_g: template.carbs, fat_g: template.fat,
    });
    setRecipeMeal(null);
  };

  const hideMeal = async (name: string) => {
    await savePrefs({ ...prefs, hidden_meals: [...(prefs.hidden_meals || []), name] });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const copyBrief = async () => {
    try {
      const res = await fetch("/api/brief");
      const json = await res.json();
      await navigator.clipboard.writeText(json.brief);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err: any) {
      alert("Failed to copy brief: " + err.message);
    }
  };

  // ── Openers ──
  const openLogger = (t: string) => {
    setInitialLoggerTab(t);
    setModal("food-logger");
  };

  // ── Computed ──
  const visibleMeals = (mealType: string) =>
    (FOOD_PLAN[mealType] || []).filter(m => {
      if (prefs.hidden_meals?.includes(m.name)) return false;
      if (m.tags?.some((t: string) => prefs.excluded_tags?.includes(t))) return false;
      return true;
    });

  const latestBody = body[0];
  const prevBody = body[1];
  const last7Workouts = workouts.filter(w => (Date.now() - new Date(w.date).getTime()) / 86400000 <= 7).length;
  const daysToGoal = daysUntil(profile?.phase_goal_date);

  const todayFood = food.filter(f => f.date === todayKey);
  const todayProtein = todayFood.reduce((s, f) => s + (Number(f.protein_g) || 0), 0);
  const todayKcal = todayFood.reduce((s, f) => s + (Number(f.kcal) || 0), 0);
  const todayCarbs = todayFood.reduce((s, f) => s + (Number(f.carbs_g) || 0), 0);
  const todayFat = todayFood.reduce((s, f) => s + (Number(f.fat_g) || 0), 0);
  const todayHydRow = hydration.find(h => h.date === todayKey);
  const todayWater = todayHydRow?.ml || 0;
  const todaySessions = workouts.filter(w => w.date === todayKey).length;
  const todaySteps = workouts.find(w => w.date === todayKey && w.steps)?.steps || 0;

  const proteinTarget = profile?.protein_target_g || 220;
  const kcalTarget = profile?.kcal_target || 2400;
  const carbTarget = profile?.carb_target_g || 240;
  const fatTarget = profile?.fat_target_g || 80;
  const waterTarget = profile?.hydration_target_ml || 4500;
  const waterPct = Math.min(100, Math.round((todayWater / waterTarget) * 100));

  const coach = coachMessage(workouts, food, hydration, profile, todayKey);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, paddingBottom: 100 }}>
      {saving && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 200, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="spinner" /> Saving…
        </div>
      )}

      {/* Sticky Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        padding: "22px 20px 16px",
        background: "rgba(26, 29, 31, 0.9)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        paddingTop: "calc(22px + env(safe-area-inset-top))",
      }}>
        <div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 4, fontWeight: 500 }}>
            {profile?.name || props.userEmail}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>
            Iron<span style={{ color: C.accent }}>Fit</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setModal("profile")} style={{
            background: profile?.name ? C.surface : C.accent,
            color: profile?.name ? C.text : C.bg,
            border: profile?.name ? `1px solid ${C.border}` : "none",
            borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>{profile?.name ? "Profile" : "Set Up"}</button>
          <button onClick={signOut} style={{
            background: "transparent", color: C.muted, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>Sign out</button>
        </div>
      </div>

      {/* Sticky Tabs */}
      <div style={{
        position: "sticky", top: "calc(93px + env(safe-area-inset-top))", zIndex: 49,
        display: "flex",
        background: "rgba(26, 29, 31, 0.9)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`, overflowX: "auto",
      }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, minWidth: 72, background: "transparent",
            color: tab === t ? C.accent : C.muted, border: "none",
            borderBottom: `2px solid ${tab === t ? C.accent : "transparent"}`,
            padding: "14px 8px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "20px 20px 16px" }}>
        {tab === "Home" && (
          <>
            {/* Phase Hero */}
            {profile?.phase_goal_date && (
              <Card style={{
                background: `linear-gradient(135deg, ${C.card} 0%, ${C.cardHi} 100%)`,
                borderLeft: `4px solid ${C.accent}`, padding: "22px 22px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 12, letterSpacing: 1.5, color: C.accent, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>{profile.phase_name || "Boost"} Phase</div>
                    <div style={{ fontSize: 17, color: C.textHi, fontWeight: 700, marginBottom: 4 }}>{profile.phase_goal_label || "—"}</div>
                    <div className="num" style={{ fontSize: 13, color: C.muted }}>{profile.phase_goal_date}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="num" style={{ fontSize: 58, fontWeight: 800, color: C.accent, lineHeight: 0.9, letterSpacing: -2 }}>{daysToGoal ?? "—"}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 4, fontWeight: 500 }}>days to go</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Today Macros — 4-bar grid */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
                <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Today</div>
                <div className="num" style={{ fontSize: 12, color: C.dim }}>{todayKey}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                <MacroBar label="kcal" value={todayKcal} target={kcalTarget} unit="" color={MACRO_COLORS.kcal} />
                <MacroBar label="protein" value={todayProtein} target={proteinTarget} unit="g" color={MACRO_COLORS.protein} />
                <MacroBar label="carbs" value={todayCarbs} target={carbTarget} unit="g" color={MACRO_COLORS.carbs} />
                <MacroBar label="fat" value={todayFat} target={fatTarget} unit="g" color={MACRO_COLORS.fat} />
              </div>

              {/* Water */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: C.blue, fontWeight: 600, marginBottom: 6 }}>WATER</div>
                <div className="num" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>
                  {(todayWater / 1000).toFixed(1)}<span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>/{(waterTarget / 1000).toFixed(1)}L</span>
                </div>
                <div style={{ height: 6, background: C.surface, borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${waterPct}%`, background: C.blue, borderRadius: 3, transition: "width 0.4s" }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                <Btn sm color={C.blue} ghost onClick={() => addWater(250)}>+250</Btn>
                <Btn sm color={C.blue} ghost onClick={() => addWater(500)}>+500</Btn>
                <Btn sm color={C.blue} ghost onClick={() => addWater(1000)}>+1L</Btn>
                <Btn sm color={C.muted} ghost onClick={() => addWater(-250)}>–250</Btn>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <Stat label="Sessions" value={todaySessions} unit="" color={todaySessions > 0 ? C.accent : C.textHi} />
                <Stat label="Steps" value={todaySteps ? `${(todaySteps / 1000).toFixed(1)}k` : "—"} unit="" />
              </div>
            </Card>

            {/* Coach */}
            <Card accent={coach.tone === "Focus" ? C.red : coach.tone === "Food" ? C.orange : coach.tone === "Hydrate" ? C.blue : C.accent}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Coach Check-in</div>
                <div style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{coach.tone}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: C.textHi }}>{coach.title}</div>
              <div style={{ fontSize: 14, color: C.dim, lineHeight: 1.55 }}>{coach.body}</div>
            </Card>

            <SectionLabel>Quick Log</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <Btn color={C.accent} onClick={() => setModal("workout")}>+ Workout</Btn>
              <Btn color={C.orange} onClick={() => openLogger("recent")}>+ Meal</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
              <Btn color={C.orange} ghost onClick={() => openLogger("scan")}>📷 Scan Barcode</Btn>
              <Btn color={C.blue} onClick={() => setModal("body")}>+ Body Stats</Btn>
            </div>

            <Card accent={C.blue}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Latest Body</div>
                {latestBody && <div className="num" style={{ fontSize: 12, color: C.dim }}>{latestBody.date}</div>}
              </div>
              {latestBody ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {SCALE.filter(f => latestBody[f.k] !== null && latestBody[f.k] !== undefined).slice(0, 4).map(f => {
                    const delta = prevBody?.[f.k] != null ? (latestBody[f.k] - prevBody[f.k]) : null;
                    return <Stat key={f.k} label={f.l} value={latestBody[f.k]} unit={f.u} delta={delta !== null ? (delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)) : null} />;
                  })}
                </div>
              ) : <div style={{ color: C.dim, fontSize: 14, textAlign: "center", padding: "20px 0" }}>No body data yet — tap Body tab to log first reading</div>}
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Card style={{ padding: "18px 8px", margin: 0, textAlign: "center" }}>
                <div className="num" style={{ fontSize: 30, fontWeight: 700, color: C.accent, letterSpacing: -1 }}>{last7Workouts}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 8, fontWeight: 500 }}>Sessions / 7d</div>
              </Card>
              <Card style={{ padding: "18px 8px", margin: 0, textAlign: "center" }}>
                <div className="num" style={{ fontSize: 30, fontWeight: 700, color: C.blue, letterSpacing: -1 }}>{body.length}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 8, fontWeight: 500 }}>Body Logs</div>
              </Card>
              <Card style={{ padding: "18px 8px", margin: 0, textAlign: "center" }}>
                <div className="num" style={{ fontSize: 30, fontWeight: 700, color: C.orange, letterSpacing: -1 }}>{food.length}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 8, fontWeight: 500 }}>Meals</div>
              </Card>
            </div>
          </>
        )}

        {tab === "Train" && (
          <>
            <Btn color={C.accent} full onClick={() => setModal("workout")} style={{ padding: 16, marginBottom: 18 }}>+ Log New Session</Btn>
            {workouts.length === 0 && <div style={{ color: C.dim, textAlign: "center", padding: 40, fontSize: 15 }}>No sessions logged yet</div>}
            {workouts.map(w => {
              const p = (PLAN as any)[w.type];
              return (
                <Card key={w.id} accent={p?.color}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{p?.icon} {p?.label}</div>
                      <div className="num" style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{w.date} {w.steps && `· ${w.steps} steps`}</div>
                    </div>
                    <button onClick={() => delItem("workouts", w.id, setWorkouts, workouts)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13 }}>Delete</button>
                  </div>
                  {(w.exercises || []).map((e: any, i: number) => (
                    <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < w.exercises.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{e.name}</div>
                      {e.setLog?.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                          {e.setLog.map((s: any, si: number) => (
                            <div key={si} className="num" style={{ background: C.surface, borderRadius: 6, padding: "4px 10px", fontSize: 12, color: C.dim }}>
                              <span style={{ color: C.muted, fontWeight: 700 }}>{si + 1}</span>{" "}{s.reps || "?"}
                              {s.weight && <span style={{ color: p?.color }}> @ {s.weight}kg</span>}
                              {s.rir && <span style={{ color: C.muted, marginLeft: 4 }}>· {s.rir} RIR</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="num" style={{ fontSize: 13, color: C.dim }}>
                          {e.sets && `${e.sets}×${e.reps}`} {e.weight && `@ ${e.weight}kg`}
                        </div>
                      )}
                      {e.notes && <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic", marginTop: 4 }}>{e.notes}</div>}
                    </div>
                  ))}
                  {w.notes && <div style={{ fontSize: 13, color: C.muted, fontStyle: "italic", marginTop: 6, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>&quot;{w.notes}&quot;</div>}
                </Card>
              );
            })}
          </>
        )}

        {tab === "Body" && (
          <>
            <Btn color={C.blue} full onClick={() => setModal("body")} style={{ padding: 16, marginBottom: 18 }}>+ Log Scale Reading</Btn>
            {body.length === 0 && <div style={{ color: C.dim, textAlign: "center", padding: 40, fontSize: 15 }}>No body data yet</div>}
            {body.map(b => (
              <Card key={b.id} accent={C.blue}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div className="num" style={{ fontSize: 15, fontWeight: 700 }}>{b.date}</div>
                  <button onClick={() => delItem("body_stats", b.id, setBody, body)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13 }}>Delete</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {SCALE.filter(f => b[f.k] !== null && b[f.k] !== undefined).map(f => (
                    <div key={f.k} style={{ fontSize: 14 }}>
                      <span style={{ color: C.muted }}>{f.l}:</span> <span className="num" style={{ color: C.textHi, fontWeight: 600 }}>{b[f.k]}{f.u}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </>
        )}

        {tab === "Food" && (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 16, background: C.card, borderRadius: 12, padding: 4 }}>
              {["LOG", "PLAN"].map(v => (
                <button key={v} onClick={() => setFoodView(v)} style={{
                  flex: 1, background: foodView === v ? C.orange : "transparent",
                  color: foodView === v ? C.bg : C.dim, border: "none", borderRadius: 8,
                  padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>{v === "LOG" ? "Log" : "Plan"}</button>
              ))}
            </div>

            {foodView === "LOG" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <Btn color={C.orange} onClick={() => openLogger("scan")}>📷 Scan</Btn>
                  <Btn color={C.orange} ghost onClick={() => openLogger("search")}>🔎 Search</Btn>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                  <Btn color={C.orange} ghost onClick={() => setModal("scan")}>✨ AI Photo</Btn>
                  <Btn color={C.orange} ghost onClick={() => openLogger("manual")}>✏ Manual</Btn>
                </div>

                {food.length === 0 && <div style={{ color: C.dim, textAlign: "center", padding: 40, fontSize: 15 }}>No meals logged yet</div>}
                {food.map(f => (
                  <FoodCard key={f.id} f={f} onDelete={() => delItem("food_logs", f.id, setFood, food)} />
                ))}
              </>
            )}

            {foodView === "PLAN" && (
              <>
                <Btn color={C.orange} ghost full onClick={() => setModal("customise")} style={{ padding: 14, marginBottom: 16 }}>
                  ⚙ Customise Plan {(prefs.excluded_tags?.length > 0 || prefs.hidden_meals?.length > 0) && `(${(prefs.excluded_tags?.length || 0) + (prefs.hidden_meals?.length || 0)})`}
                </Btn>
                {Object.keys(FOOD_PLAN).map(mealType => {
                  const meals = visibleMeals(mealType);
                  return (
                    <div key={mealType} style={{ marginTop: 18 }}>
                      <SectionLabel>{mealType}</SectionLabel>
                      {meals.length === 0 ? (
                        <div style={{ color: C.dim, fontSize: 13, textAlign: "center", padding: 18, background: C.card, borderRadius: 12 }}>All options filtered — adjust in Customise</div>
                      ) : meals.map((opt, i) => (
                        <Card key={i} accent={C.orange} style={{ padding: "16px 18px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{opt.name}</div>
                            <div style={{ display: "flex", gap: 10, fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>
                              <span className="num">{opt.kcal}<span style={{ color: C.border }}>kcal</span></span>
                              <span className="num" style={{ color: C.orange, fontWeight: 700 }}>{opt.protein}g</span>
                            </div>
                          </div>
                          <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.5, marginBottom: 12 }}>{opt.desc}</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Btn sm color={C.orange} onClick={() => setRecipeMeal({ meal: opt, mealType })} style={{ flex: 2 }}>View Recipe</Btn>
                            <Btn sm color={C.orange} ghost onClick={() => quickLogMeal(mealType, opt)} style={{ flex: 1 }}>+ Log</Btn>
                            <button onClick={() => hideMeal(opt.name)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 10, padding: "8px 12px", fontSize: 12, cursor: "pointer" }}>Hide</button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}

        {tab === "Brief" && (
          <>
            <Card accent={C.purple}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>📋 Brief for Claude</div>
              <div style={{ fontSize: 14, color: C.dim, lineHeight: 1.55, marginBottom: 14 }}>
                A formatted summary of all your data — profile, body trends, training, nutrition. Paste it into a Claude chat for personalised feedback.
              </div>
              <Btn color={C.purple} full onClick={copyBrief} style={{ padding: 16 }}>
                {copied ? "✓ Copied — paste to Claude" : "Copy Brief to Clipboard"}
              </Btn>
            </Card>
          </>
        )}
      </div>

      {modal === "workout" && <WorkoutForm onSave={addWorkout} onClose={() => setModal(null)} workouts={workouts} />}
      {modal === "body" && <BodyForm onSave={addBody} onClose={() => setModal(null)} />}
      {modal === "food-logger" && <FoodLogger onSave={addFood} onClose={() => setModal(null)} recentFoods={recentFoods} initialTab={initialLoggerTab} />}
      {modal === "scan" && <PhotoLogger onSave={addFood} onClose={() => setModal(null)} />}
      {modal === "profile" && <ProfileForm profile={profile} onSave={saveProfile} onClose={() => setModal(null)} />}
      {modal === "customise" && <CustomiseModal prefs={prefs} onSave={savePrefs} onClose={() => setModal(null)} />}
      {recipeMeal && <RecipeModal meal={recipeMeal.meal} mealType={recipeMeal.mealType} onClose={() => setRecipeMeal(null)} onLog={quickLogMeal} />}
    </div>
  );
}

// ─── Food card sub-component ───
function FoodCard({ f, onDelete }: any) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useMemo(() => {
    if (!f.photo_path) return;
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.storage.from("meal-photos").createSignedUrl(f.photo_path, 3600);
      if (data) setPhotoUrl(data.signedUrl);
    })();
  }, [f.photo_path]);

  const sourceEmoji: Record<string, string> = {
    barcode: "📷", search: "🔎", "ai-photo": "✨", manual: "✏", plan: "📋", recent: "⏱",
  };

  return (
    <Card accent={C.orange}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, color: C.orange, fontWeight: 700 }}>
            {f.source && sourceEmoji[f.source] && <span style={{ marginRight: 6 }}>{sourceEmoji[f.source]}</span>}
            {f.meal}
          </div>
          <div className="num" style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{f.date}</div>
        </div>
        <button onClick={onDelete} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13 }}>Delete</button>
      </div>
      {photoUrl && <img src={photoUrl} alt="meal" style={{ width: "100%", borderRadius: 8, marginBottom: 10, maxHeight: 240, objectFit: "cover" }} />}
      <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>{f.description}</div>
      <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 13, color: C.muted, flexWrap: "wrap" }}>
        {f.kcal != null && <span className="num">{f.kcal} kcal</span>}
        {f.protein_g != null && <span className="num" style={{ color: MACRO_COLORS.protein }}>{f.protein_g}gP</span>}
        {f.carbs_g != null && <span className="num" style={{ color: MACRO_COLORS.carbs }}>{f.carbs_g}gC</span>}
        {f.fat_g != null && <span className="num" style={{ color: MACRO_COLORS.fat }}>{f.fat_g}gF</span>}
        {f.ai_analysis?.confidence && (
          <span style={{ color: f.ai_analysis.confidence === "high" ? C.green : f.ai_analysis.confidence === "medium" ? C.amber : C.red, marginLeft: "auto" }}>
            ✨ {f.ai_analysis.confidence}
          </span>
        )}
      </div>
    </Card>
  );
}
