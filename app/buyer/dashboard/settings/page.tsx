"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { 
  Lock, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "New passwords do not match" });
      return;
    }

    setLoading(true);
    const { error } = await authClient.changePassword({
      newPassword: newPassword,
      currentPassword: currentPassword,
      revokeOtherSessions: true,
    });

    if (error) {
      setStatus({ type: "error", message: error.message || "Failed to update password" });
    } else {
      setStatus({ type: "success", message: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#fbfcfb] p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-[#1a2e1a]">Account Settings</h1>
          <p className="text-sm text-[#5c7a5c]">Manage your security and account preferences</p>
        </header>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[2.5rem] border border-[#e8f0e4] bg-white shadow-sm"
          >
            <div className="border-b border-[#f0f4ee] bg-[#fbfcfb] px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#2d6a4f]" />
                <h2 className="text-sm font-black uppercase tracking-widest text-[#1a2e1a]">Password & Security</h2>
              </div>
              <Badge status={status?.type} />
            </div>

            <form onSubmit={handlePasswordChange} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#5c7a5c] ml-1">Current Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7ca87c] group-focus-within:text-[#2d6a4f]" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-[#e8f0e4] bg-white py-3.5 pl-12 pr-12 text-sm transition-all focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/5 outline-none"
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5c7a5c] ml-1">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7ca87c] group-focus-within:text-[#2d6a4f]" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-[#e8f0e4] bg-white py-3.5 pl-12 pr-4 text-sm transition-all focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/5 outline-none"
                      placeholder="Min. 8 characters"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5c7a5c] ml-1">Confirm New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7ca87c] group-focus-within:text-[#2d6a4f]" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-[#e8f0e4] bg-white py-3.5 pl-12 pr-4 text-sm transition-all focus:border-[#2d6a4f] focus:ring-4 focus:ring-[#2d6a4f]/5 outline-none"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
              </div>
              {status && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2 rounded-xl p-4 text-sm font-medium border ${
                    status.type === "success" 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                      : "bg-rose-50 border-rose-100 text-rose-700"
                  }`}
                >
                  {status.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  {status.message}
                </motion.div>
              )}

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-[#f0f4ee]">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center gap-2 text-xs font-bold text-[#5c7a5c] hover:text-[#2d6a4f] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showPassword ? "Hide Passwords" : "Show Passwords"}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto flex items-center justify-center gap-2 rounded-2xl bg-[#1b4332] px-8 py-3.5 text-sm font-black text-white shadow-xl shadow-[#1b4332]/20 transition-all hover:bg-[#2d6a4f] active:scale-[0.98] disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Update Password"}
                </button>
              </div>
            </form>
          </motion.div>
          <div className="rounded-2xl bg-[#f0f7ef] p-6 border border-[#d4e7d0]">
            <h3 className="text-sm font-bold text-[#1a2e1a]">Security Note</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5c7a5c]">
              Updating your password will automatically sign you out of all other active sessions on different devices to ensure your account remains secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ status }: { status?: "success" | "error" }) {
  if (!status) return <div className="h-2 w-2 rounded-full bg-gray-200" />;
  return (
    <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${
      status === "success" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
    }`} />
  );
}