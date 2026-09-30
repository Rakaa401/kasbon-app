"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    if (isSignup) {
      setError("Akun berhasil dibuat. Silakan cek email untuk verifikasi.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Kasbon</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isSignup ? "Buat akun baru" : "Masuk ke akun kamu"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-zinc-900 px-4 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading
              ? "Memproses..."
              : isSignup
                ? "Daftar"
                : "Masuk"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsSignup((value) => !value);
            setError("");
          }}
          className="mt-4 w-full text-sm text-zinc-600 hover:text-zinc-900"
        >
          {isSignup
            ? "Sudah punya akun? Masuk"
            : "Belum punya akun? Daftar"}
        </button>
      </div>
    </main>
  );
}