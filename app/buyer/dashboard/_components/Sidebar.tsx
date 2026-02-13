"use client";

import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  MessageCircle,
  Heart,
  CreditCard,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", route: "/buyer/dashboard" },
  { icon: ShoppingBag, label: "Browse Products", badge: "New", route: "/buyer/dashboard/products" },
  { icon: Package, label: "Orders", badge: "5", route: "/buyer/dashboard/orders" },
  { icon: MessageCircle, label: "Messages", badge: "2", route: "/buyer/dashboard/messages" },
  { icon: Heart, label: "Wishlist", route: "/buyer/dashboard/wishlist" },
  { icon: CreditCard, label: "Payments", route: "/buyer/dashboard/payments" },
  { icon: Settings, label: "Settings", route: "/buyer/dashboard/settings" },
];

export function Sidebar() {
  const [activeItem, setActiveItem] = useState("Dashboard");

  return (
    <aside className="glass-card sticky top-16 hidden h-[calc(100vh-4rem)] w-64 flex-col justify-between overflow-y-auto p-4 lg:flex">
      <nav className="flex flex-col gap-1.5">
        {navItems.map(({ icon: Icon, label, badge, route }) => {
          const isActive = activeItem === label;

          return (
            <Link
              key={label}
              href={route}
              onClick={() => setActiveItem(label)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-linear-to-r from-[#2d6a4f] to-[#40916c] text-white shadow-lg shadow-[#2d6a4f]/25"
                  : "text-[#5c7a5c] hover:bg-[#e8f0e4] hover:text-[#1a2e1a]"
              )}
            >
              <Icon
                className={cn(
                  "h-\[18px] w-\[18px] transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-white" : "text-[#7ca87c]"
                )}
              />
              <span className="flex-1">{label}</span>
              {badge && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-[#2d6a4f]/10 text-[#2d6a4f]"
                  )}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-2xl bg-linear-to-br from-[#d8f3dc] to-[#b7e4c7] p-4">
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#2d6a4f]/15">
          <TrendingUp className="h-4 w-4 text-[#2d6a4f]" />
        </div>
        <h4 className="text-sm font-semibold text-[#1a2e1a]">Season Sale</h4>
        <p className="mt-1 text-xs text-[#5c7a5c]">
          Get up to 25% off on fresh organic produce this week
        </p>
        <button className="mt-3 w-full rounded-lg bg-[#2d6a4f] py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-[#1b4332] hover:shadow-md">
          Browse Deals
        </button>
      </div>
    </aside>
  );
}
