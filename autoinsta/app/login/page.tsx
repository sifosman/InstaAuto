"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  // If we have been redirected back from a magic link, exchange code for a session
  useEffect(() => {
    (async () => {
      try {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error_description') || url.searchParams.get('error');
        if (error) {
          setMessage(error);
          return;
        }
        if (code) {
          setLoading(true);
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (exErr) {
            setMessage(exErr.message);
          } else {
            router.replace('/');
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { data, error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined } });
      if (error) throw error;
      setMessage("Check your email for a login link and 6-digit code. If you opened the link on another device, you can enter the code here to sign in on this device.");
    } catch (err: any) {
      setMessage(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (!email || !code) throw new Error("Enter your email and the 6-digit code");
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) throw error;
      router.replace('/');
    } catch (err: any) {
      setMessage(err?.message || "Code verification failed");
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
        <p className="text-sm text-gray-600 mb-4">Use your email to receive a magic link and a 6-digit code.</p>
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

        <div className="mt-6 border-t pt-4">
          <h2 className="text-sm font-medium mb-2">Have a 6-digit code?</h2>
          <form onSubmit={onVerifyCode} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded border px-3 py-2"
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full rounded border px-3 py-2"
            />
            <button type="submit" disabled={loading} className="w-full rounded bg-black text-white py-2 disabled:opacity-60">
              {loading ? 'Verifying…' : 'Verify code'}
            </button>
          </form>
        </div>

        {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
      </div>
    </main>
  );
}
