"use client";

import { Package, Truck, DollarSign, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { trpc } from "@/trpc/client";

export function SummaryCards() {
  const { data, isLoading } = trpc.user.getSummary.useQuery();

  if (isLoading) return <SummarySkeleton />;

  const stats = [
    {
      label: "Active Orders",
      value: data?.activeOrders ?? 0,
      sub: "Live tracking",
      icon: Package,
      color: "bg-[#2d6a4f]",
      glow: "shadow-[#2d6a4f]/20",
    },
    {
      label: "Pending Shipments",
      value: data?.pendingDeliveries ?? 0,
      sub: "Awaiting dispatch",
      icon: Truck,
      color: "bg-[#40916c]",
      glow: "shadow-[#40916c]/20",
    },
    {
      label: "Total Spent",
      value: `₹${data?.totalPurchases ?? 0}`,
      sub: "Lifetime purchases",
      icon: DollarSign,
      color: "bg-[#1b4332]",
      glow: "shadow-[#1b4332]/20",
    },
    {
      label: "Farmer Chat",
      value: data?.messages ?? 0,
      sub: "New messages",
      icon: MessageSquare,
      color: "bg-[#52b788]",
      glow: "shadow-[#52b788]/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
          className="group relative overflow-hidden rounded-3xl border border-[#e8f0e4] bg-white p-6 shadow-xs transition-all duration-300 hover:border-[#2d6a4f]/30 hover:shadow-xl hover:shadow-[#2d6a4f]/5"
        >
          <div className={`absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 ${stat.color}/10`} />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.color} ${stat.glow} shadow-lg transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7ca87c]/70">
                Summary
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#5c7a5c]">{stat.label}</p>
              <h3 className="text-3xl font-black tracking-tight text-[#1a2e1a]">
                {stat.value}
              </h3>
              <p className="mt-1 text-xs font-medium text-[#2d6a4f]/70">
                {stat.sub}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div 
          key={i} 
          className="relative h-44 overflow-hidden rounded-3xl border border-gray-100 bg-white p-6"
        >
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-gray-50/80 to-transparent" />
          
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-start">
              <div className="h-12 w-12 rounded-2xl bg-gray-100" />
              <div className="h-3 w-16 rounded-full bg-gray-50" />
            </div>
            <div className="space-y-3">
              <div className="h-3 w-24 rounded-full bg-gray-100" />
              <div className="h-8 w-16 rounded-lg bg-gray-100" />
              <div className="h-2 w-32 rounded-full bg-gray-50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}