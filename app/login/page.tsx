"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { motion } from "motion/react";
import { Leaf, Loader2, Lock, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await authClient.signIn.email({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Invalid email or password");
        return;
      }

      if (data) {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbfcfb] px-4">
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#d8f3dc] blur-3xl opacity-60" />
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-[#b7e4c7] blur-3xl opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1b4332] shadow-xl shadow-[#1b4332]/20">
            <Leaf className="h-8 w-8 text-[#d8f3dc]" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#1a2e1a]">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-[#5c7a5c]">
            Fresh produce is just a login away.
          </p>
        </div>

        <div className="rounded-3xl border border-[#e8f0e4] bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5c7a5c] mb-2 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#7ca87c] group-focus-within:text-[#2d6a4f] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border border-[#e8f0e4] bg-white py-3 pl-10 pr-4 text-sm outline-hidden transition-all focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/5"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5c7a5c]">
                  Password
                </label>
                <Link href="#" className="text-[10px] font-bold text-[#2d6a4f] hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#7ca87c] group-focus-within:text-[#2d6a4f] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-[#e8f0e4] bg-white py-3 pl-10 pr-4 text-sm outline-hidden transition-all focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/5"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-600 border border-rose-100"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#1b4332] py-4 text-sm font-bold text-white shadow-lg shadow-[#1b4332]/20 transition-all hover:bg-[#2d6a4f] hover:shadow-xl active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-[#5c7a5c]">
              Don't have an account?{" "}
              <Link href="/register" className="font-bold text-[#2d6a4f] hover:underline">
                Create one for free
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-[#7ca87c] uppercase tracking-widest font-medium">
          Secure & Encrypted Farmer Network
        </p>
      </motion.div>
    </div>
  );
}

export default Login;