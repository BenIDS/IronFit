import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getExercise } from "@/lib/exercises";

export const revalidate = 86400; // 24h — details rarely change

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const exercise = await getExercise(params.id);
    if (!exercise) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ exercise }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load exercise" }, { status: 500 });
  }
}
