"use client";
import { SummaryCards } from "./_components/SummaryCard";
import { FeaturedProducts } from "./_components/FeaturedProducts"
import { RecentOrders } from "./_components/RecentOrder";
import { motion } from "motion/react";

export default function DashboardPage() {
  return (
   
         

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

            <div className="mt-6">
              <FeaturedProducts />
            </div>
            <div className="mt-8">
              <RecentOrders />
            </div>
          </main>
        
  );
}
