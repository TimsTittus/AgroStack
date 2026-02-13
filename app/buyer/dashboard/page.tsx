"use client";

import { Navbar } from "@/components/Navbar";
import { Sidebar } from "./_components/Sidebar";
import { SummaryCards } from "./_components/SummaryCard";
import { FeaturedProducts } from "./_components/FeaturedProducts"
import { RecentOrders } from "./_components/RecentOrder";
import { ProductFilters } from "./_components/ProductFilter";
import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#f8faf6]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#d8f3dc] opacity-40 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-[#b7e4c7] opacity-30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#95d5b2] opacity-20 blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <div className="flex">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6"
            >
              <h1 className="text-2xl font-bold text-[#1a2e1a]">
                Welcome back Abin
              </h1>
              <p className="mt-1 text-sm text-[#5c7a5c]">
                Here&apos;s what&apos;s happening with your farm purchases today.
              </p>
            </motion.div>
            <SummaryCards />

            <div className="mt-8">
              <ProductFilters />
            </div>

            <div className="mt-6">
              <FeaturedProducts />
            </div>
            <div className="mt-8">
              <RecentOrders />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
