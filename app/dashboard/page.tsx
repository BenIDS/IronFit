import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load initial data server-side for fast first paint
  const [profileR, workoutsR, bodyR, foodR, hydrationR, prefsR] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("workouts").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(60),
    supabase.from("body_stats").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30),
    supabase.from("food_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(60),
    supabase.from("hydration").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(14),
    supabase.from("preferences").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <Dashboard
      userEmail={user.email || ""}
      initialProfile={profileR.data}
      initialWorkouts={workoutsR.data || []}
      initialBody={bodyR.data || []}
      initialFood={foodR.data || []}
      initialHydration={hydrationR.data || []}
      initialPrefs={prefsR.data || { excluded_tags: [], hidden_meals: [] }}
    />
  );
}
