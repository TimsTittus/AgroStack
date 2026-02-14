"use client";

import React from "react";
import { motion } from "framer-motion";
import { trpc } from "@/trpc/client";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  History,
  CreditCard 
} from "lucide-react";

export default function WalletPage() {
  const { data, isLoading } = trpc.user.getWalletInfo.useQuery();

  if (isLoading) return <WalletSkeleton />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a2e1a]">Digital Wallet</h1>
        <p className="text-sm text-[#5c7a5c]">Manage your funds and transaction history</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-3xl bg-[#1b4332] p-8 text-white shadow-2xl lg:col-span-2"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium opacity-80">Total Balance</span>
              <Wallet className="h-6 w-6 opacity-80" />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight">
                ₹{data?.walletBalance ?? 0}
              </span>
              <span className="text-lg font-medium opacity-60">INR</span>
            </div>

            <div className="mt-10 flex gap-4">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-[#1b4332] transition-transform hover:scale-[1.02] active:scale-95">
                <Plus size={18} /> Add Money
              </button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-bold backdrop-blur-md transition-all hover:bg-white/20">
                Withdraw
              </button>
            </div>
          </div>

          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[#2d6a4f] opacity-50 blur-3xl" />
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#52b788] opacity-20 blur-2xl" />
        </motion.div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[#e8f0e4] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#5c7a5c]">Linked Method</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
                <CreditCard className="text-[#2d6a4f]" size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1a2e1a]">HDFC Bank **** 4291</p>
                <p className="text-[10px] text-[#7ca87c]">Default payment method</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-[#e8f0e4] bg-[#fbfcfb] p-5">
            <p className="text-xs font-bold text-[#1b4332]">Need Help?</p>
            <p className="mt-1 text-[11px] text-[#5c7a5c]">Contact support for payment related issues.</p>
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <History size={18} className="text-[#2d6a4f]" />
            <h2 className="text-lg font-bold text-[#1a2e1a]">Recent Transactions</h2>
          </div>

          <div className="rounded-2xl border border-[#e8f0e4] bg-white shadow-sm overflow-hidden">
            {[
              { id: 1, type: "out", desc: "Organic Tomatoes", date: "Today, 12:40 PM", amt: "450" },
              { id: 2, type: "in", desc: "Refund - Sweet Corn", date: "Yesterday", amt: "120" },
              { id: 3, type: "out", desc: "Farm Eggs (2 Dozen)", date: "12 Feb 2026", amt: "240" },
            ].map((tx) => (
              <div key={tx.id} className="flex items-center justify-between border-b border-[#f0f4ee] p-4 last:border-0 hover:bg-[#f8faf6]">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    tx.type === "in" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                  }`}>
                    {tx.type === "in" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1a2e1a]">{tx.desc}</p>
                    <p className="text-xs text-[#7ca87c]">{tx.date}</p>
                  </div>
                </div>
                <p className={`text-sm font-black ${tx.type === "in" ? "text-emerald-600" : "text-gray-900"}`}>
                  {tx.type === "in" ? "+" : "-"} ₹{tx.amt}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WalletSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 animate-pulse">
      <div className="h-8 w-40 bg-gray-100 rounded mb-8" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-60 bg-gray-100 rounded-3xl lg:col-span-2" />
        <div className="h-60 bg-gray-50 rounded-3xl" />
      </div>
    </div>
  );
}