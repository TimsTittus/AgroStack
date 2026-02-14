"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { 
  Leaf, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  ChevronRight, 
  Sprout, 
  ShoppingBag 
} from "lucide-react";
import Link from "next/link";

function Register() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"farmer" | "buyer">("farmer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const validate = () => {
    if (!name) return setError("Name is required");
    if (!email || !phone || !password || !confirmPassword) return setError("All fields are required");
    if (!/^\+?\d{7,15}$/.test(phone)) return setError("Enter a valid phone number");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoading(true);

    try {
      const { data, error: authError } = await authClient.signUp.email({
        email,
        name,
        phone,
        password,
        role,
      });

      if (authError) {
        setError(authError.message || "Registration failed");
        return;
      }
      if (data) router.push("/login");
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbfcfb] px-4 py-12">
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#d8f3dc] blur-3xl opacity-60" />
      <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-[#b7e4c7] blur-3xl opacity-40" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1b4332] shadow-lg shadow-[#1b4332]/20">
            <Leaf className="h-7 w-7 text-[#d8f3dc]" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#1a2e1a]">AgroStack</h1>
          <p className="mt-2 text-sm text-[#5c7a5c]">Connect with fresh local produce today.</p>
        </div>

        <div className="rounded-3xl border border-[#e8f0e4] bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="mb-6 grid grid-cols-2 gap-4 p-1 bg-gray-50 rounded-2xl border border-[#e8f0e4]">
              <button
                type="button"
                onClick={() => setRole("farmer")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                  role === "farmer" ? "bg-[#1b4332] text-white shadow-md" : "text-[#5c7a5c] hover:bg-gray-100"
                }`}
              >
                <Sprout size={16} /> I am a Farmer
              </button>
              <button
                type="button"
                onClick={() => setRole("buyer")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
                  role === "buyer" ? "bg-[#1b4332] text-white shadow-md" : "text-[#5c7a5c] hover:bg-gray-100"
                }`}
              >
                <ShoppingBag size={16} /> I am a Buyer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#5c7a5c] ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7ca87c]" size={16} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-[#e8f0e4] bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/5 outline-none transition-all"
                    placeholder="Abin Thomas"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#5c7a5c] ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7ca87c]" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-[#e8f0e4] bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/5 outline-none transition-all"
                    placeholder="abin@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#5c7a5c] ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7ca87c]" size={16} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#e8f0e4] bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/5 outline-none transition-all"
                  placeholder="+919964567890"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#5c7a5c] ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7ca87c]" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#e8f0e4] bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/5 outline-none transition-all"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#5c7a5c] ml-1">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7ca87c]" size={16} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-[#e8f0e4] bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/5 outline-none transition-all"
                    placeholder="••••••"
                  />
                </div>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 border border-rose-100">
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1b4332] py-4 text-sm font-black text-white shadow-xl shadow-[#1b4332]/20 transition-all hover:bg-[#2d6a4f] active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <>Create Account <ChevronRight size={18} /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-[#5c7a5c]">
            Already part of the network?{" "}
            <Link href="/login" className="font-black text-[#2d6a4f] hover:underline">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Register;