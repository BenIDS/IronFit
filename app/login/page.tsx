"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(searchParams.get("mode") === "signup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = supabaseBrowser();
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Check your email to confirm your account, then sign in.");
        setIsSignup(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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
    }}>
      <Link href="/" style={{ marginBottom: 32, fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>
        Iron<span style={{ color: "#7DD87A" }}>Fit</span>
      </Link>

      <form onSubmit={submit} style={{
        background: "#282D31",
        border: "1px solid #3A4046",
        borderRadius: 20,
        padding: 24,
        width: "100%",
        maxWidth: 400,
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
          {isSignup ? "Create account" : "Sign in"}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: "#B0B7BE", fontWeight: 500, display: "block", marginBottom: 6 }}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              background: "#22262A", border: "1px solid #3A4046", borderRadius: 10,
              color: "#E8EAED", fontSize: 15, padding: "12px 14px", width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 13, color: "#B0B7BE", fontWeight: 500, display: "block", marginBottom: 6 }}>Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              background: "#22262A", border: "1px solid #3A4046", borderRadius: 10,
              color: "#E8EAED", fontSize: 15, padding: "12px 14px", width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div style={{ background: "#E8877C22", color: "#E8877C", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ background: "#7DD87A22", color: "#7DD87A", padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            {info}
          </div>
        )}

        <button type="submit" disabled={loading} style={{
          background: "#7DD87A", color: "#1A1D1F", border: "none",
          borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700,
          width: "100%", opacity: loading ? 0.6 : 1,
        }}>
          {loading ? "…" : (isSignup ? "Create account" : "Sign in")}
        </button>

        <button
          type="button"
          onClick={() => { setIsSignup(!isSignup); setError(null); setInfo(null); }}
          style={{
            background: "transparent", color: "#8B9299", border: "none",
            fontSize: 13, marginTop: 16, width: "100%", textAlign: "center",
          }}
        >
          {isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </form>
    </main>
  );
}
