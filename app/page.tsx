import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main style={{
      minHeight: "100vh",
      background: "#1A1D1F",
      color: "#E8EAED",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1.5, marginBottom: 12 }}>
        Iron<span style={{ color: "#7DD87A" }}>Fit</span>
      </div>
      <div style={{ fontSize: 17, color: "#B0B7BE", maxWidth: 380, lineHeight: 1.5, marginBottom: 40 }}>
        Training, nutrition, and body composition tracking.
        Built for people who want to see the numbers.
      </div>
      <div style={{ display: "flex", gap: 12, flexDirection: "column", width: "100%", maxWidth: 300 }}>
        <Link href="/login" style={{
          background: "#7DD87A", color: "#1A1D1F",
          padding: "14px 20px", borderRadius: 12,
          fontSize: 15, fontWeight: 700, textAlign: "center",
          textDecoration: "none",
        }}>Sign in</Link>
        <Link href="/login?mode=signup" style={{
          background: "transparent", color: "#7DD87A",
          border: "1.5px solid #7DD87A",
          padding: "14px 20px", borderRadius: 12,
          fontSize: 15, fontWeight: 700, textAlign: "center",
          textDecoration: "none",
        }}>Create account</Link>
      </div>
    </main>
  );
}
