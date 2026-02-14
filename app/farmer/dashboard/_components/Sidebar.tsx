"use client";

import {
  BarChart3,
  ShoppingBag,
  Package,
  Sprout,
  Wallet,
  Settings,
  TrendingUp,
  Menu,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { icon: BarChart3, label: "Overview", route: "/farmer/dashboard/overview" },
  { icon: ShoppingBag, label: "Listings", route: "/farmer/dashboard/listings" },
  { icon: Package, label: "Orders", route: "/farmer/dashboard/orders" },
  { icon: Sprout, label: "Crops", route: "/farmer/dashboard/crops" },
  { icon: Wallet, label: "Wallet", route: "/farmer/dashboard/wallet" },
  { icon: Settings, label: "Settings", route: "/farmer/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => {
    const [hovered, setHovered] = useState<string | null>(null);

    return (
      <nav className="flex flex-col gap-1.5">
        {navItems.map(({ icon: Icon, label, route }) => {
          const isActive = hovered === label || pathname === route;
          return (
            <Link
              key={label}
              href={route}
              onClick={onClick}
              onMouseEnter={() => setHovered(label)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-linear-to-r from-[#2d6a4f] to-[#40916c] text-white shadow-lg shadow-[#2d6a4f]/25"
                  : "text-[#5c7a5c] hover:bg-[#e8f0e4] hover:text-[#1a2e1a]"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-transform duration-200 group-hover:scale-110", isActive ? "text-white" : "text-[#7ca87c]")} />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}
      </nav>
    );
  };

  const PromoCard = () => (
    <div className="mt-4 rounded-2xl bg-linear-to-br from-[#d8f3dc] to-[#b7e4c7] p-4">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#2d6a4f]/15">
        <TrendingUp className="h-4 w-4 text-[#2d6a4f]" />
      </div>
      <h4 className="text-sm font-semibold text-[#1a2e1a]">Season Sale</h4>
      <p className="mt-1 text-xs text-[#5c7a5c]">Get up to 25% off on fresh organic produce.</p>
      <button className="mt-3 w-full rounded-lg bg-[#2d6a4f] py-2 text-xs font-semibold text-white hover:bg-[#1b4332]">
        Browse Deals
      </button>
    </div>
  );

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2d6a4f] text-white shadow-xl">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-white p-4 pt-12">
            <NavLinks onClick={() => setOpen(false)} />
            <div className="mt-auto">
              <PromoCard />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <aside className="glass-card sticky top-16 hidden h-[calc(100vh-4rem)] w-64 flex-col justify-between overflow-y-auto p-4 lg:flex">
        <NavLinks />
        <PromoCard />
      </aside>
    </>
  );
}