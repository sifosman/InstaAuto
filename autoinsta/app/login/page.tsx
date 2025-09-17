"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { data, error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined } });
      if (error) throw error;
      setMessage("Check your email for a login link.");
    } catch (err: any) {
      setMessage(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined } });
      if (error) throw error;
    } catch (err: any) {
      setMessage(err?.message || "Google sign-in failed");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f7f5f0] to-[#ede8e0] p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-white/70 backdrop-blur p-6">
        <h1 className="text-xl font-semibold mb-2">Sign in</h1>
        <p className="text-sm text-gray-600 mb-4">Use your email to receive a magic link.</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded border px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-black text-white py-2 disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">or</div>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="mt-3 w-full rounded border bg-white py-2 disabled:opacity-60"
        >
          Continue with Google
        </button>

        {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
      </div>
    </main>
  );
}
