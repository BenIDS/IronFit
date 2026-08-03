// ═══════════════════════════════════════════════════════════════
// Free-Exercise-DB catalog helper
// - Fetches once per 6h, caches in-memory
// - Provides search / filter helpers
// - Maps default PLAN exercise names to catalog IDs
// - Data licence: Public Domain (Unlicense)
// - Source: github.com/yuhonas/free-exercise-db
// ═══════════════════════════════════════════════════════════════

const CATALOG_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const CACHE_MS = 6 * 60 * 60 * 1000;

export type Exercise = {
  id: string;
  name: string;
  force?: "push" | "pull" | "static" | null;
  level?: "beginner" | "intermediate" | "expert";
  mechanic?: "compound" | "isolation" | null;
  equipment?: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category?: string;
  images: string[];
};

// Slim shape returned to the client — no long instruction text
export type ExerciseSlim = {
  id: string;
  name: string;
  primaryMuscles: string[];
  equipment: string | null;
  images: string[];
};

let cache: { data: Exercise[]; ts: number } | null = null;

/**
 * Fetch the full catalog (server-side, cached 6h in-memory).
 * NB: on Vercel this cache lives per lambda instance; that's fine —
 * requests are also revalidated by Next.js fetch cache.
 */
export async function fetchExerciseCatalog(): Promise<Exercise[]> {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_MS) return cache.data;

  const res = await fetch(CATALOG_URL, {
    next: { revalidate: 21600 }, // 6h
  });
  if (!res.ok) {
    // If fetch fails and we have stale cache, use it
    if (cache) return cache.data;
    throw new Error(`Exercise catalog fetch failed: ${res.status}`);
  }
  const data = (await res.json()) as Exercise[];
  cache = { data, ts: now };
  return data;
}

export async function getCatalog(): Promise<Exercise[]> {
  return fetchExerciseCatalog();
}

/** Slim projection — safe to ship to the client. */
export async function getSlimCatalog(): Promise<ExerciseSlim[]> {
  const full = await fetchExerciseCatalog();
  return full.map(e => ({
    id: e.id,
    name: e.name,
    primaryMuscles: e.primaryMuscles || [],
    equipment: e.equipment || null,
    images: e.images || [],
  }));
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const full = await fetchExerciseCatalog();
  return full.find(e => e.id === id) || null;
}

/**
 * Client-side helper: given an ExerciseSlim[] and a query string,
 * return matching entries scored by relevance.
 * Prioritises: exact name → name prefix → name contains → muscle match.
 */
export function filterExercises(list: ExerciseSlim[], query: string, limit = 30): ExerciseSlim[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: Array<[ExerciseSlim, number]> = [];
  for (const ex of list) {
    const name = ex.name.toLowerCase();
    let score = 0;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 60;
    else {
      const muscles = ex.primaryMuscles.join(" ").toLowerCase();
      if (muscles.includes(q)) score = 30;
    }
    if (score > 0) scored.push([ex, score]);
  }
  return scored.sort((a, b) => b[1] - a[1]).slice(0, limit).map(s => s[0]);
}

/** Construct image URL from a catalog image path (e.g. "Barbell_Squat/0.jpg") */
export function exerciseImageUrl(imagePath: string): string {
  if (imagePath.startsWith("http")) return imagePath;
  return IMAGE_BASE + imagePath;
}

// ═══════════════════════════════════════════════════════════════
// Map default PLAN exercise names → Free-Exercise-DB catalog IDs
// so built-in exercises show demo images immediately without
// requiring the user to pick from the catalog first.
//
// Any exercise not in this map will just not show a demo until
// the user swaps it via the picker.
// ═══════════════════════════════════════════════════════════════

export const EXERCISE_NAME_TO_ID: Record<string, string> = {
  // Push day
  "Barbell Bench Press": "Barbell_Bench_Press_-_Medium_Grip",
  "Incline DB Press": "Incline_Dumbbell_Press",
  "Seated Shoulder Press": "Seated_Dumbbell_Press",
  "Cable Chest Fly": "Cable_Chest_Press",
  "Lateral Raises": "Side_Lateral_Raise",
  "Tricep Rope Pushdown": "Tricep_Dumbbell_Kickback", // closest match; user can swap
  // Pull day
  "Deadlift": "Barbell_Deadlift",
  "Lat Pulldown": "Wide-Grip_Lat_Pulldown",
  "Barbell Row": "Bent_Over_Barbell_Row",
  "Seated Cable Row": "Seated_Cable_Rows",
  "Face Pulls": "Face_Pull",
  "Barbell Curl": "Barbell_Curl",
  // Legs day
  "Barbell Back Squat": "Barbell_Squat",
  "Romanian Deadlift": "Romanian_Deadlift",
  "Leg Press": "Leg_Press",
  "Bulgarian Split Squat": "Dumbbell_Lunges", // catalog doesn't have exact; user can swap
  "Hamstring Curl": "Leg_Curl",
  "Standing Calf Raise": "Standing_Barbell_Calf_Raise",
  // Home / Sport — usually no direct catalog match, but a couple:
  "Push-Ups": "Pushups",
  "Pike Push-Up": "Pushups", // approx
  "Hip Thrust": "Barbell_Hip_Thrust",
  "Plank Circuit": "Plank",
  "Jump Rope": "Rope_Jumping",
};

/** Look up a catalog ID from an exercise display name (case-insensitive). */
export function findExerciseId(name: string): string | undefined {
  if (EXERCISE_NAME_TO_ID[name]) return EXERCISE_NAME_TO_ID[name];
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(EXERCISE_NAME_TO_ID)) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}
