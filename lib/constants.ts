// ═══════════════════════════════════════════════════════════════
// Shared constants, plan data, and design tokens
// ═══════════════════════════════════════════════════════════════

export const C = {
  bg: "#1A1D1F",
  surface: "#22262A",
  card: "#282D31",
  cardHi: "#30363B",
  border: "#3A4046",
  borderHi: "#4A5158",
  muted: "#8B9299",
  dim: "#B0B7BE",
  text: "#E8EAED",
  textHi: "#F5F7F9",
  accent: "#7DD87A",
  accentDim: "#7DD87A22",
  blue: "#7EC8E3",
  orange: "#F0A868",
  purple: "#C89BE0",
  green: "#7DD87A",
  amber: "#F5C86B",
  red: "#E8877C",
};

// Macro colours — used consistently for rings, bars, labels
export const MACRO_COLORS = {
  kcal: C.accent,
  protein: C.orange,
  carbs: C.blue,
  fat: C.amber,
};

// Auto-derive macro targets from kcal and protein
export function deriveMacroTargets(kcal_target: number, protein_target_g: number) {
  const proteinKcal = protein_target_g * 4;
  const remaining = Math.max(0, kcal_target - proteinKcal);
  // 40% carbs / 30% fat of remaining kcal (weighted toward carbs for training days)
  const carbKcal = remaining * 0.60;
  const fatKcal = remaining * 0.40;
  return {
    carb_target_g: Math.round(carbKcal / 4),
    fat_target_g: Math.round(fatKcal / 9),
  };
}

export const PLAN = {
  push: {
    label: "Push", sub: "Chest · Shoulders · Triceps", color: "#E8877C", icon: "💥",
    exercises: [
      { name: "Barbell Bench Press", sets: 4, reps: "6-10", startWeight: 60, rule: "+2.5kg when top of range hit with 1-2 RIR" },
      { name: "Incline DB Press", sets: 4, reps: "8-12", startWeight: 22, rule: "+1kg per DB when top of range hit" },
      { name: "Seated Shoulder Press", sets: 4, reps: "8-12", startWeight: 40, rule: "+2.5kg when last set has 1-2 RIR" },
      { name: "Cable Chest Fly", sets: 3, reps: "12-15", startWeight: 15, rule: "Slow eccentric, squeeze at midline" },
      { name: "Lateral Raises", sets: 4, reps: "12-15", startWeight: 8, rule: "+1kg per DB or +2 reps. Never swing" },
      { name: "Tricep Rope Pushdown", sets: 3, reps: "12-15", startWeight: 25, rule: "+2.5kg when last set has 2 RIR" },
    ],
  },
  pull: {
    label: "Pull", sub: "Back · Biceps · Rear Delts", color: "#7EC8E3", icon: "🎯",
    exercises: [
      { name: "Deadlift", sets: 4, reps: "5-8", startWeight: 100, rule: "+5kg when last set has 1-2 RIR. Deload every 4 weeks" },
      { name: "Lat Pulldown", sets: 4, reps: "8-12", startWeight: 60, rule: "Wide grip, elbows drive down. +2.5kg progression" },
      { name: "Barbell Row", sets: 4, reps: "8-10", startWeight: 60, rule: "Chest supported or bent-over. +2.5kg when top hit" },
      { name: "Seated Cable Row", sets: 3, reps: "10-12", startWeight: 55, rule: "Squeeze shoulder blades. +2.5kg progression" },
      { name: "Face Pulls", sets: 3, reps: "15-20", startWeight: 20, rule: "Rear delt & upper back health. Controlled tempo" },
      { name: "Barbell Curl", sets: 3, reps: "10-12", startWeight: 20, rule: "+1kg per side when last set has 1-2 RIR" },
    ],
  },
  legs: {
    label: "Legs", sub: "Quads · Hams · Glutes · Calves", color: "#7DD87A", icon: "🦵",
    exercises: [
      { name: "Barbell Back Squat", sets: 4, reps: "6-10", startWeight: 80, rule: "Depth first, weight second. +5kg when clean" },
      { name: "Romanian Deadlift", sets: 4, reps: "8-10", startWeight: 70, rule: "Feel hamstrings stretch. +2.5kg progression" },
      { name: "Leg Press", sets: 3, reps: "10-15", startWeight: 140, rule: "Full ROM. +10kg when last set hits 15" },
      { name: "Bulgarian Split Squat", sets: 3, reps: "10 each leg", startWeight: 10, rule: "DB in each hand. +1kg per DB when clean" },
      { name: "Hamstring Curl", sets: 3, reps: "12-15", startWeight: 35, rule: "Slow eccentric. +2.5kg when top hit" },
      { name: "Standing Calf Raise", sets: 4, reps: "12-15", startWeight: 40, rule: "Full ROM, pause at top. +2.5kg progression" },
    ],
  },
  home: {
    label: "Home", sub: "Bodyweight backup session", color: "#F0A868", icon: "🏠",
    exercises: [
      { name: "Push-Ups", sets: 3, reps: "max", startWeight: 0, rule: "Elevate feet when reps > 15" },
      { name: "Bulgarian Split Squat", sets: 3, reps: "10 each leg", startWeight: 0, rule: "Add backpack once easy" },
      { name: "Pike Push-Up", sets: 3, reps: "10-12", startWeight: 0, rule: "Elevate hands as reps improve" },
      { name: "Hip Thrust", sets: 3, reps: "20", startWeight: 0, rule: "Backpack loaded when easy" },
      { name: "Plank Circuit", sets: 3, reps: "30s + 20s each side", startWeight: 0, rule: "Add 10s each week" },
      { name: "Jump Rope", sets: 3, reps: "1 min", startWeight: 0, rule: "Optional conditioning finisher" },
    ],
  },
  sport: {
    label: "Sport", sub: "Padel · Cricket · Hike", color: "#C89BE0", icon: "🎾",
    exercises: [
      { name: "Padel", sets: 1, reps: "60-90 min", startWeight: 0, rule: "Log duration + soreness day after" },
      { name: "Cricket", sets: 1, reps: "match", startWeight: 0, rule: "Track batting/bowling load" },
      { name: "Hiking", sets: 1, reps: "distance", startWeight: 0, rule: "Aim 10km+ on hike days" },
      { name: "Cycling", sets: 1, reps: "distance", startWeight: 0, rule: "" },
      { name: "Swimming", sets: 1, reps: "distance", startWeight: 0, rule: "" },
      { name: "Other", sets: 1, reps: "duration", startWeight: 0, rule: "Note intensity 1-10" },
    ],
  },
};

export const SCALE = [
  { k: "weight_kg", l: "Weight", u: "kg" },
  { k: "body_fat_pct", l: "Body Fat", u: "%" },
  { k: "waist_cm", l: "Waist", u: "cm" },
  { k: "muscle_mass_kg", l: "Muscle", u: "kg" },
  { k: "water_pct", l: "Water", u: "%" },
  { k: "visceral_fat", l: "Visceral", u: "" },
  { k: "bone_mass_kg", l: "Bone", u: "kg" },
  { k: "bmr_kcal", l: "BMR", u: "kcal" },
  { k: "metabolic_age", l: "Met. Age", u: "yrs" },
];

export const MEALS = ["Meal 1", "Snack 1", "Meal 2", "Snack 2", "Meal 3"];
export const TABS = ["Home", "Train", "Body", "Food", "Brief"];

// Common quick-portion presets (grams). Users can add their own to portion_library.
export const QUICK_PORTIONS = [
  { label: "30g", grams: 30 },
  { label: "50g", grams: 50 },
  { label: "100g", grams: 100 },
  { label: "150g", grams: 150 },
  { label: "200g", grams: 200 },
  { label: "250g", grams: 250 },
];

export const EXCLUDABLE = [
  { tag: "eggs", label: "Eggs" },
  { tag: "dairy", label: "Dairy" },
  { tag: "gluten", label: "Gluten / Wheat" },
  { tag: "nuts", label: "Nuts / Peanut Butter" },
  { tag: "rice", label: "Rice" },
  { tag: "whey", label: "Whey Protein" },
];

export const FOOD_PLAN: Record<string, Array<{
  name: string; desc: string; kcal: number; protein: number;
  carbs?: number; fat?: number;
  ingr: string[]; steps: string[]; tags: string[];
}>> = {
  "Meal 1": [
    { name: "Chicken Sausage Muffin Plate", desc: "Chicken sausages, muffin, pineapple, spinach", kcal: 510, protein: 47, carbs: 50, fat: 12,
      ingr: ["3 lean chicken sausages", "1 wholemeal English muffin", "150g fresh pineapple", "Handful spinach", "1 tsp brown sauce"],
      steps: ["Grill or air-fry sausages", "Toast the muffin", "Wilt spinach 60s", "Serve with pineapple"], tags: ["chicken", "gluten"] },
    { name: "Steak Breakfast Hash", desc: "Lean steak, potatoes, mushrooms, tomato, pineapple", kcal: 560, protein: 52, carbs: 55, fat: 14,
      ingr: ["150g lean steak strips", "250g potatoes, diced", "150g mushrooms", "1 large tomato", "100g pineapple", "1 tsp olive oil"],
      steps: ["Microwave potatoes 5 min", "Pan-fry with oil and paprika", "Add mushrooms 3 min", "Sear steak", "Plate with pineapple"], tags: ["beef"] },
    { name: "Turkey Bagel Stack", desc: "Cooked turkey, bagel thin, light cheese, pineapple", kcal: 500, protein: 50, carbs: 48, fat: 10,
      ingr: ["180g cooked turkey breast", "1 bagel thin", "20g light cheese", "Lettuce", "100g pineapple"],
      steps: ["Toast bagel thin", "Warm turkey", "Build with cheese and leaves", "Pineapple on side"], tags: ["turkey", "gluten", "dairy"] },
  ],
  "Snack 1": [
    { name: "Whey & Pineapple Slush", desc: "Whey, pineapple, ice, water", kcal: 250, protein: 30, carbs: 20, fat: 3,
      ingr: ["1 scoop whey", "150g pineapple", "Ice", "200ml water"],
      steps: ["Blend 30s", "Drink slowly"], tags: ["whey"] },
    { name: "Chicken Snack Box", desc: "Cooked chicken, pineapple, cucumber", kcal: 300, protein: 38, carbs: 20, fat: 8,
      ingr: ["140g cooked chicken", "150g pineapple", "½ cucumber", "Chilli flakes"],
      steps: ["Slice and pack", "Season before eating"], tags: ["chicken"] },
  ],
  "Meal 2": [
    { name: "Firecracker Chicken Rice Bowl", desc: "Chicken, jasmine rice, broccoli, chilli sauce", kcal: 620, protein: 58, carbs: 65, fat: 12,
      ingr: ["220g chicken breast", "220g cooked rice", "200g broccoli", "1 tbsp sweet chilli", "1 tbsp soy"],
      steps: ["Cook chicken in strips", "Steam broccoli", "Stir sauce", "Add rice and toss"], tags: ["chicken", "rice"] },
    { name: "Turkey Taco Rice Box", desc: "Turkey mince, rice, salsa, lettuce, cheese", kcal: 610, protein: 55, carbs: 60, fat: 14,
      ingr: ["220g 5% turkey mince", "200g rice", "100g salsa", "Lettuce", "20g light cheese"],
      steps: ["Brown turkey", "Warm rice", "Build bowl", "Add lime"], tags: ["turkey", "rice", "dairy"] },
    { name: "Chicken Gyros Plate", desc: "Chicken, flatbread, salad, garlic sauce", kcal: 650, protein: 60, carbs: 55, fat: 16,
      ingr: ["220g chicken", "1 small flatbread", "Salad", "2 tbsp light garlic sauce", "Lemon"],
      steps: ["Season with lemon, oregano", "Grill chicken", "Warm flatbread", "Plate"], tags: ["chicken", "gluten", "dairy"] },
    { name: "Beef & Potato Bowl", desc: "Lean mince, potatoes, green beans, gravy", kcal: 620, protein: 55, carbs: 58, fat: 15,
      ingr: ["220g 5% beef mince", "300g potatoes", "180g green beans", "150ml stock"],
      steps: ["Boil potatoes", "Brown mince", "Steam beans", "Make gravy"], tags: ["beef"] },
  ],
  "Snack 2": [
    { name: "Chicken Rice Cakes", desc: "Chicken, rice cakes, hot sauce", kcal: 280, protein: 35, carbs: 25, fat: 6,
      ingr: ["120g cooked chicken", "3 rice cakes", "Hot sauce", "Cucumber"],
      steps: ["Top rice cakes", "Add sauce"], tags: ["chicken"] },
    { name: "Turkey & Pretzel Box", desc: "Cooked turkey, pretzels, pineapple", kcal: 330, protein: 34, carbs: 35, fat: 6,
      ingr: ["120g cooked turkey", "30g pretzels", "100g pineapple"],
      steps: ["Pack together"], tags: ["turkey", "gluten"] },
    { name: "Beef Biltong & Banana", desc: "Biltong, banana, rice cakes", kcal: 320, protein: 32, carbs: 40, fat: 5,
      ingr: ["60g biltong", "1 banana", "2 rice cakes"],
      steps: ["No prep"], tags: ["beef"] },
  ],
  "Meal 3": [
    { name: "Katsu-Style Chicken Bowl", desc: "Chicken, rice, peas, curry sauce", kcal: 680, protein: 60, carbs: 72, fat: 15,
      ingr: ["220g chicken", "220g rice", "100g peas", "100g carrots", "150ml katsu sauce"],
      steps: ["Cook chicken", "Warm rice", "Heat sauce", "Top with spring onion"], tags: ["chicken", "rice"] },
    { name: "Lean Burger Plate", desc: "Beef patties, wedges, salad", kcal: 690, protein: 58, carbs: 62, fat: 20,
      ingr: ["220g 5% beef mince", "350g potato wedges", "Big salad", "1 tbsp light burger sauce"],
      steps: ["Shape patties", "Bake wedges", "Pan-fry patties", "Plate"], tags: ["beef", "gluten"] },
    { name: "Chicken Fajita Rice", desc: "Chicken, rice, onions, mushrooms, salsa", kcal: 640, protein: 58, carbs: 65, fat: 12,
      ingr: ["220g chicken", "220g rice", "1 onion", "150g mushrooms", "100g salsa"],
      steps: ["Cook chicken", "Add veg", "Warm rice", "Serve"], tags: ["chicken", "rice"] },
    { name: "Turkey Meatball Pasta", desc: "Turkey meatballs, pasta, tomato sauce", kcal: 670, protein: 58, carbs: 68, fat: 15,
      ingr: ["220g 5% turkey mince", "75g dry pasta", "200g passata", "Garlic, oregano"],
      steps: ["Shape meatballs", "Brown", "Simmer with passata", "Cook pasta"], tags: ["turkey", "gluten", "dairy"] },
  ],
};
