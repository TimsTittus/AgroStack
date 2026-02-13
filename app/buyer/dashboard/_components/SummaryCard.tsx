"use client";

import { Package, Truck, DollarSign, MessageSquare } from "lucide-react";
import { motion } from "motion/react";

const stats = [
  {
    label: "Active Orders",
    value: "12",
    change: "+3 this week",
    icon: Package,
    linear: "from-[#2d6a4f] to-[#52b788]",
    bgGlow: "bg-[#2d6a4f]/10",
  },
  {
    label: "Pending Deliveries",
    value: "5",
    change: "2 arriving today",
    icon: Truck,
    linear: "from-[#40916c] to-[#74c69d]",
    bgGlow: "bg-[#40916c]/10",
  },
  {
    label: "Total Purchases",
    value: "$8,420",
    change: "+12% this month",
    icon: DollarSign,
    linear: "from-[#1b4332] to-[#2d6a4f]",
    bgGlow: "bg-[#1b4332]/10",
  },
  {
    label: "Farmer Messages",
    value: "8",
    change: "3 unread",
    icon: MessageSquare,
    linear: "from-[#52b788] to-[#95d5b2]",
    bgGlow: "bg-[#52b788]/10",
  },
];

export function SummaryCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          className="glass-card group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
          <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${stat.bgGlow} blur-2xl transition-all duration-500 group-hover:scale-150`} />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-medium tracking-wide text-[#5c7a5c] uppercase">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#1a2e1a]">
                {stat.value}
              </p>
              <p className="mt-1.5 text-xs text-[#7ca87c]">{stat.change}</p>
            </div>
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${stat.linear} shadow-lg transition-transform duration-300 group-hover:scale-110`}
            >
              <stat.icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
